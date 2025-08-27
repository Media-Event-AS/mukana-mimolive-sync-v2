// Mukana to mimoLive Sync Extension Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
    console.log('🔧 Mukana to mimoLive Sync Extension installed');
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Message received:', request);
    
    if (request.type === 'SCRAPER_STATUS') {
        // Handle scraper status updates
        console.log('📊 Scraper status:', request.data);
    }
    
    if (request.type === 'SCRAPER_ERROR') {
        // Handle scraper errors
        console.error('❌ Scraper error:', request.data);
    }
    
    sendResponse({ received: true });
});

// Handle extension icon click (only when popup is not defined)
chrome.action.onClicked.addListener((tab) => {
    console.log('🖱️ Extension icon clicked on tab:', tab.id);
    
    // Check if we're on a Mukana page
    if (tab.url && (tab.url.includes('mukana-panelView') || tab.url.includes('mukana-panelist') || tab.url.includes('mukana-teleprompter'))) {
        // Inject the scraper if not already present
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                if (!window.mukanaScraper) {
                    console.log('🔧 Injecting Mukana to mimoLive Sync...');
                    // The content script will handle the injection
                } else {
                    console.log('✅ Mukana to mimoLive Sync already present');
                }
            }
        });
    }
});
