# Bus Ticket Booking System - Deployment Instructions

## If Vercel is not working, try these alternatives:

### Option 1: GitHub Pages (Easiest)
1. Go to your GitHub repository
2. Click Settings > Pages
3. Source: Deploy from a branch
4. Branch: main > / (root) > Save
5. Copy `dist` folder contents to root of repository
6. Your site will be available at: `https://yourusername.github.io/Ticket/`

### Option 2: Netlify (Drag & Drop)
1. Go to netlify.com
2. Drag and drop the `dist` folder
3. Your site will be instantly live

### Option 3: Firebase Hosting
1. Go to console.firebase.google.com
2. Create new project
3. Go to Hosting > Get Started
4. Deploy the `dist` folder

### Option 4: Local Testing
1. Open the `dist` folder
2. Double-click `index.html`
3. Or use Python: `python -m http.server 8000`
4. Or use VS Code Live Server extension

## Test URL:
- Try accessing: `https://your-vercel-app-url.vercel.app/test.html`
- If test.html works but index.html doesn't, there's a routing issue

## Files Ready:
- `dist/index.html` - Main application
- `dist/test.html` - Simple test page
- `vercel.json` - Vercel configuration

## Login Credentials:
- Admin: admin / admin123
- Conductor: conductor / conductor123
