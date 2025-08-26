#!/bin/bash

# VoiceCake Widget Deployment Script
# This script helps you deploy the widget to various platforms

set -e

echo "🎤 VoiceCake Widget Deployment Script"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if widget file exists
if [ ! -f "public/voicecake-widget.js" ]; then
    print_error "Widget file not found at public/voicecake-widget.js"
    exit 1
fi

print_status "Widget file found"

# Get deployment target
echo ""
echo "Choose deployment target:"
echo "1) Vercel (recommended)"
echo "2) Netlify"
echo "3) AWS S3"
echo "4) Custom server"
echo "5) Local development"

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        deploy_vercel
        ;;
    2)
        deploy_netlify
        ;;
    3)
        deploy_s3
        ;;
    4)
        deploy_custom
        ;;
    5)
        setup_local
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

deploy_vercel() {
    print_info "Deploying to Vercel..."
    
    # Check if vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    # Create vercel.json if it doesn't exist
    if [ ! -f "vercel.json" ]; then
        cat > vercel.json << EOF
{
  "version": 2,
  "builds": [
    {
      "src": "public/**/*",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/voicecake-widget.js",
      "dest": "/public/voicecake-widget.js",
      "headers": {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/javascript"
      }
    },
    {
      "src": "/widget-demo.html",
      "dest": "/public/widget-demo.html"
    }
  ]
}
EOF
        print_status "Created vercel.json configuration"
    fi
    
    # Deploy
    vercel --prod
    
    print_status "Deployment complete!"
    print_info "Your widget is now available at: https://your-project.vercel.app/voicecake-widget.js"
    print_info "Demo page: https://your-project.vercel.app/widget-demo.html"
}

deploy_netlify() {
    print_info "Deploying to Netlify..."
    
    # Check if netlify CLI is installed
    if ! command -v netlify &> /dev/null; then
        print_warning "Netlify CLI not found. Installing..."
        npm install -g netlify-cli
    fi
    
    # Create netlify.toml if it doesn't exist
    if [ ! -f "netlify.toml" ]; then
        cat > netlify.toml << EOF
[build]
  publish = "public"
  
[[headers]]
  for = "/voicecake-widget.js"
  [headers.values]
    Access-Control-Allow-Origin = "*"
    Content-Type = "application/javascript"
    Cache-Control = "public, max-age=31536000"
EOF
        print_status "Created netlify.toml configuration"
    fi
    
    # Deploy
    netlify deploy --prod --dir=public
    
    print_status "Deployment complete!"
    print_info "Your widget is now available at: https://your-site.netlify.app/voicecake-widget.js"
    print_info "Demo page: https://your-site.netlify.app/widget-demo.html"
}

deploy_s3() {
    print_info "Deploying to AWS S3..."
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI not found. Please install it first: https://aws.amazon.com/cli/"
        exit 1
    fi
    
    read -p "Enter S3 bucket name: " bucket_name
    read -p "Enter AWS region (e.g., us-east-1): " region
    
    # Create bucket if it doesn't exist
    aws s3 mb s3://$bucket_name --region $region 2>/dev/null || true
    
    # Configure bucket for static website hosting
    aws s3 website s3://$bucket_name --index-document index.html --error-document error.html
    
    # Upload files
    aws s3 sync public/ s3://$bucket_name --delete --cache-control "max-age=31536000"
    
    # Set CORS policy
    cat > cors.json << EOF
{
    "CORSRules": [
        {
            "AllowedOrigins": ["*"],
            "AllowedMethods": ["GET"],
            "AllowedHeaders": ["*"],
            "MaxAgeSeconds": 3000
        }
    ]
}
EOF
    
    aws s3api put-bucket-cors --bucket $bucket_name --cors-configuration file://cors.json
    rm cors.json
    
    print_status "Deployment complete!"
    print_info "Your widget is now available at: http://$bucket_name.s3-website-$region.amazonaws.com/voicecake-widget.js"
    print_info "Demo page: http://$bucket_name.s3-website-$region.amazonaws.com/widget-demo.html"
}

deploy_custom() {
    print_info "Custom server deployment..."
    
    echo ""
    echo "For custom server deployment:"
    echo "1. Upload the contents of the 'public' folder to your web server"
    echo "2. Ensure the server is configured to serve JavaScript files with correct MIME type"
    echo "3. Configure CORS headers if needed"
    echo ""
    echo "Required files:"
    echo "- voicecake-widget.js"
    echo "- widget-demo.html (optional, for testing)"
    echo ""
    echo "CORS headers needed:"
    echo "Access-Control-Allow-Origin: *"
    echo "Content-Type: application/javascript"
    echo ""
    
    read -p "Enter your server URL (e.g., https://example.com): " server_url
    
    print_status "Widget URL will be: $server_url/voicecake-widget.js"
    print_info "Add this to your website:"
    echo "<script src=\"$server_url/voicecake-widget.js\" data-agent-id=\"YOUR_AGENT_ID\"></script>"
}

setup_local() {
    print_info "Setting up local development..."
    
    # Check if Python is available
    if command -v python3 &> /dev/null; then
        print_status "Starting local server with Python..."
        cd public
        python3 -m http.server 8000
    elif command -v python &> /dev/null; then
        print_status "Starting local server with Python..."
        cd public
        python -m SimpleHTTPServer 8000
    elif command -v node &> /dev/null; then
        print_status "Starting local server with Node.js..."
        npx http-server public -p 8000
    else
        print_error "No suitable server found. Please install Python or Node.js"
        exit 1
    fi
    
    print_status "Local server started!"
    print_info "Widget URL: http://localhost:8000/voicecake-widget.js"
    print_info "Demo page: http://localhost:8000/widget-demo.html"
    print_info "Press Ctrl+C to stop the server"
}

# Generate integration code
echo ""
print_info "Integration code for your website:"
echo "========================================"

echo ""
echo "Basic integration:"
echo '<script src="YOUR_WIDGET_URL" data-agent-id="YOUR_AGENT_ID"></script>'

echo ""
echo "With customization:"
echo '<script src="YOUR_WIDGET_URL" data-agent-id="YOUR_AGENT_ID" data-position="bottom-right" data-theme="dark" data-size="large"></script>'

echo ""
echo "Programmatic initialization:"
cat << 'EOF'
<script>
const script = document.createElement('script');
script.src = 'YOUR_WIDGET_URL';
script.onload = function() {
    window.VoiceCakeWidget.init({
        agentId: 'YOUR_AGENT_ID',
        position: 'bottom-right',
        theme: 'dark',
        size: 'large'
    });
};
document.head.appendChild(script);
</script>
EOF

echo ""
print_status "Deployment script completed!"
print_info "Remember to:"
echo "1. Replace YOUR_WIDGET_URL with your actual widget URL"
echo "2. Replace YOUR_AGENT_ID with your actual VoiceCake agent ID"
echo "3. Test the widget on your website"
echo "4. Configure CORS if needed"
