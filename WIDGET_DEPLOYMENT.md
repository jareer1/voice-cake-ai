# VoiceCake Widget - Live Website Deployment Guide

## 🚀 Quick Deployment

Once you push your code to GitHub and it deploys on Vercel, your widget will be available at:

```
https://your-vercel-domain.vercel.app/voicecake-widget.js
```

## 📋 Usage on Any Website

### Basic Implementation

Add this single line to any website's `<head>` tag:

```html
<script src="https://your-vercel-domain.vercel.app/voicecake-widget.js" data-agent-id="53"></script>
```

### Advanced Configuration

```html
<script 
    src="https://your-vercel-domain.vercel.app/voicecake-widget.js" 
    data-agent-id="53"
    data-position="bottom-right"
    data-theme="light"
    data-size="medium">
</script>
```

## 🔧 Configuration Options

| Attribute | Required | Values | Default | Description |
|-----------|----------|--------|---------|-------------|
| `data-agent-id` | ✅ | String | - | Your VoiceCake agent ID |
| `data-position` | ❌ | `bottom-left`, `bottom-right`, `top-left`, `top-right` | `bottom-left` | Widget position |
| `data-theme` | ❌ | `light`, `dark` | `light` | Widget theme |
| `data-size` | ❌ | `small`, `medium`, `large` | `medium` | Widget size |

## 🌐 Cross-Origin Support

The widget is configured with:
- `Access-Control-Allow-Origin: *` - Allows embedding on any domain
- `Content-Type: application/javascript` - Proper MIME type
- `Cache-Control: public, max-age=3600` - 1-hour caching for performance

## 📱 Framework Examples

### React/Next.js
```javascript
useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://your-vercel-domain.vercel.app/voicecake-widget.js';
    script.setAttribute('data-agent-id', '53');
    script.setAttribute('data-position', 'bottom-right');
    document.head.appendChild(script);
}, []);
```

### Vue.js
```javascript
mounted() {
    const script = document.createElement('script');
    script.src = 'https://your-vercel-domain.vercel.app/voicecake-widget.js';
    script.setAttribute('data-agent-id', '53');
    document.head.appendChild(script);
}
```

### WordPress
Add to your theme's `header.php`:
```php
<script src="https://your-vercel-domain.vercel.app/voicecake-widget.js" data-agent-id="53"></script>
```

### Shopify
Add to your theme's `layout/theme.liquid`:
```liquid
<script src="https://your-vercel-domain.vercel.app/voicecake-widget.js" data-agent-id="53"></script>
```

## 🔍 Testing Your Deployment

1. **Deploy to Vercel**: Push your code to GitHub
2. **Get your domain**: Check your Vercel dashboard for the deployment URL
3. **Test the widget**: Visit `https://your-domain.vercel.app/widget-test.html`
4. **Test on external site**: Use the script tag on any website

## 🛠️ Troubleshooting

### Widget not loading?
- Check the browser console for errors
- Verify the URL is accessible: `https://your-domain.vercel.app/voicecake-widget.js`
- Ensure CORS headers are set correctly

### WebSocket connection failing?
- Verify your agent ID is correct
- Check that your backend is running
- Ensure the widget is using the correct backend URL

### Widget not appearing?
- Check if the script loaded successfully
- Verify the `data-agent-id` attribute is set
- Check for JavaScript errors in the console

## 📊 Performance

- Widget file size: ~50KB (gzipped)
- Load time: ~100-200ms on average connection
- Memory usage: ~5-10MB during active conversation
- Network: WebSocket connection for real-time communication

## 🔒 Security

- Widget only connects to your specified backend
- No external dependencies (except LiveKit client)
- Secure WebSocket connections (WSS)
- No data collection or tracking

## 🎯 Next Steps

1. Deploy your code to Vercel
2. Test the widget on your deployment URL
3. Copy the script tag to your target websites
4. Monitor the widget's performance and usage
