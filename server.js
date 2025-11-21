require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test database connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('✅ Database connected successfully');
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Validation functions
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

function isValidCode(code) {
  return /^[A-Za-z0-9]{6,8}$/.test(code);
}

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).json({ 
    ok: true, 
    version: '1.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Create a new short link
app.post('/api/links', async (req, res) => {
  try {
    const { target_url, code } = req.body;

    console.log('[CREATE] Request:', { target_url, code });

    if (!target_url || !isValidUrl(target_url)) {
      return res.status(400).json({ error: 'Invalid URL provided' });
    }

    let shortCode = code;
    if (shortCode) {
      if (!isValidCode(shortCode)) {
        return res.status(400).json({ error: 'Code must be 6-8 alphanumeric characters' });
      }
      
      const existing = await pool.query('SELECT id FROM links WHERE code = $1', [shortCode]);
      if (existing.rows.length > 0) {
        console.log('[CREATE] Code already exists:', shortCode);
        return res.status(409).json({ error: 'Code already exists' });
      }
    } else {
      // Generate unique code
      let attempts = 0;
      while (attempts < 10) {
        shortCode = generateCode();
        const existing = await pool.query('SELECT id FROM links WHERE code = $1', [shortCode]);
        if (existing.rows.length === 0) break;
        attempts++;
      }
      if (attempts === 10) {
        return res.status(500).json({ error: 'Failed to generate unique code' });
      }
    }

    const result = await pool.query(
      'INSERT INTO links (code, target_url, clicks) VALUES ($1, $2, 0) RETURNING *',
      [shortCode, target_url]
    );

    console.log('[CREATE] Link created:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('[CREATE] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all links
app.get('/api/links', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM links ORDER BY created_at DESC'
    );
    console.log(`[LIST] Retrieved ${result.rows.length} links`);
    res.json(result.rows);
  } catch (error) {
    console.error('[LIST] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a single link by code (for stats)
app.get('/api/links/:code', async (req, res) => {
  try {
    const { code } = req.params;
    console.log('[STATS] Fetching stats for code:', code);
    
    const result = await pool.query('SELECT * FROM links WHERE code = $1', [code]);
    
    if (result.rows.length === 0) {
      console.log('[STATS] Code not found:', code);
      return res.status(404).json({ error: 'Link not found' });
    }
    
    console.log('[STATS] Link found:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[STATS] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a link
app.delete('/api/links/:code', async (req, res) => {
  try {
    const { code } = req.params;
    console.log('[DELETE] Deleting code:', code);
    
    const result = await pool.query(
      'DELETE FROM links WHERE code = $1 RETURNING *',
      [code]
    );
    
    if (result.rows.length === 0) {
      console.log('[DELETE] Code not found:', code);
      return res.status(404).json({ error: 'Link not found' });
    }
    
    console.log('[DELETE] Link deleted:', result.rows[0]);
    res.json({ message: 'Link deleted successfully', link: result.rows[0] });
  } catch (error) {
    console.error('[DELETE] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve dashboard page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve stats page
app.get('/code/:code', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'stats.html'));
});

// REDIRECT ROUTE - This must be last to avoid conflicts
app.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    console.log(`[REDIRECT] ========================================`);
    console.log(`[REDIRECT] Accessing code: ${code}`);
    console.log(`[REDIRECT] Request URL: ${req.url}`);
    console.log(`[REDIRECT] Request method: ${req.method}`);
    
    // Validate code format
    if (!isValidCode(code)) {
      console.log(`[REDIRECT] Invalid code format: ${code}`);
      return res.status(404).send('Invalid link code');
    }
    
    // Get the link from database
    const result = await pool.query('SELECT * FROM links WHERE code = $1', [code]);
    
    if (result.rows.length === 0) {
      console.log(`[REDIRECT] Code not found in database: ${code}`);
      return res.status(404).send('Link not found');
    }
    
    const link = result.rows[0];
    console.log(`[REDIRECT] Found link:`, {
      code: link.code,
      target_url: link.target_url,
      clicks_before: link.clicks
    });
    
    // Update clicks and last_clicked timestamp
    const updateResult = await pool.query(
      'UPDATE links SET clicks = COALESCE(clicks, 0) + 1, last_clicked = NOW() WHERE code = $1 RETURNING clicks, last_clicked',
      [code]
    );
    
    console.log(`[REDIRECT] Updated successfully:`, {
      clicks_after: updateResult.rows[0].clicks,
      last_clicked: updateResult.rows[0].last_clicked
    });
    
    // Perform the redirect
    console.log(`[REDIRECT] Redirecting to: ${link.target_url}`);
    console.log(`[REDIRECT] ========================================`);
    
    res.redirect(302, link.target_url);
    
  } catch (error) {
    console.error('[REDIRECT] ❌ Error occurred:', error);
    console.error('[REDIRECT] Error details:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).send('Internal server error');
  }
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 TinyLink server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`❤️  Health: http://localhost:${PORT}/healthz`);
  console.log('='.repeat(50));
});