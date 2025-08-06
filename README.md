# Voice Cake - Voice AI Made Simple

## Project info

**Voice Cake** is a powerful platform for creating, managing, and deploying AI voice agents across multiple channels including WhatsApp, voice calls, and web platforms.

## Features

- **AI Voice Agents**: Create intelligent voice assistants that understand and respond naturally
- **Multi-Channel Support**: Deploy across WhatsApp, voice calls, and web platforms seamlessly
- **Voice Cloning**: Clone your voice or choose from premium voice options
- **Enterprise Ready**: Secure, scalable, and compliant with industry standards
- **Real-time Analytics**: Monitor and analyze your voice agent performance
- **Sub-250ms Latency**: Ultra-fast response times for natural conversations

## Development

**Use your preferred IDE**

Clone this repo and work locally with your preferred development environment.

Requirements: Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd voice-cake

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## Deployment

This project is configured for deployment on Vercel with subdomain routing:

- Main domain: Landing page and marketing content
- App subdomain: Dashboard and application features

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
VITE_APP_DOMAIN=yourdomain.com
VITE_ENV=production
VITE_LOCAL_DEV=false
```

### Deploy to Vercel

1. Connect your repository to Vercel
2. Configure environment variables
3. Deploy

### Custom Domain Setup

To set up custom domain with subdomain routing:

1. Add your domain in Vercel dashboard
2. Configure DNS records:
   - A record: @ → Vercel IP
   - CNAME record: app → cname.vercel-dns.com
   - CNAME record: www → cname.vercel-dns.com

3. Update `VITE_APP_DOMAIN` environment variable

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
└── types/              # TypeScript type definitions
```

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Fonts**: Roboto (default), Noto Serif (headings)
- **Icons**: Lucide React
- **Routing**: React Router
- **Build Tool**: Vite
