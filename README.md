# Mukana to mimoLive Sync Chrome Extension

A Chrome extension that injects the Mukana scraper directly into Mukana panelist pages, allowing you to scrape content while piggybacking on the existing authentication.

## 🚀 **Installation**

### **Method 1: Load Unpacked Extension (Development)**

1. **Download/Clone** this extension folder
2. **Open Chrome** and go to `chrome://extensions/`
3. **Enable "Developer mode"** (toggle in top right)
4. **Click "Load unpacked"**
5. **Select** the `mukana-scraper-extension` folder
6. **Extension should appear** in your extensions list

### **Method 2: Create Icons (Optional)**

If you want custom icons, create these files:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)  
- `icon128.png` (128x128 pixels)

Or use any existing PNG files and rename them.

## 🔧 **How It Works**

1. **Navigate** to a Mukana page (panelist or teleprompter)
2. **Click the extension icon** in your Chrome toolbar
3. **Click "Create Control Panel"** to create the scraper interface on the page
4. **Use the control panel** that appears on the page to configure and control the scraper
5. **The scraper extracts** username (msg_user) and comment text (msg_text) from the page

## 📋 **Features**

- **🔐 Authentication**: Piggybacks on existing Firebase Google authentication
- **🎯 Page Injection**: Runs directly in the Mukana page context
- **⚙️ Control Panel**: Built-in configuration and control interface
- **💾 Configuration Storage**: Saves settings in Chrome storage
- **📊 Real-time Status**: Monitor scraper status and performance
- **🔄 Auto-detection**: Automatically detects when page is ready

## 🎮 **Usage**

### **Step 1: Navigate to Mukana Page**
- Go to any Mukana page (panelist or teleprompter)
- Ensure you're logged in with Google

### **Step 2: Create the Control Panel**
- Click the extension icon in Chrome toolbar
- Click "Create Control Panel" button
- Wait for confirmation message

### **Step 3: Configure the Scraper**
- Look for the control panel on the right side of the page
- Enter your destination URL
- Configure options (interval, max comments, etc.)
- Click "Start Scraper"

### **Step 4: Monitor and Control**
- Use the status button to check scraper status
- Use stop button to stop scraping
- Close panel when not needed

## ⚙️ **Configuration Options**

- **Destination URL**: Where to send the scraped data
- **Check Interval**: How often to check for updates (milliseconds)
- **Max Comments**: Maximum number of comments to process
- **Include User Info**: Extract username, location, phonetics
- **Include Notes**: Extract host notes
- **Include Votes**: Extract vote counts

## 🔍 **Troubleshooting**

### **Extension Not Working**
1. Check if extension is enabled in `chrome://extensions/`
2. Ensure you're on a Mukana panelist page
3. Check browser console for error messages
4. Try refreshing the page and re-injecting

### **Authentication Issues**
1. Make sure you're logged into Mukana with Google
2. Check if Firebase is properly loaded on the page
3. Look for authentication errors in console

### **Scraper Not Starting**
1. Check the destination URL is valid
2. Ensure the page has loaded completely
3. Check browser console for error messages
4. Try increasing the check interval

## 📁 **File Structure**

```
mukana-scraper-extension/
├── manifest.json          # Extension manifest
├── content-script.js      # Script injected into pages
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── background.js         # Background service worker
├── mukana-scraper.js     # Main scraper library
└── README.md             # This file
```

## 🔒 **Security & Privacy**

- **Local Storage**: Configuration is stored locally in Chrome
- **Page Context**: Scraper runs in the page context, not extension context
- **No External Calls**: Extension doesn't make external network calls
- **User Control**: User controls what data is scraped and where it's sent

## 🚀 **Development**

### **Making Changes**
1. Edit the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension
4. Reload the Mukana page

### **Debugging**
1. Open Chrome DevTools on the Mukana page
2. Look for console messages from the scraper
3. Check the extension's background page for errors
4. Use the extension popup for status information

## 📞 **Support**

For issues or questions:
1. Check the browser console for error messages
2. Verify the extension is properly installed
3. Ensure you're on the correct Mukana page
4. Check that Firebase authentication is working

## 🔄 **Updates**

To update the extension:
1. Download the latest version
2. Replace the old files
3. Go to `chrome://extensions/`
4. Click refresh on the extension
5. Reload any open Mukana pages
