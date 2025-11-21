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

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

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

app.get('/healthz', (req, res) => {
  res.status(200).json({ 
    ok: true, 
    version: '1.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.post('/api/links', async (req, res) => {
  try {
    const { target_url, code } = req.body;

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
        return res.status(409).json({ error: 'Code already exists' });
      }
    } else {
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
      'INSERT INTO links (code, target_url) VALUES ($1, $2) RETURNING *',
      [shortCode, target_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/links', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM links ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching links:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/links/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const result = await pool.query('SELECT * FROM links WHERE code = $1', [code]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/links/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const result = await pool.query(
      'DELETE FROM links WHERE code = $1 RETURNING *',
      [code]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }
    
    res.json({ message: 'Link deleted successfully', link: result.rows[0] });
  } catch (error) {
    console.error('Error deleting link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/code/:code', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'stats.html'));
});

app.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    const result = await pool.query('SELECT * FROM links WHERE code = $1', [code]);
    
    if (result.rows.length === 0) {
      return res.status(404).send('Link not found');
    }
    
    const link = result.rows[0];
    
    await pool.query(
      'UPDATE links SET clicks = clicks + 1, last_clicked = CURRENT_TIMESTAMP WHERE code = $1',
      [code]
    );
    
    res.redirect(302, link.target_url);
  } catch (error) {
    console.error('Error redirecting:', error);
    res.status(500).send('Internal server error');
  }
});

app.listen(PORT, () => {
  console.log(`TinyLink server running on port ${PORT}`);
  console.log(`Dashboard: http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/healthz`);
});