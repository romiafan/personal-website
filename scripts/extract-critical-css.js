#!/usr/bin/env node

/**
 * Critical CSS extraction script
 * Extracts above-the-fold CSS for performance optimization
 */

const fs = require('fs');
const path = require('path');

// Critical CSS rules that should be inlined
const criticalSelectors = [
  // Layout essentials
  'html', 'body', '*', '*::before', '*::after',
  
  // Theme and dark mode
  '.dark', '[data-theme]',
  
  // Font loading
  '.font-sans', '.font-mono', '.antialiased',
  
  // Skip to content link
  '.sr-only', '.focus\\:not-sr-only',
  
  // Navigation (above the fold)
  'nav', '.navbar', '.nav-item',
  
  // Hero section (above the fold)
  '.hero', '.hero-title', '.hero-subtitle',
  
  // Container and layout utilities
  '.container', '.flex', '.grid', '.relative', '.absolute',
  
  // Common spacing and sizing
  '.w-full', '.h-full', '.min-h-screen',
  '.p-', '.m-', '.px-', '.py-', '.mx-', '.my-',
  '.space-', '.gap-',
  
  // Typography essentials
  '.text-', '.font-', '.leading-', '.tracking-',
  
  // Background and colors for initial paint
  '.bg-', '.text-foreground', '.text-muted-foreground',
  
  // Display utilities
  '.block', '.inline', '.inline-block', '.flex', '.grid', '.hidden',
  
  // Position utilities
  '.static', '.fixed', '.absolute', '.relative', '.sticky',
  
  // Z-index for layering
  '.z-', '.-z-',
];

function extractCriticalCSS() {
  try {
    // This would ideally use a tool like Critical or PurgeCSS
    // For now, we'll create a basic critical CSS template
    
    const criticalCSS = `
/* Critical CSS - Above the fold styles */
/* This should be inlined in the HTML head */

/* CSS Variables for immediate theme support */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 84% 4.9%;
  --muted: 210 40% 96%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96%;
  --accent-foreground: 222.2 84% 4.9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
  
  /* Font variables */
  --font-geist-sans: var(--font-geist-sans);
  --font-geist-mono: var(--font-geist-mono);
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 84% 4.9%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 224.3 76.3% 94.1%;
}

/* Essential layout styles */
*,
::before,
::after {
  box-sizing: border-box;
  border-width: 0;
  border-style: solid;
  border-color: theme(borderColor.DEFAULT, currentColor);
}

html {
  line-height: 1.5;
  -webkit-text-size-adjust: 100%;
  -moz-tab-size: 4;
  tab-size: 4;
  font-family: var(--font-geist-sans), system-ui, sans-serif;
  font-feature-settings: normal;
  font-variation-settings: normal;
}

body {
  margin: 0;
  line-height: inherit;
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: var(--font-geist-sans), system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Prevent flash of unstyled content */
.font-sans {
  font-family: var(--font-geist-sans), system-ui, sans-serif;
}

.font-mono {
  font-family: var(--font-geist-mono), ui-monospace, monospace;
}

.antialiased {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Skip to content (accessibility) */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.focus\\:not-sr-only:focus {
  position: static;
  width: auto;
  height: auto;
  padding: 0;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
}

/* Essential layout utilities */
.flex {
  display: flex;
}

.min-h-screen {
  min-height: 100vh;
}

.flex-col {
  flex-direction: column;
}

.relative {
  position: relative;
}

.w-full {
  width: 100%;
}

.h-full {
  height: 100%;
}
`;

    // Write critical CSS to public directory
    const outputPath = path.join(process.cwd(), 'public', 'critical.css');
    fs.writeFileSync(outputPath, criticalCSS.trim());
    
    console.log('✅ Critical CSS generated at public/critical.css');
    console.log('📝 Remember to inline this CSS in your HTML head for optimal performance');
    
  } catch (error) {
    console.error('❌ Error generating critical CSS:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  extractCriticalCSS();
}

module.exports = { extractCriticalCSS };