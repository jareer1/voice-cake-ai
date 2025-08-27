#!/bin/bash

# VoiceCake Widget Deployment Script
# This script helps you deploy the widget to various platforms

set -e

echo "🎙️ VoiceCake Widget Deployment Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "voicecake-widget.js" ]; then
    print_error "voicecake-widget.js not found. Please run this script from the widget-deploy directory."
    exit 1
fi

# Function to update production URLs
update_urls() {
    print_status "Updating production URLs..."
    
    read -p "Enter your production API domain (e.g., api.voicecake.com): " API_DOMAIN
    read -p "Enter your production WebSocket domain (e.g., ws.voicecake.com): " WS_DOMAIN
    
    if [ -z "$API_DOMAIN" ] || [ -z "$WS_DOMAIN" ]; then
        print_error "Both API and WebSocket domains are required."
        exit 1
    fi
    
    # Update URLs in the widget file
    sed -i.bak "s|https://your-production-domain.com|https://$API_DOMAIN|g" voicecake-widget.js
    sed -i.bak "s|wss://your-production-domain.com|wss://$WS_DOMAIN|g" voicecake-widget.js
    
    print_success "Production URLs updated!"
    print_status "API URL: https://$API_DOMAIN"
    print_status "WebSocket URL: wss://$WS_DOMAIN"
}

# Function to deploy to Vercel
deploy_vercel() {
    print_status "Deploying to Vercel..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    # Create vercel.json if it doesn't exist
    if [ ! -f "vercel.json" ]; then
        cat > vercel.json << EOF
{
  "version": 2,
  "builds": [
    {
      "src": "*.js",
      "use": "@vercel/static"
    },
    {
      "src": "*.html",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
EOF
        print_status "Created vercel.json configuration"
    fi
    
    # Deploy
    vercel --prod --yes
    
    print_success "Deployed to Vercel!"
    print_status "Your widget URL: https://your-project.vercel.app/voicecake-widget.js"
}

# Function to deploy to Netlify
deploy_netlify() {
    print_status "Deploying to Netlify..."
    
    # Check if Netlify CLI is installed
    if ! command -v netlify &> /dev/null; then
        print_error "Netlify CLI not found. Installing..."
        npm install -g netlify-cli
    fi
    
    # Create netlify.toml if it doesn't exist
    if [ ! -f "netlify.toml" ]; then
        cat > netlify.toml << EOF
[build]
  publish = "."

[[headers]]
  for = "/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
    Access-Control-Allow-Methods = "GET, POST, OPTIONS"
    Access-Control-Allow-Headers = "Content-Type"
EOF
        print_status "Created netlify.toml configuration"
    fi
    
    # Deploy
    netlify deploy --prod --dir=.
    
    print_success "Deployed to Netlify!"
}

# Function to deploy to GitHub Pages
deploy_github() {
    print_status "Deploying to GitHub Pages..."
    
    read -p "Enter your GitHub username: " GITHUB_USERNAME
    read -p "Enter your repository name: " REPO_NAME
    
    if [ -z "$GITHUB_USERNAME" ] || [ -z "$REPO_NAME" ]; then
        print_error "GitHub username and repository name are required."
        exit 1
    fi
    
    # Initialize git if not already done
    if [ ! -d ".git" ]; then
        git init
        git add .
        git commit -m "Initial widget release"
        git branch -M main
        git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
        git push -u origin main
    else
        git add .
        git commit -m "Update widget"
        git push
    fi
    
    print_success "Deployed to GitHub!"
    print_status "Your widget URL: https://$GITHUB_USERNAME.github.io/$REPO_NAME/voicecake-widget.js"
    print_status "jsDelivr URL: https://cdn.jsdelivr.net/gh/$GITHUB_USERNAME/$REPO_NAME@main/voicecake-widget.js"
}

# Function to test the deployment
test_deployment() {
    print_status "Testing deployment..."
    
    read -p "Enter your widget URL: " WIDGET_URL
    
    if [ -z "$WIDGET_URL" ]; then
        print_error "Widget URL is required."
        exit 1
    fi
    
    # Create a test HTML file
    cat > test-deployment.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>VoiceCake Widget Test</title>
</head>
<body>
    <h1>VoiceCake Widget Test</h1>
    <p>Testing widget from: $WIDGET_URL</p>
    
    <script src="$WIDGET_URL" 
            data-agent-id="49" 
            data-position="bottom-right" 
            data-theme="light">
    </script>
    
    <script>
        setTimeout(() => {
            if (window.VoiceCakeWidget) {
                console.log('✅ Widget loaded successfully!');
                alert('✅ Widget loaded successfully!');
            } else {
                console.error('❌ Widget failed to load');
                alert('❌ Widget failed to load');
            }
        }, 3000);
    </script>
</body>
</html>
EOF
    
    print_success "Test file created: test-deployment.html"
    print_status "Open this file in your browser to test the widget"
}

# Main menu
show_menu() {
    echo ""
    echo "Choose a deployment option:"
    echo "1) Update production URLs"
    echo "2) Deploy to Vercel"
    echo "3) Deploy to Netlify"
    echo "4) Deploy to GitHub Pages"
    echo "5) Test deployment"
    echo "6) Exit"
    echo ""
}

# Main script
main() {
    while true; do
        show_menu
        read -p "Enter your choice (1-6): " choice
        
        case $choice in
            1)
                update_urls
                ;;
            2)
                deploy_vercel
                ;;
            3)
                deploy_netlify
                ;;
            4)
                deploy_github
                ;;
            5)
                test_deployment
                ;;
            6)
                print_success "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid choice. Please enter 1-6."
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Run main function
main
