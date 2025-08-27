# VoiceCake Widget - Production Deployment

This folder contains the production-ready VoiceCake widget that can be deployed to any CDN and used as a simple script tag on any website.

## 🚀 Quick Start

### 1. Update Production URLs

Before deploying, update the production URLs in `voicecake-widget.js`:

```javascript
// Replace these with your actual production server URLs
apiBaseUrl: 'https://your-production-domain.com/api/v1',
wsBaseUrl: 'wss://your-production-domain.com',
```

### 2. Deploy to CDN

Choose one of these deployment options:

#### Option A: Deploy to Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd widget-deploy
vercel --prod
```

#### Option B: Deploy to Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd widget-deploy
netlify deploy --prod --dir=.
```

#### Option C: Deploy to GitHub Pages
```bash
# Create a new repository
# Upload the widget-deploy folder contents
# Enable GitHub Pages in repository settings
# Use: https://yourusername.github.io/repository-name/voicecake-widget.js
```

#### Option D: Use jsDelivr CDN
```bash
# Push to GitHub
git init
git add .
git commit -m "Initial widget release"
git remote add origin https://github.com/yourusername/voicecake-widget.git
git push -u origin main

# Use: https://cdn.jsdelivr.net/gh/yourusername/voicecake-widget@main/voicecake-widget.js
```

### 3. Test Your Deployment

Open `demo.html` in your browser to test the widget functionality.

## 📋 Client Integration

### Simple Script Tag (Most Common)

Your clients just need to add this one line to their website's `<head>` section:

```html
<script src="https://your-cdn-domain.com/voicecake-widget.js" 
        data-agent-id="THEIR_AGENT_ID" 
        data-position="bottom-right" 
        data-theme="light">
</script>
```

### Configuration Options

| Attribute | Description | Options | Default |
|-----------|-------------|---------|---------|
| `data-agent-id` | Your unique agent identifier | Any string | Required |
| `data-position` | Widget position on screen | bottom-right, bottom-left, top-right, top-left | bottom-right |
| `data-theme` | Widget theme | light, dark | light |
| `data-size` | Widget size | small, medium, large | medium |

## 🎯 Platform-Specific Examples

### React/NextJS
```jsx
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://your-cdn-domain.com/voicecake-widget.js';
    script.setAttribute('data-agent-id', '49');
    document.head.appendChild(script);
    
    return () => {
      if (window.VoiceCakeWidget) {
        window.VoiceCakeWidget.destroy();
      }
    };
  }, []);
  
  return <div>Your app content</div>;
}
```

### WordPress
Add to your theme's `functions.php`:
```php
function add_voicecake_widget() {
    wp_enqueue_script('voicecake-widget', 
        'https://your-cdn-domain.com/voicecake-widget.js', 
        array(), '1.0.0', false);
}
add_action('wp_enqueue_scripts', 'add_voicecake_widget');
```

### Static HTML
```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://your-cdn-domain.com/voicecake-widget.js" 
            data-agent-id="49">
    </script>
</head>
<body>
    <h1>Your Website</h1>
    <p>The widget will appear automatically!</p>
</body>
</html>
```

### Vue.js
```vue
<template>
  <div>Your app content</div>
</template>

<script>
export default {
  mounted() {
    const script = document.createElement('script');
    script.src = 'https://your-cdn-domain.com/voicecake-widget.js';
    script.setAttribute('data-agent-id', '49');
    document.head.appendChild(script);
  },
  
  beforeDestroy() {
    if (window.VoiceCakeWidget) {
      window.VoiceCakeWidget.destroy();
    }
  }
}
</script>
```

## 🔧 Advanced Integration

### Programmatic Initialization

For more control, you can initialize the widget programmatically:

```javascript
// Load the widget script
const script = document.createElement('script');
script.src = 'https://your-cdn-domain.com/voicecake-widget.js';
document.head.appendChild(script);

// Initialize when ready
script.onload = function() {
  window.VoiceCakeWidget.init({
    agentId: '49',
    position: 'bottom-right',
    theme: 'light',
    size: 'medium'
  });
};
```

### Widget API

Once loaded, the widget exposes these methods:

```javascript
// Initialize widget
window.VoiceCakeWidget.init(config);

// Destroy widget
window.VoiceCakeWidget.destroy();

// Check if widget is loaded
if (window.VoiceCakeWidget) {
  // Widget is available
}
```

## 🎨 Customization

### CSS Customization

The widget uses CSS custom properties that can be overridden:

```css
:root {
  --voicecake-primary-color: #667eea;
  --voicecake-secondary-color: #764ba2;
  --voicecake-background: #ffffff;
  --voicecake-text: #374151;
  --voicecake-border: #e5e7eb;
}
```

### Theme Customization

You can create custom themes by modifying the CSS classes in the widget.

## 🔒 Security Considerations

1. **HTTPS Required**: The widget requires HTTPS for microphone access
2. **CORS Configuration**: Ensure your backend allows requests from client domains
3. **Agent ID Security**: Agent IDs should be kept secure and not exposed in client-side code

## 📱 Browser Support

- Chrome 66+
- Firefox 60+
- Safari 11+
- Edge 79+

## 🐛 Troubleshooting

### Common Issues

1. **Widget not appearing**: Check if the script URL is correct and accessible
2. **Microphone not working**: Ensure the site is served over HTTPS
3. **Connection errors**: Verify the backend API URLs are correct
4. **LiveKit errors**: Check if LiveKit client library is loading properly

### Debug Mode

Enable debug logging by adding this before the widget script:

```html
<script>
window.VoiceCakeDebug = true;
</script>
```

## 📞 Support

For support and questions:
- Email: support@voicecake.com
- Documentation: https://docs.voicecake.com
- GitHub Issues: https://github.com/yourusername/voicecake-widget/issues

## 📄 License

This widget is proprietary software. All rights reserved.
