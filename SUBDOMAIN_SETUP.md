# Subdomain Routing Setup Guide

## Overview
This application uses subdomain-based routing where:
- **Main domain** (`abc.com`): Landing page, marketing content, public test
- **App subdomain** (`app.abc.com`): Dashboard, authentication, all app functionality

## Architecture

### Domain Structure
```
abc.com/
├── /                 → Landing page
├── /landing          → Landing page (redirect)
├── /test             → Public test (no auth required)
└── /auth/*           → Redirects to app.abc.com/auth/*
└── /dashboard        → Redirects to app.abc.com/dashboard
└── /agents           → Redirects to app.abc.com/agents
└── /voice-clone      → Redirects to app.abc.com/voice-clone
└── /settings         → Redirects to app.abc.com/settings

app.abc.com/
├── /                 → Redirects to /dashboard
├── /dashboard        → Main dashboard
├── /agents           → Agents management
├── /voice-clone      → Voice cloning
├── /settings         → Settings
├── /auth/signin      → Sign in page
├── /auth/signup      → Sign up page
├── /auth/forgot-password → Forgot password
└── /auth/reset-password → Reset password
```

## Vercel Deployment Setup

### 1. Deploy to Vercel
```bash
npm run build
vercel --prod
```

### 2. Configure Custom Domains in Vercel Dashboard

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Domains**
3. Add both domains:
   - `abc.com` (primary domain)
   - `app.abc.com` (subdomain)

### 3. DNS Configuration

Add these DNS records to your domain provider:

```
Type    Name    Value                    TTL
A       @       76.76.19.61             Auto
A       app     76.76.19.61             Auto
CNAME   www     abc.com                 Auto
```

*Note: Replace `76.76.19.61` with your actual Vercel IP or use Vercel's provided CNAME*

### 4. SSL Certificates

Vercel automatically provides SSL certificates for both domains. Ensure both:
- `https://abc.com`
- `https://app.abc.com`

are working with valid SSL.

## Local Development

### Running Locally
```bash
npm run dev
```

The app will run on `http://localhost:8080` and automatically detect it's in development mode.

### Testing Subdomain Logic Locally

To test subdomain routing locally, you can:

1. **Modify your hosts file** (`/etc/hosts`):
```
127.0.0.1   abc.local
127.0.0.1   app.abc.local
```

2. **Update the detection function** in `src/App.tsx` for local testing:
```typescript
const isAppSubdomain = () => {
  const hostname = window.location.hostname;
  return hostname.startsWith('app.') || 
         hostname === 'app.abc.local' || 
         hostname === 'localhost' || 
         hostname === '127.0.0.1';
};
```

3. **Access the app**:
   - Main site: `http://abc.local:8080`
   - App subdomain: `http://app.abc.local:8080`

## Code Structure

### Key Files
- `src/App.tsx` - Main routing logic with subdomain detection
- `src/components/layout/AppNav.tsx` - Navigation with subdomain-aware links
- `src/pages/Landing.tsx` - Landing page with app subdomain redirects
- `vercel.json` - Vercel configuration for SPA routing

### Subdomain Detection
```typescript
const isAppSubdomain = () => {
  const hostname = window.location.hostname;
  return hostname.startsWith('app.') || 
         hostname === 'localhost' || 
         hostname === '127.0.0.1';
};
```

### URL Generation
```typescript
const getAppUrl = (path: string = '') => {
  const currentHost = window.location.hostname;
  const protocol = window.location.protocol;
  
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    return path;
  }
  
  const mainDomain = currentHost.replace(/^app\./, '');
  return `${protocol}//app.${mainDomain}${path}`;
};
```

## Environment Variables

Create `.env` file:
```env
VITE_APP_DOMAIN=abc.com
VITE_ENV=production
VITE_LOCAL_DEV=false
```

## Troubleshooting

### Common Issues

1. **Infinite redirects**: Check subdomain detection logic
2. **CORS issues**: Ensure both domains are in the same Vercel project
3. **SSL certificate issues**: Wait for Vercel to provision certificates
4. **DNS propagation**: DNS changes can take up to 48 hours

### Testing Checklist

- [ ] `abc.com` shows landing page
- [ ] `abc.com/dashboard` redirects to `app.abc.com/dashboard`
- [ ] `app.abc.com` redirects to `app.abc.com/dashboard`
- [ ] `app.abc.com/auth/signin` shows sign in page
- [ ] Navigation buttons work correctly on both domains
- [ ] SSL certificates are valid for both domains

## Production Deployment

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

3. **Configure domains** in Vercel dashboard

4. **Update DNS** records

5. **Test all routes** on both domains

## Security Considerations

- Both domains serve the same application
- Authentication works across subdomains
- HTTPS is enforced on both domains
- Proper CORS configuration for API calls
