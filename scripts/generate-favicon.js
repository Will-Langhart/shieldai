#!/usr/bin/env node

/**
 * Generate Favicon Script for Shield AI
 * Transforms logo.png into favicon.ico with multiple sizes
 * 
 * Usage: node scripts/generate-favicon.js
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Configuration
const LOGO_PATH = path.join(__dirname, '../apps/web/public/logo.png');
const OUTPUT_DIR = path.join(__dirname, '../apps/web/public');
const FAVICON_SIZES = [16, 32, 48]; // Standard favicon sizes

async function generateFavicon() {
  try {
    console.log('🎨 Starting favicon generation...');
    
    // Check if logo exists
    if (!fs.existsSync(LOGO_PATH)) {
      throw new Error(`Logo not found at: ${LOGO_PATH}`);
    }
    
    console.log(`📁 Logo found at: ${LOGO_PATH}`);
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    // Generate different sizes of the logo
    const resizedImages = [];
    
    for (const size of FAVICON_SIZES) {
      console.log(`🔄 Resizing to ${size}x${size}...`);
      
      const resizedBuffer = await sharp(LOGO_PATH)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent background
        })
        .png()
        .toBuffer();
      
      resizedImages.push({
        size,
        buffer: resizedBuffer
      });
      
      // Also save individual PNG files for debugging
      const pngPath = path.join(OUTPUT_DIR, `favicon-${size}x${size}.png`);
      fs.writeFileSync(pngPath, resizedBuffer);
      console.log(`✅ Saved: favicon-${size}x${size}.png`);
    }
    
    // Create a simple ICO file using the 32x32 version (most common)
    const primaryIcon = resizedImages.find(img => img.size === 32);
    if (primaryIcon) {
      const icoPath = path.join(OUTPUT_DIR, 'favicon.ico');
      
      // For now, we'll copy the 32x32 PNG as the favicon
      // In a production environment, you'd want to use a proper ICO converter
      fs.writeFileSync(icoPath, primaryIcon.buffer);
      console.log(`✅ Created favicon.ico (32x32 PNG format)`);
    }
    
    // Generate additional icon sizes for PWA
    const pwaSizes = [192, 512];
    for (const size of pwaSizes) {
      console.log(`🔄 Generating PWA icon ${size}x${size}...`);
      
      const pwaBuffer = await sharp(LOGO_PATH)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toBuffer();
      
      const pwaPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
      fs.writeFileSync(pwaPath, pwaBuffer);
      console.log(`✅ Saved: icon-${size}x${size}.png`);
    }
    
    // Update manifest.json with new icon paths
    await updateManifest();
    
    console.log('🎉 Favicon generation completed successfully!');
    console.log('📁 Generated files:');
    console.log('   - favicon.ico (32x32)');
    console.log('   - favicon-16x16.png');
    console.log('   - favicon-32x32.png');
    console.log('   - favicon-48x48.png');
    console.log('   - icon-192x192.png');
    console.log('   - icon-512x512.png');
    
  } catch (error) {
    console.error('❌ Error generating favicon:', error.message);
    process.exit(1);
  }
}

async function updateManifest() {
  try {
    const manifestPath = path.join(OUTPUT_DIR, 'manifest.json');
    
    if (!fs.existsSync(manifestPath)) {
      console.log('⚠️  manifest.json not found, skipping update');
      return;
    }
    
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Update icon paths to use the new generated icons
    manifest.icons = [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ];
    
    // Update shortcuts icons
    if (manifest.shortcuts) {
      manifest.shortcuts.forEach(shortcut => {
        if (shortcut.icons) {
          shortcut.icons[0].src = '/favicon-32x32.png';
          shortcut.icons[0].sizes = '32x32';
        }
      });
    }
    
    // Write updated manifest
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('✅ Updated manifest.json with new icon paths');
    
  } catch (error) {
    console.error('⚠️  Warning: Could not update manifest.json:', error.message);
  }
}

// Run the script
if (require.main === module) {
  generateFavicon();
}

module.exports = { generateFavicon };
