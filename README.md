# 🔗 TinyLink - URL Shortener

A modern, full-stack URL shortening service built with Node.js, Express, and PostgreSQL. Create short, memorable links and track their performance with detailed analytics.


## 🌐 Live Demo

**Production URL**: [Your Render URL Here]

**Health Check**: [Your URL]/healthz

## ✨ Features

- ✅ **Create Short Links** - Convert long URLs into short, shareable links
- ✅ **Custom Codes** - Choose your own custom short codes (6-8 characters)
- ✅ **Auto-Generation** - Automatically generate unique codes if none provided
- ✅ **Click Tracking** - Track total clicks and last access time
- ✅ **Statistics Dashboard** - View detailed analytics for each link
- ✅ **Search & Filter** - Find links quickly by code or URL
- ✅ **Delete Links** - Remove links when no longer needed
- ✅ **HTTP 302 Redirects** - Fast, efficient redirects
- ✅ **Responsive Design** - Works perfectly on all devices
- ✅ **Health Monitoring** - Built-in health check endpoint

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database (Neon)
- **pg** - PostgreSQL client
- **dotenv** - Environment configuration
- **cors** - Cross-origin resource sharing

### Frontend
- **HTML5** - Markup
- **CSS3** - Styling with custom properties
- **Vanilla JavaScript** - Client-side logic
- **Fetch API** - HTTP requests

### Hosting
- **Render** - Application hosting
- **Neon** - Serverless PostgreSQL database

## 📁 Project Structure

```
tinylink/
├── public/
│   ├── index.html          # Dashboard page
│   ├── stats.html          # Statistics page
│   ├── styles.css          # Global styles
│   ├── dashboard.js        # Dashboard logic
│   └── stats.js            # Stats page logic
├── scripts/
│   └── init-db.js          # Database initialization
├── server.js               # Express server & API routes
├── package.json            # Dependencies & scripts
├── .env                    # Environment variables (not in repo)
├── .env.example            # Environment template
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js v18 or higher
- PostgreSQL database (or Neon account)
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/tinylink.git
cd tinylink
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:
```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
PORT=3000
BASE_URL=http://localhost:3000
NODE_ENV=development
```

4. **Initialize database**
```bash
npm run init-db
```

5. **Start the development server**
```bash
npm run dev
```

6. **Open your browser**

Visit: http://localhost:3000

## 📡 API Endpoints

### Health Check
```http
GET /healthz
```
Returns server health status and uptime.

**Response (200)**:
```json
{
  "ok": true,
  "version": "1.0",
  "uptime": 1234.56,
  "timestamp": "2025-11-21T10:30:00.000Z"
}
```

### Create Link
```http
POST /api/links
Content-Type: application/json

{
  "target_url": "https://example.com/very-long-url",
  "code": "mycode"  
}
```

**Response (201)**:
```json
{
  "id": 1,
  "code": "mycode",
  "target_url": "https://example.com/very-long-url",
  "clicks": 0,
  "last_clicked": null,
  "created_at": "2025-11-21T10:30:00.000Z"
}
```

**Error (409)** - Code already exists:
```json
{
  "error": "Code already exists"
}
```

### Get All Links
```http
GET /api/links
```

**Response (200)**:
```json
[
  {
    "id": 1,
    "code": "mycode",
    "target_url": "https://example.com",
    "clicks": 42,
    "last_clicked": "2025-11-21T10:30:00.000Z",
    "created_at": "2025-11-20T10:30:00.000Z"
  }
]
```

### Get Link Statistics
```http
GET /api/links/:code
```

**Response (200)**: Same as single link object

**Error (404)**:
```json
{
  "error": "Link not found"
}
```

### Delete Link
```http
DELETE /api/links/:code
```

**Response (200)**:
```json
{
  "message": "Link deleted successfully",
  "link": 
}
```

### Redirect
```http
GET /:code
```

**Response**: HTTP 302 redirect to target URL

**Error (404)**: "Link not found"

##  Features Walkthrough

### 1. Create a Short Link

1. Enter your long URL in the "Target URL" field
2. (Optional) Enter a custom code (6-8 characters)
3. Click "Create Short Link"
4. Your short link is generated and ready to share!

### 2. View Statistics

1. Click "Stats" button next to any link
2. View:
   - Total clicks
   - Last clicked time
   - Creation date
   - Full target URL

### 3. Search Links

Use the search bar to filter links by:
- Short code
- Target URL

### 4. Delete Links

Click the "Delete" button to permanently remove a link. The short code will return 404 after deletion.

##  Security Features

- **Input Validation** - All inputs validated on client and server
- **XSS Prevention** - HTML escaping on client-side rendering
- **SQL Injection Protection** - Parameterized queries
- **CORS Enabled** - Configured for secure cross-origin requests
- **SSL/TLS** - Database connections use SSL

##  Testing

### Manual Testing Checklist

- [ ] Health check returns 200: `GET /healthz`
- [ ] Create link with auto-generated code
- [ ] Create link with custom code
- [ ] Duplicate code returns 409 error
- [ ] Redirect increments click count
- [ ] Stats page shows accurate data
- [ ] Delete link works correctly
- [ ] Deleted link returns 404
- [ ] Search/filter functionality works
- [ ] Responsive design on mobile

### Test Commands

```bash
# Test health endpoint
curl http://localhost:3000/healthz

# Create a link
curl -X POST http://localhost:3000/api/links \
  -H "Content-Type: application/json" \
  -d '{"target_url":"https://google.com","code":"test01"}'

# Get all links
curl http://localhost:3000/api/links

# Test redirect (should redirect)
curl -L http://localhost:3000/test01
```

## Database Schema

```sql
CREATE TABLE links (
  id SERIAL PRIMARY KEY,
  code VARCHAR(8) UNIQUE NOT NULL,
  target_url TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  last_clicked TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_links_code ON links(code);
```

##  Deployment

### Deploy to Render

1. **Push to GitHub**
```bash
git add .
git commit -m "Deploy to Render"
git push origin main
```

2. **Create Web Service on Render**
- Connect your GitHub repository
- Set build command: `npm install && npm run init-db`
- Set start command: `npm start`
- Add environment variables

3. **Environment Variables**
```env
DATABASE_URL=your_neon_postgres_url
BASE_URL=https://your-app.onrender.com
NODE_ENV=production
```

4. **Deploy**
- Click "Create Web Service"
- Wait for deployment to complete

### Deploy to Railway

1. Install Railway CLI or use web dashboard
2. Connect GitHub repository
3. Add PostgreSQL database or use Neon
4. Set environment variables
5. Deploy automatically

##  Troubleshooting

### Database Connection Issues

**Problem**: Cannot connect to database

**Solution**:
- Verify `DATABASE_URL` is correct
- Check Neon database is active (not suspended)
- Ensure SSL mode is enabled

### Port Already in Use

**Problem**: Error: listen EADDRINUSE :::3000

**Solution**:
```bash
# Find and kill process on port 3000
npx kill-port 3000
```

Or change PORT in `.env`:
```env
PORT=3001
```

### Build Fails on Render

**Problem**: Build command fails

**Solution**:
- Check `package.json` is valid JSON
- Ensure all dependencies are listed
- Verify `npm install` works locally
- Check Render build logs for specific errors

##  Performance

- **Average Response Time**: < 50ms
- **Database Query Time**: < 10ms
- **Redirect Speed**: < 30ms
- **Cold Start (Render Free)**: ~30 seconds