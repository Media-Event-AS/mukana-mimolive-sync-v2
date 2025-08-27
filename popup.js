// Mukana to mimoLive Sync Extension Popup

document.addEventListener('DOMContentLoaded', function() {
    const statusDiv = document.getElementById('status');
    const injectBtn = document.getElementById('injectBtn');
    const checkStatusBtn = document.getElementById('checkStatusBtn');
    const openConfigBtn = document.getElementById('openConfigBtn');
    
    // Check if we're on a Mukana page
    async function checkPageStatus() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (tab.url && (tab.url.includes('mukana-panelView') || tab.url.includes('mukana-panelist') || tab.url.includes('mukana-teleprompter'))) {
                statusDiv.textContent = '✅ On Mukana page - Ready to inject';
                statusDiv.className = 'status success';
                injectBtn.disabled = false;
            } else {
                statusDiv.textContent = '❌ Not on Mukana page - Navigate to a panelist or teleprompter page first';
                statusDiv.className = 'status error';
                injectBtn.disabled = true;
            }
        } catch (error) {
            statusDiv.textContent = '❌ Error checking page status';
            statusDiv.className = 'status error';
            console.error('Error checking page status:', error);
        }
    }
    
    // Inject the scraper
    async function injectScraper() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab) {
                throw new Error('No active tab found');
            }
            
            // Trigger the content script to create the control panel
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    console.log('🔄 Popup triggering control panel creation...');
                    
                    // Try to create the control panel directly
                    if (window.createMukanaControlPanel) {
                        console.log('🔄 Creating control panel directly...');
                        return window.createMukanaControlPanel();
                    } else if (window.mukanaScraperInjector) {
                        console.log('🔄 Using existing injector...');
                        return window.mukanaScraperInjector.createControlPanel();
                    } else {
                        console.log('🔄 No injector found, dispatching event...');
                        window.dispatchEvent(new CustomEvent('mukana-scraper-init'));
                        return true;
                    }
                }
            });
            
            if (results && results[0] && results[0].result) {
                statusDiv.textContent = '✅ Control panel creation triggered! Check the page for the panel.';
                statusDiv.className = 'status success';
            } else {
                throw new Error('Control panel creation failed');
            }
            
        } catch (error) {
            statusDiv.textContent = '❌ Failed to trigger control panel: ' + error.message;
            statusDiv.className = 'status error';
            console.error('Error triggering control panel:', error);
        }
    }
    
    // Check scraper status
    async function checkScraperStatus() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab) {
                throw new Error('No active tab found');
            }
            
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    console.log('🔍 Checking for scraper objects...');
                    console.log('🔍 window.mukanaScraper:', !!window.mukanaScraper);
                    console.log('🔍 window.mukanaScraperInjector:', !!window.mukanaScraperInjector);
                    console.log('🔍 window.mukanaScraperPanel:', !!document.getElementById('mukana-scraper-panel'));
                    
                    if (window.mukanaScraper) {
                        const status = window.mukanaScraper.getStatus();
                        return {
                            exists: true,
                            type: 'scraper',
                            status: status
                        };
                    } else if (window.mukanaScraperInjector) {
                        return {
                            exists: true,
                            type: 'injector',
                            status: { message: 'Injector exists but scraper not initialized' }
                        };
                    } else if (document.getElementById('mukana-scraper-panel')) {
                        return {
                            exists: true,
                            type: 'panel',
                            status: { message: 'Control panel exists' }
                        };
                    } else {
                        return { exists: false };
                    }
                }
            });
            
            if (!results || !results[0] || !results[0].result) {
                throw new Error('Failed to execute status check script');
            }
            
            const result = results[0].result;
            
            if (result.exists) {
                const status = result.status;
                if (result.type === 'scraper') {
                    statusDiv.innerHTML = `
                        <strong>Scraper Status:</strong><br>
                        Running: ${status.isRunning ? 'Yes' : 'No'}<br>
                        Comments: ${status.cachedComments}<br>
                        Last Update: ${status.lastUpdate ? new Date(status.lastUpdate).toLocaleTimeString() : 'Never'}<br>
                        Event ID: ${status.eventId}<br>
                        Authenticated: ${status.isAuthenticated ? 'Yes' : 'No'}
                    `;
                } else if (result.type === 'injector') {
                    statusDiv.innerHTML = `
                        <strong>Injector Status:</strong><br>
                        ${status.message}<br>
                        <em>Try clicking "Inject Scraper" again</em>
                    `;
                } else if (result.type === 'panel') {
                    statusDiv.innerHTML = `
                        <strong>Control Panel Status:</strong><br>
                        ${status.message}<br>
                        <em>Panel should be visible on the page</em>
                    `;
                }
                statusDiv.className = 'status success';
            } else {
                statusDiv.textContent = '❌ Scraper not found on page';
                statusDiv.className = 'status error';
            }
            
        } catch (error) {
            statusDiv.textContent = '❌ Error checking scraper status: ' + error.message;
            statusDiv.className = 'status error';
            console.error('Error checking scraper status:', error);
        }
    }
    
    // Open configuration
    async function openConfiguration() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab) {
                throw new Error('No active tab found');
            }
            
            // Execute script to show config panel
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    const panel = document.getElementById('mukana-scraper-panel');
                    if (panel) {
                        panel.style.display = 'block';
                        panel.style.zIndex = '10001';
                        return true;
                    } else {
                        alert('Scraper not injected yet. Please inject the scraper first.');
                        return false;
                    }
                }
            });
            
            if (results && results[0] && results[0].result) {
                statusDiv.textContent = '✅ Configuration panel opened!';
                statusDiv.className = 'status success';
            } else {
                statusDiv.textContent = '⚠️ Scraper not injected yet. Please inject the scraper first.';
                statusDiv.className = 'status error';
            }
            
        } catch (error) {
            statusDiv.textContent = '❌ Error opening configuration: ' + error.message;
            statusDiv.className = 'status error';
            console.error('Error opening configuration:', error);
        }
    }
    
    // Event listeners
    injectBtn.addEventListener('click', injectScraper);
    checkStatusBtn.addEventListener('click', checkScraperStatus);
    openConfigBtn.addEventListener('click', openConfiguration);
    
    // Check status on load
    checkPageStatus();
});
