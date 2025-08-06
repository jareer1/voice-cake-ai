// Theme configuration for easy color management
export const themeConfig = {
  colors: {
    // Current theme colors (teal gradient) - change these to update entire app
    theme: {
      gradientStart: 'hsl(174, 100%, 29%)',  // Current: teal-600
      gradientMid: 'hsl(174, 100%, 25%)',    // Current: teal-700
      gradientEnd: 'hsl(160, 85%, 39%)',     // Current: emerald-700
      borderPrimary: 'hsl(174, 100%, 25%)',  // Current: teal-700
      borderSecondary: 'hsl(174, 100%, 35%)', // Current: teal-600
    }
  },
  
  // CSS class mappings - use these instead of hardcoded gradients
  classes: {
    button: 'btn-theme-gradient',
    avatar: 'avatar-theme-gradient', 
    badge: 'badge-theme-gradient',
    textGradient: 'text-theme-gradient',
    background: 'bg-theme-gradient',
    progressBar: 'progress-theme-gradient',
  },
  
  // Utility functions for dynamic theming
  getGradientCSS: () => `linear-gradient(135deg, ${themeConfig.colors.theme.gradientStart}, ${themeConfig.colors.theme.gradientMid}, ${themeConfig.colors.theme.gradientEnd})`,
  
  // For hover states and borders
  borders: {
    primary: 'border-theme-primary',
    secondary: 'border-theme-secondary',
  }
};

// Instructions for future theme changes:
// 1. Update the CSS variables in index.css:
//    --theme-gradient-start, --theme-gradient-mid, --theme-gradient-end
// 2. Update the values in this file to match
// 3. All components using theme classes will automatically update

export default themeConfig;
