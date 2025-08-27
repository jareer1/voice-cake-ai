# VoiceCake Widget - Voice Chatbot Embedding Solution

A lightweight, standalone JavaScript widget that allows you to easily embed your VoiceCake voice chatbots on any website. The widget provides real-time voice conversation capabilities with a beautiful, customizable interface.

## 🚀 Quick Start

### 1. Host the Widget File

First, host the `voicecake-widget.js` file on your server or CDN. You can place it in your `public` folder or any publicly accessible location.

### 2. Add to Your Website

Add this single line to your website's `<head>` tag:

```html
<script src="https://your-domain.com/voicecake-widget.js" data-agent-id="YOUR_AGENT_ID"></script>
```

That's it! The widget will automatically appear in the bottom-left corner of your website.

## ⚙️ Configuration Options

### Data Attributes

You can customize the widget using data attributes:

```html
<script 
    src="https://your-domain.com/voicecake-widget.js" 
    data-agent-id="YOUR_AGENT_ID"
    data-position="bottom-right"
    data-theme="dark"
    data-size="large">
</script>
```

### Available Options

| Attribute | Required | Values | Default | Description |
|-----------|----------|--------|---------|-------------|
| `data-agent-id` | ✅ | String | - | Your VoiceCake agent ID |
| `data-position` | ❌ | `bottom-left`, `bottom-right`, `top-left`, `top-right` | `bottom-left` | Widget position on screen |
| `data-theme` | ❌ | `light`, `dark` | `light` | Widget theme |
| `data-size` | ❌ | `small`, `medium`, `large` | `medium` | Widget size |

## 🔧 Programmatic Initialization

For more control, you can initialize the widget programmatically:

```javascript
// Load the widget script
const script = document.createElement('script');
script.src = 'https://your-domain.com/voicecake-widget.js';
document.head.appendChild(script);

// Initialize when loaded
script.onload = function() {
    window.VoiceCakeWidget.init({
        agentId: 'YOUR_AGENT_ID',
        position: 'bottom-right',
        theme: 'dark',
        size: 'large'
    });
};
```

## 🎯 Features

- **Real-time Voice Conversation**: Connect directly to your VoiceCake agents
- **Automatic Microphone Handling**: Seamless permission requests and audio setup
- **High-Quality Audio**: Optimized audio streaming with WebRTC
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Customizable UI**: Multiple themes, sizes, and positions
- **No Dependencies**: Pure JavaScript - no frameworks required
- **Cross-Platform**: Works with any website (React, Vue, WordPress, etc.)
- **Secure Connection**: WebSocket connection to your backend
- **Easy Integration**: Single script tag implementation

## 📋 Implementation Examples

### React/Next.js

```javascript
// In your _app.js or layout component
import { useEffect } from 'react';

function Layout({ children }) {
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://your-domain.com/voicecake-widget.js';
        script.setAttribute('data-agent-id', 'YOUR_AGENT_ID');
        script.setAttribute('data-position', 'bottom-right');
        document.head.appendChild(script);
    }, []);

    return <>{children}</>;
}
```

### Vue.js

```javascript
// In your main.js or App.vue
mounted() {
    const script = document.createElement('script');
    script.src = 'https://your-domain.com/voicecake-widget.js';
    script.setAttribute('data-agent-id', 'YOUR_AGENT_ID');
    document.head.appendChild(script);
}
```

### WordPress

**Option 1: Theme Header**
```php
<!-- Add to your theme's header.php -->
<script src="https://your-domain.com/voicecake-widget.js" 
        data-agent-id="<?php echo get_option('voicecake_agent_id'); ?>">
</script>
```

**Option 2: Plugin**
```php
// In your plugin file
add_action('wp_head', function() {
    $agent_id = get_option('voicecake_agent_id');
    echo '<script src="https://your-domain.com/voicecake-widget.js" 
                  data-agent-id="' . esc_attr($agent_id) . '"></script>';
});
```

### Static HTML

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Website</title>
    <script src="https://your-domain.com/voicecake-widget.js" 
            data-agent-id="YOUR_AGENT_ID"></script>
</head>
<body>
    <h1>Welcome to my website!</h1>
    <!-- Widget will appear automatically -->
</body>
</html>
```

## 🔗 API Reference

The widget exposes these methods and properties globally:

### Methods

```javascript
// Initialize widget with custom configuration
window.VoiceCakeWidget.init(config);

// Destroy widget and clean up resources
window.VoiceCakeWidget.destroy();
```

### Properties

```javascript
// Check if widget is currently active (in a call)
window.VoiceCakeWidget.state.isActive;

// Check if connected to the server
window.VoiceCakeWidget.state.isConnected;

// Check if microphone is enabled
window.VoiceCakeWidget.state.isMicOn;

// Check if widget is initialized
window.VoiceCakeWidget.state.isInitialized;
```

### Configuration Object

```javascript
const config = {
    agentId: 'string',           // Required: Your agent ID
    position: 'string',          // Optional: Widget position
    theme: 'string',             // Optional: Widget theme
    size: 'string',              // Optional: Widget size
    autoStart: boolean,          // Optional: Auto-start calls
    showTranscription: boolean,  // Optional: Show conversation history
    apiBaseUrl: 'string',        // Optional: Custom API base URL
    wsBaseUrl: 'string'          // Optional: Custom WebSocket URL
};
```

## 🎨 Customization

### CSS Customization

The widget uses CSS classes that you can override:

```css
/* Customize the floating button */
.voicecake-widget-button {
    background: linear-gradient(135deg, #your-color1, #your-color2) !important;
    border-radius: 50% !important;
}

/* Customize the popup */
.voicecake-widget-popup {
    border-radius: 20px !important;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3) !important;
}

/* Customize buttons */
.voicecake-btn-primary {
    background: #your-brand-color !important;
}
```

### Theme Customization

Create custom themes by extending the existing CSS:

```css
/* Custom theme */
.voicecake-widget.voicecake-custom .voicecake-widget-popup {
    background: #your-background;
    color: #your-text-color;
}

.voicecake-widget.voicecake-custom .voicecake-widget-button {
    background: #your-button-color;
}
```

## 🔒 Security Considerations

1. **HTTPS Required**: The widget requires HTTPS for microphone access
2. **CORS Configuration**: Ensure your backend allows requests from client domains
3. **Agent Access**: Make sure your agents are configured for public access
4. **Rate Limiting**: Consider implementing rate limiting on your backend

## 🚨 Troubleshooting

### Common Issues

**Widget doesn't appear**
- Check if the script URL is correct
- Verify the agent ID is valid
- Check browser console for errors

**Microphone not working**
- Ensure the website is served over HTTPS
- Check if microphone permissions are granted
- Verify browser supports WebRTC

**Connection fails**
- Check if your backend is running
- Verify WebSocket endpoint is accessible
- Check CORS configuration

**Audio quality issues**
- Check internet connection
- Verify microphone quality
- Check browser audio settings

### Debug Mode

Enable debug logging by adding this before the widget script:

```html
<script>
    window.VoiceCakeDebug = true;
</script>
```

## 📱 Mobile Support

The widget is fully responsive and works on:
- iOS Safari (iOS 12+)
- Android Chrome (Android 8+)
- Mobile Firefox
- Mobile Edge

## 🌐 Browser Support

- Chrome 66+
- Firefox 60+
- Safari 12+
- Edge 79+

## 📊 Performance

The widget is optimized for performance:
- **Size**: ~15KB minified
- **Load Time**: <100ms
- **Memory Usage**: <5MB during active calls
- **CPU Usage**: Minimal when idle

## 🔄 Updates and Maintenance

### Version History

- **v1.0.0**: Initial release with basic voice chat functionality
- **v1.1.0**: Added theme customization and mobile improvements
- **v1.2.0**: Added programmatic API and better error handling

### Updating the Widget

1. Replace the `voicecake-widget.js` file with the new version
2. Clear browser cache on client websites
3. Test functionality on different browsers

## 📞 Support

For technical support or questions:
- Check the troubleshooting section above
- Review browser console for error messages
- Ensure your VoiceCake backend is properly configured
- Verify agent settings and permissions

## 📄 License

This widget is part of the VoiceCake platform. Please refer to your VoiceCake license agreement for usage terms.

---

**Note**: Replace `https://your-domain.com` with your actual domain where the widget file is hosted, and `YOUR_AGENT_ID` with your actual VoiceCake agent ID.
