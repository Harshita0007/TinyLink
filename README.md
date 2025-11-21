# TinyLink 🔗

Hey! This is TinyLink - a simple URL shortener I built. Think bit.ly, but simpler. You paste a long URL, and it gives you a short one. That's it!

## 🌐 Live Demo

**Website**: [Add your deployed link here]  
**Try it**: Go to the link above and shorten a URL!

## What Does It Do?

- **Shorten URLs** - Turn `https://example.com/very-long-url-that-nobody-wants-to-type` into `yoursite.com/abc123`
- **Custom Codes** - Want `yoursite.com/docs` instead of random letters? You got it!
- **Track Clicks** - See how many people clicked your link
- **Search Links** - Can't remember a link? Just search for it
- **Works Everywhere** - Phone, tablet, laptop - it works on all of them

## 🛠️ Built With

**Backend Stuff:**
- Node.js & Express (the server)
- PostgreSQL (where links are stored)
- Hosted on Render (free!)

**Frontend Stuff:**
- Just HTML, CSS, and JavaScript
- No fancy frameworks needed
- Purple gradient because why not? 💜

## 🚀 Want to Run It Yourself?

### You'll Need:
- Node.js installed (download from nodejs.org)
- A PostgreSQL database (I used Neon - it's free)

### Steps:

**1. Download the code**
```bash
git clone https://github.com/yourusername/tinylink.git
cd tinylink
```

**2. Install stuff**
```bash
npm install
```

**3. Set up your database**

Create a file called `.env` and add:
```
DATABASE_URL=your_postgres_connection_string_here
PORT=3000
```

**4. Set up the database table**
```bash
npm run init-db
```

**5. Start it up!**
```bash
npm run dev
```

**6. Open your browser**

Go to `http://localhost:3000` and you should see it!

## 📂 How It's Organized

```
tinylink/
├── public/              # All the frontend stuff
│   ├── index.html       # Main page
│   ├── stats.html       # Stats page
│   └── styles.css       # Makes it pretty
├── scripts/
│   └── init-db.js       # Sets up database
├── server.js            # All the backend logic
└── package.json         # Lists what we need
```

## 🎯 How to Use It

### Creating a Short Link

1. Go to the homepage
2. Paste your long URL
3. (Optional) Type a custom code you want (like "mylink")
4. Click "Create Short Link"
5. Done! Copy and share your short link

### Viewing Stats

1. Click the "Stats" button next to any link
2. See how many people clicked it
3. Check when it was last used

### Searching Links

Just type in the search box - it'll filter your links as you type!

## 🔌 API Endpoints

If you want to use this programmatically:

**Create a link:**
```bash
curl -X POST http://localhost:3000/api/links \
  -H "Content-Type: application/json" \
  -d '{"target_url": "https://google.com", "code": "mylink"}'
```

**Get all links:**
```bash
curl http://localhost:3000/api/links
```

**Check if server is running:**
```bash
curl http://localhost:3000/healthz
```

## 🚢 Deploying to the Internet

### Using Render (Free & Easy)

1. Push your code to GitHub
2. Go to render.com and sign up
3. Create a new "Web Service"
4. Connect your GitHub repo
5. Add your database URL in environment variables
6. Click Deploy!

It takes about 2-3 minutes, and boom - you're live!

## 🐛 Common Problems & Fixes

**"Can't connect to database"**
- Double-check your DATABASE_URL in the .env file
- Make sure your database is actually running

**"Port 3000 is already in use"**
- Something else is using that port
- Either stop that app or change PORT in .env to 3001

**"Link isn't working after I created it"**
- Wait a second and refresh - databases aren't instant!
- Check if the link actually saved (look in the table)

**"Clicks aren't counting"**
- You need to actually visit the SHORT link, not the stats page
- Try: `http://localhost:3000/yourcode` in a new tab

## 📊 Database

The database has just one table with these fields:
- `code` - The short code (like "abc123")
- `target_url` - Where it redirects to
- `clicks` - How many times it's been used
- `last_clicked` - When someone last clicked it
- `created_at` - When you made it

Super simple!

## ⚡ Performance Notes

- Usually responds in under 50ms
- Redirects happen in about 30ms
- If using Render's free tier, first visit after 15 minutes might be slow (it goes to sleep)
