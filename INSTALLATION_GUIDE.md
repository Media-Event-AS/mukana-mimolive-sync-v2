# 🚀 Mukana to mimoLive Sync - Chrome Plugin Installation Guide

## 📋 What This Plugin Does

This Chrome extension automatically extracts panelist comments from Mukana pages and forwards them to mimoLive via HTTP API endpoints. It features:

- **Real-time synchronization** of Mukana panelist comments
- **Automatic data extraction** from Mukana pages
- **Seamless mimoLive integration** via HTTP API
- **DOM monitoring** for live updates
- **User-friendly control panel** for configuration

## 🔧 Installation Steps

### Step 1: Download the Plugin Files

1. **Download** the plugin folder from your Norwegian friend
2. **Extract** the ZIP file to a location on your computer
3. **Keep the folder** - you'll need it for the installation

### Step 2: Open Chrome Extensions Page

1. **Open Google Chrome** on your computer
2. **Type** `chrome://extensions/` in the address bar
3. **Press Enter**

### Step 3: Enable Developer Mode

1. **Look for the toggle** in the top-right corner
2. **Click "Developer mode"** to enable it
3. **You should see** additional options appear below

### Step 4: Load the Plugin

1. **Click "Load unpacked"** button
2. **Navigate to** the plugin folder you extracted
3. **Select the folder** (not individual files)
4. **Click "Select Folder"**

### Step 5: Verify Installation

1. **Look for "Mukana to mimoLive Sync"** in your extensions list
2. **Check that it shows** version 0.7.3
3. **Ensure the extension is enabled** (toggle should be blue)
4. **Look for the extension icon** in your Chrome toolbar (top-right)

## 🎯 How to Use the Plugin

### Step 1: Navigate to Mukana

1. **Go to** any Mukana panelist or teleprompter page
2. **Make sure you're logged in** with your Google account
3. **Wait for the page to fully load**

### Step 2: Create the Control Panel

1. **Click the plugin icon** in your Chrome toolbar
2. **Click "Create Control Panel"** button
3. **Wait for the confirmation message**
4. **Look for the control panel** on the right side of the page

### Step 3: Configure the Plugin

1. **Enter LayerIDs for destination URL** (where to send the data)
   - Right click at each layer/source "Copy Layer's API endpoint...."
   - Put these ID's into their respective filelds in the
     Control Panel fields and click 'Save Config'.
2. **Set Document ID and Port** ()
3. **Configure other options** as needed:
   - Max comments to process
   - Include user information
   - Include notes and votes

### Step 4: Start the Sync

1. **Click "Start Scraper"** in the control panel
2. **Monitor the status** to ensure it's working
3. **Check the logs** for any error messages

## ⚙️ Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| **Destination URL** | Where to send scraped data | Required |
| **Max Comments** | Maximum comments to process | 100 |
| **Include User Info** | Extract username, location, phonetics | ✓ |
| **Include Notes** | Extract host notes | ✓ |
| **Include Votes** | Extract vote counts | ✓ |

## 🔍 Troubleshooting

### Plugin Not Appearing
- **Check Developer mode** is enabled
- **Verify the folder** contains all plugin files
- **Try refreshing** the extensions page
- **Restart Chrome** and try again

### Plugin Not Working on Mukana Pages
- **Ensure you're on** a Mukana panelist/teleprompter page
- **Check the URL** contains "mukana-panelView", "mukana-panelist", or "mukana-teleprompter"
- **Verify you're logged in** with Google
- **Check browser console** for error messages

### Control Panel Not Appearing
- **Click the plugin icon** and try "Create Control Panel" again
- **Refresh the page** and try again
- **Check if the page** has fully loaded
- **Look for error messages** in the plugin popup

### Scraper Not Starting
- **Verify the destination URL** is correct and accessible
- **Check the check interval** isn't too low (hardcoded)
- **Ensure the page** has the expected content
- **Look for console errors** in browser DevTools

## 📁 Required Files

Make sure your plugin folder contains these files:

```
✅ manifest.json          # Plugin configuration
✅ content-script.js      # Page injection script
✅ popup.html            # Plugin popup interface
✅ popup.js              # Popup functionality
✅ background.js         # Background service worker
✅ mukana-scraper.js     # Main scraper library
✅ icon16.png            # Small icon
✅ icon48.png            # Medium icon
✅ icon128.png           # Large icon
```

## 🔒 Security Notes

- **Local Storage**: All configuration is stored locally in Chrome
- **Page Context**: The scraper runs within the Mukana page context
- **No External Calls**: The plugin itself doesn't make external network calls
- **User Control**: You control what data is scraped and where it's sent

## 📞 Getting Help

If you encounter issues:

1. **Check the browser console** for error messages
2. **Verify the plugin is properly installed** in chrome://extensions/
3. **Ensure you're on the correct Mukana page**
4. **Check that Google authentication is working**
5. **Contact your colleague** who provided the plugin

## 🔄 Updating the Plugin

To update to a newer version:

1. **Download the new version** from your Norwegian friends
2. **Replace the old folder** with the new one
3. **Go to** chrome://extensions/
4. **Click the refresh icon** on the plugin
5. **Reload any open Mukana pages**

---

**Plugin Version:** 0.7.3  
**Author:** Ronny Hofsøy, Media Event AS  
**Minimum Chrome Version:** 88  
**Last Updated:** 2024

🎉 **You're all set!** The plugin should now be working and ready to sync your Mukana data to mimoLive.
