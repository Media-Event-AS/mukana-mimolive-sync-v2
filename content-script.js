// Mukana to mimoLive Sync Content Script - Clean Version
// This script is injected into Mukana pages to run the scraper

console.log('🔧 Mukana to mimoLive Sync Content Script loaded');

// Add a visible indicator that the script is loaded
const indicator = document.createElement('div');
indicator.id = 'mukana-scraper-indicator';
indicator.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    background: #0078d7;
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 9999;
    font-family: Arial, sans-serif;
    max-width: 300px;
`;

// Initially show loading state
            indicator.textContent = '🔧 Mukana to mimoLive Sync Loading...';
indicator.style.background = '#0078d7';

document.body.appendChild(indicator);

// Remove indicator after 30 seconds
setTimeout(() => {
    if (indicator && indicator.parentNode) {
        indicator.remove();
    }
}, 30000);

// Function to update indicator when injector is ready
function updateIndicator() {
    if (indicator && typeof MukanaScraperInjector !== 'undefined') {
                    indicator.textContent = '🔧 Mukana to mimoLive Sync Loaded - Ready';
        indicator.style.background = '#28a745';
        indicator.style.color = '#fff';
    }
}

// Check periodically if our MukanaScraperInjector becomes available
setInterval(updateIndicator, 2000);

class MukanaScraperInjector {
    constructor() {
        this.config = null;
        this.isInitialized = false;
        this.isRunning = false;
        this.mutationObserver = null;
        this.lastUpdateTime = null;
        this.updateCount = 0;
        this.lastCommentData = null; // Store last comment data for comparison
        this.init();
    }
    
    async init() {
        try {
            console.log('🚀 Starting Mukana to mimoLive Sync Injector initialization...');
            
            // Wait for the page to be ready
            await this.waitForPageReady();
            
            // Load configuration from storage
            await this.loadConfig();
            
            // Create the control panel
            const panelCreated = this.createControlPanel();
            if (!panelCreated) {
                throw new Error('Failed to create control panel');
            }
            
            this.isInitialized = true;
            console.log('✅ Mukana to mimoLive Sync Injector initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize Mukana to mimoLive Sync Injector:', error);
        }
    }
    
    // Wait for the page to be ready
    async waitForPageReady() {
        return new Promise((resolve) => {
            const checkReady = () => {
                console.log('🔍 Checking page readiness...');
                console.log('📍 Current URL:', window.location.href);
                
                // For panel view pages, check if the app is initialized
                const appContent = document.getElementById('app_content');
                if (appContent && appContent.classList.contains('hidden')) {
                    console.log('⏳ Waiting for app to initialize (Event ID not entered yet)...');
                    setTimeout(checkReady, 1000);
                    return;
                }
                
                // Check if the questions list is available (new Mukana panel view structure)
                const questionsList = document.getElementById('ul_qs_panelQs');
                if (!questionsList) {
                    console.log('⏳ Waiting for questions list to load...');
                    setTimeout(checkReady, 1000);
                    return;
                }
                
                console.log('✅ Found questions list:', questionsList);
                console.log('✅ Page is ready for scraping');
                resolve();
            };
            
            checkReady();
        });
    }
    
    // Load configuration from storage
    async loadConfig() {
        try {
            const result = await chrome.storage.local.get(['mukanaScraperConfig']);
            const storedConfig = result.mukanaScraperConfig;
            
            // Check if stored config exists and has all required fields
            if (storedConfig && storedConfig.documentId && storedConfig.port && 
                storedConfig.titleLayer && storedConfig.textLayer && 
                storedConfig.locationLayer && storedConfig.sourceId) {
                
                // If stored config is missing the new questionTagLayer, add it with default value
                if (!storedConfig.questionTagLayer) {
                    storedConfig.questionTagLayer = 'D692CF88-5C77-47F3-A513-5129BDB76FC8';
                    console.log('🔄 Adding missing questionTagLayer to existing config');
                }
                
                this.config = storedConfig;
            } else {
                // Use default config if stored config is incomplete
                this.config = {
                    documentId: '1185605207',
                    port: '8989',
                    titleLayer: 'FE24ACB7-524C-4659-B04D-824FB91F1E05',
                    questionTagLayer: 'FE24ACB7-524C-4659-B04D-824FB91F1E05',
                    textLayer: '11F0706A-4E1E-4DBA-A620-2D3EF44A9F2D',
                    locationLayer: '73F19730-1C97-4660-8091-37428DDEC4A6',
                    sourceId: '572187142-1CDC27E3-762F-4054-86F7-3403FA9518E0'
                };
                console.log('🔄 Using default config (stored config incomplete)');
            }
            
            console.log('📋 Loaded config:', this.config);
            
            // Auto-save the config if we had to add missing fields
            if (storedConfig && !storedConfig.questionTagLayer) {
                try {
                    await chrome.storage.local.set({
                        mukanaScraperConfig: this.config
                    });
                    console.log('✅ Updated config saved to storage');
                } catch (saveError) {
                    console.warn('⚠️ Failed to save updated config:', saveError);
                }
            }
        } catch (error) {
            console.error('❌ Failed to load config:', error);
            // Set default config if loading fails
            this.config = {
                documentId: '572187142',
                port: '49262',
                titleLayer: 'D692CF88-5C77-47F3-A513-5129BDB76FC7',
                questionTagLayer: 'D692CF88-5C77-47F3-A513-5129BDB76FC8',
                textLayer: '11F0706A-4E1E-4DBA-A620-2D3EF44A9F2D',
                locationLayer: '73F19730-1C97-4660-8091-37428DDEC4A6',
                sourceId: '572187142-1CDC27E3-762F-4054-86F7-3403FA9518E0'
            };
        }
    }
    
    // Create the control panel
    createControlPanel() {
        try {
            console.log('🎨 Creating control panel...');
            
            // Remove existing panel if any
            const existingPanel = document.getElementById('mukana-scraper-panel');
            if (existingPanel) {
                existingPanel.remove();
            }
            
            // Create panel
            const panel = document.createElement('div');
            panel.id = 'mukana-scraper-panel';
            panel.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                width: 600px;
                background: var(--panel-bg, white);
                color: var(--panel-text, #333);
                border: 2px solid var(--panel-border, #0078d7);
                border-radius: 8px;
                box-shadow: 0 4px 12px var(--panel-shadow, rgba(0,0,0,0.3));
                z-index: 10000;
                font-family: Arial, sans-serif;
                font-size: 14px;
                transition: all 0.3s ease;
            `;
            
            panel.innerHTML = `
                <style>
                    /* Theme-aware CSS variables */
                    :root {
                        --panel-bg: #ffffff;
                        --panel-text: #333333;
                        --panel-border: #0078d7;
                        --panel-shadow: rgba(0,0,0,0.3);
                        --header-bg: #0078d7;
                        --header-text: #ffffff;
                        --config-bg: #fff3cd;
                        --config-text: #856404;
                        --config-border: #ffc107;
                        --input-bg: #ffffff;
                        --input-border: #cccccc;
                        --input-text: #333333;
                        --button-primary-bg: #28a745;
                        --button-primary-text: #ffffff;
                        --button-secondary-bg: #6c757d;
                        --button-secondary-text: #ffffff;
                        --button-info-bg: #17a2b8;
                        --button-info-text: #ffffff;
                        --button-warning-bg: #ffc107;
                        --button-warning-text: #000000;
                        --button-danger-bg: #dc3545;
                        --button-danger-text: #ffffff;
                        --status-success-bg: #e8f5e8;
                        --status-success-text: #2d5a2d;
                        --status-info-bg: #e3f2fd;
                        --status-info-text: #0d47a1;
                        --status-warning-bg: #fff3cd;
                        --status-warning-text: #856404;
                        --subsection-bg: #f8f9fa;
                        --subsection-border: #dee2e6;
                    }
                    
                    /* Dark mode */
                    @media (prefers-color-scheme: dark) {
                        :root {
                            --panel-bg: #2d3748;
                            --panel-text: #e2e8f0;
                            --panel-border: #4299e1;
                            --panel-shadow: rgba(0,0,0,0.5);
                            --header-bg: #4299e1;
                            --header-text: #ffffff;
                            --config-bg: #744210;
                            --config-text: #fbd38d;
                            --config-border: #ed8936;
                            --input-bg: #4a5568;
                            --input-border: #718096;
                            --input-text: #e2e8f0;
                            --button-primary-bg: #38a169;
                            --button-primary-text: #ffffff;
                            --button-secondary-bg: #718096;
                            --button-secondary-text: #ffffff;
                            --button-info-bg: #3182ce;
                            --button-info-text: #ffffff;
                            --button-warning-bg: #d69e2e;
                            --button-warning-text: #000000;
                            --button-danger-bg: #e53e3e;
                            --button-danger-text: #ffffff;
                            --status-success-bg: #22543d;
                            --status-success-text: #9ae6b4;
                            --status-info-bg: #1e3a8a;
                            --status-info-text: #93c5fd;
                            --status-warning-bg: #744210;
                            --status-warning-text: #fbd38d;
                            --subsection-bg: #4a5568;
                            --subsection-border: #718096;
                        }
                    }
                    
                    /* High contrast mode */
                    @media (prefers-contrast: high) {
                        :root {
                            --panel-border: #000000;
                            --input-border: #000000;
                            --subsection-border: #000000;
                        }
                    }
                    
                    /* Reduced motion */
                    @media (prefers-reduced-motion: reduce) {
                        * {
                            transition: none !important;
                        }
                    }
                </style>
                
                <div style="background: var(--header-bg); color: var(--header-text); padding: 10px; border-radius: 6px 6px 0 0; font-weight: bold;">
                    🔧 Mukana to mimoLive Sync
                    <button id="mukana-scraper-close" style="float: right; background: none; border: none; color: var(--header-text); cursor: pointer; font-size: 16px;">×</button>
                </div>
                <div style="padding: 15px;">
                    <div style="margin-bottom: 15px;">
                        <div style="font-size: 12px; color: #666; margin-bottom: 10px;">
                            <strong>📍 Fetching Current Question:</strong><br>
                            • Username (.msg_user .uName)<br>
                            • Location (.msg_user .uLoc)<br>
                            • Question Text (.msg_text)<br>
                            • URL Extraction (.msg_text)<br>
                            <em>Only processes the TOP question with "hostAnswer" class</em>
                        </div>
                    </div>
                    
                    <!-- Configuration Section -->
                    <div style="margin-bottom: 15px; background: var(--config-bg); border-radius: 4px; border-left: 4px solid var(--config-border); overflow: hidden;">
                        <div style="padding: 10px; cursor: pointer; user-select: none;" id="config-header">
                            <div style="font-size: 12px; color: var(--config-text); margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
                                <strong>⚙️ Configuration:</strong>
                                <span id="config-toggle-icon" style="font-size: 16px; transition: transform 0.3s;">▶</span>
                            </div>
                            <div style="font-size: 10px; color: var(--config-text); margin-bottom: 8px; line-height: 1.3;">
                                Configure your mimoLive API endpoints. The Document ID is the unique identifier for your mimoLive document, and the Port is where your mimoLive server is running.
                            </div>
                                                    <div style="font-size: 9px; color: var(--config-text); margin-bottom: 8px; line-height: 1.2; font-style: italic;">
                            Layer IDs should be in UUID format (e.g., D692CF88-5C77-47F3-A513-5129BDB76FC7)
                        </div>
                        </div>
                        
                        <div id="config-content" style="padding: 0 10px 10px 10px; display: none;">
                        
                        <!-- Basic Configuration -->
                        <div style="margin-bottom: 8px;">
                            <label style="font-size: 11px; color: var(--config-text); display: block; margin-bottom: 2px;">Document ID:</label>
                            <input type="text" id="mukana-document-id" value="${this.config?.documentId || '572187142'}" style="width: 100%; padding: 4px; border: 1px solid var(--input-border); border-radius: 3px; font-size: 11px; font-family: monospace; background: var(--input-bg); color: var(--input-text);">
                        </div>
                        <div style="margin-bottom: 8px;">
                            <label style="font-size: 11px; color: var(--config-text); display: block; margin-bottom: 2px;">Port:</label>
                            <input type="text" id="mukana-port" value="${this.config?.port || '49262'}" style="width: 100%; padding: 4px; border: 1px solid var(--input-border); border-radius: 3px; font-size: 11px; font-family: monospace; background: var(--input-bg); color: var(--input-text);">
                        </div>
                        
                        <!-- Username Endpoint Configuration -->
                        <div style="margin-top: 12px; padding: 8px; background: var(--subsection-bg); border-radius: 3px; border-left: 3px solid var(--panel-border);">
                            <div style="font-size: 10px; color: var(--config-text); margin-bottom: 6px; font-weight: bold;">👤 Name Endpoint:</div>
                            <div style="margin-bottom: 6px;">
                                <label style="font-size: 10px; color: var(--config-text); display: block; margin-bottom: 1px;">Layer ID:</label>
                                <input type="text" id="mukana-title-layer" value="${this.config?.titleLayer || 'D692CF88-5C77-47F3-A513-5129BDB76FC7'}" style="width: 100%; padding: 3px; border: 1px solid var(--input-border); border-radius: 2px; font-size: 10px; font-family: monospace; background: var(--input-bg); color: var(--input-text);">
                            </div>
                        </div>
                        
                        <!-- Question Tag Endpoint Configuration -->
                        <div style="margin-top: 8px; padding: 8px; background: var(--subsection-bg); border-radius: 3px; border-left: 3px solid var(--button-warning-bg);">
                            <div style="font-size: 10px; color: var(--config-text); margin-bottom: 6px; font-weight: bold;">🏷️ Question Tag Endpoint:</div>
                            <div style="margin-bottom: 6px;">
                                <label style="font-size: 10px; color: var(--config-text); display: block; margin-bottom: 1px;">Layer ID:</label>
                                <input type="text" id="mukana-question-tag-layer" value="${this.config?.questionTagLayer || 'D692CF88-5C77-47F3-A513-5129BDB76FC8'}" style="width: 100%; padding: 3px; border: 1px solid var(--input-border); border-radius: 2px; font-size: 10px; font-family: monospace; background: var(--input-bg); color: var(--input-text);">
                            </div>
                        </div>
                        
                        <!-- Location Endpoint Configuration -->
                        <div style="margin-top: 8px; padding: 8px; background: var(--subsection-bg); border-radius: 3px; border-left: 4px solid var(--button-info-bg);">
                            <div style="font-size: 10px; color: var(--config-text); margin-bottom: 6px; font-weight: bold;">📍 Location Endpoint:</div>
                            <div style="margin-bottom: 6px;">
                                <label style="font-size: 10px; color: var(--config-text); display: block; margin-bottom: 1px;">Layer ID:</label>
                                <input type="text" id="mukana-location-layer" value="${this.config?.locationLayer || '73F19730-1C97-4660-8091-37428DDEC4A6'}" style="width: 100%; padding: 3px; border: 1px solid var(--input-border); border-radius: 2px; font-size: 10px; font-family: monospace; background: var(--input-bg); color: var(--input-text);">
                            </div>
                        </div>
                        
                        <!-- Text Endpoint Configuration -->
                        <div style="margin-top: 8px; padding: 8px; background: var(--subsection-bg); border-radius: 3px; border-left: 3px solid var(--button-primary-bg);">
                            <div style="font-size: 10px; color: var(--config-text); margin-bottom: 6px; font-weight: bold;">📝 Text Endpoint:</div>
                            <div style="margin-bottom: 6px;">
                                <label style="font-size: 10px; color: var(--config-text); display: block; margin-bottom: 1px;">Layer ID:</label>
                                <input type="text" id="mukana-text-layer" value="${this.config?.textLayer || '11F0706A-4E1E-4DBA-A620-2D3EF44A9F2D'}" style="width: 100%; padding: 3px; border: 1px solid var(--input-border); border-radius: 2px; font-size: 10px; font-family: monospace; background: var(--input-bg); color: var(--input-text);">
                            </div>
                        </div>
                        
                        <!-- QR Endpoint Configuration -->
                        <div style="margin-top: 8px; padding: 8px; background: var(--subsection-bg); border-radius: 3px; border-left: 4px solid var(--button-danger-bg);">
                            <div style="font-size: 10px; color: var(--config-text); margin-bottom: 6px; font-weight: bold;">🔗 QR Endpoint (URL Extraction):</div>
                            <div style="font-size: 9px; color: var(--config-text); margin-bottom: 6px; line-height: 1.2; font-style: italic;">
                                Extracts first deep link from question text and sends to QR endpoint
                            </div>
                            <div style="margin-bottom: 6px;">
                                <label style="font-size: 10px; color: var(--config-text); display: block; margin-bottom: 1px;">Source ID:</label>
                                <input type="text" id="mukana-source-id" value="${this.config?.sourceId || '572187142-1CDC27E3-762F-4054-86F7-3403FA9518E0'}" style="width: 100%; padding: 3px; border: 1px solid var(--input-border); border-radius: 2px; font-size: 10px; font-family: monospace; background: var(--input-bg); color: var(--input-text);">
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 5px; margin-top: 12px;">
                            <button id="mukana-save-config" style="background: var(--button-primary-bg); color: var(--button-primary-text); padding: 4px 8px; border: none; border-radius: 3px; cursor: pointer; font-size: 11px; flex: 1;">
                                Save Config
                            </button>
                            <button id="mukana-reset-config" style="background: var(--button-secondary-bg); color: var(--button-secondary-text); padding: 4px 8px; border: none; border-radius: 3px; cursor: pointer; font-size: 11px; flex: 1;">
                                Reset
                            </button>
                        </div>
                        
                        <div style="margin-top: 8px;">
                            <button id="mukana-copy-endpoints" style="background: var(--button-info-bg); color: var(--button-info-text); padding: 6px 12px; border: none; border-radius: 3px; cursor: pointer; font-size: 11px; width: 100%;">
                                📋 Copy Current Endpoints
                            </button>
                        </div>
                        
                        <!-- Configuration Status -->
                        <div id="mukana-config-status" style="margin-top: 8px; padding: 6px; background: var(--status-success-bg); border-radius: 3px; border-left: 4px solid var(--button-primary-bg); font-size: 10px; color: var(--status-success-text);">
                            <strong>Current Config:</strong><br>
                            Document ID: <span id="config-doc-id">${this.config?.documentId || '572187142'}</span><br>
                            Port: <span id="config-port">${this.config?.port || '49262'}</span><br>
                            Username Layer: <span id="config-title-layer">${this.config?.titleLayer || 'D692CF88-5C77-47F3-A513-5129BDB76FC7'}</span><br>
                            Question Tag Layer: <span id="config-question-tag-layer">${this.config?.questionTagLayer || 'D692CF88-5C77-47F3-A513-5129BDB76FC8'}</span><br>
                            Text Layer: <span id="config-text-layer">${this.config?.textLayer || '11F0706A-4E1E-4DBA-A620-2D3EF44A9F2D'}</span><br>
                            Location Layer: <span id="config-location-layer">${this.config?.locationLayer || '73F19730-1C97-4660-8091-37428DDEC4A6'}</span><br>
                            Source ID: <span id="config-source-id">${this.config?.sourceId || '572187142-1CDC27E3-762F-4054-86F7-3403FA9518E0'}</span>
                        </div>
                        
                        <!-- API Endpoints Info -->
                        <div style="margin-top: 8px; padding: 6px; background: var(--status-info-bg); border-radius: 3px; border-left: 4px solid var(--button-info-bg); font-size: 9px; color: var(--status-info-text); line-height: 1.2;">
                            <strong>API Endpoints will be:</strong><br>
                            • Username: <code>127.0.0.1:${this.config?.port || '49262'}/api/v1/documents/${this.config?.documentId || '572187142'}/layers/${this.config?.titleLayer || 'D692CF88-5C77-47F3-A513-5129BDB76FC7'}</code><br>
                            • Question Tag: <code>127.0.0.1:${this.config?.port || '49262'}/api/v1/documents/${this.config?.documentId || '572187142'}/layers/${this.config?.questionTagLayer || 'D692CF88-5C77-47F3-A513-5129BDB76FC8'}</code><br>
                            • Text: <code>127.0.0.1:${this.config?.port || '49262'}/api/v1/documents/${this.config?.documentId || '572187142'}/layers/${this.config?.textLayer || '11F0706A-4E1E-4DBA-A620-2D3EF44A9F2D'}</code><br>
                            • Location: <code>127.0.0.1:${this.config?.port || '49262'}/api/v1/documents/${this.config?.documentId || '572187142'}/layers/${this.config?.locationLayer || '73F19730-1C97-4660-8091-37428DDEC4A6'}</code><br>
                            • QR: <code>127.0.0.1:${this.config?.port || '49262'}/api/v1/documents/${this.config?.documentId || '572187142'}/sources/${this.config?.sourceId || '572187142-1CDC27E3-762F-4054-86F7-3403FA9518E0'}</code>
                        </div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <div style="font-size: 12px; color: var(--panel-text); padding: 10px; background: var(--subsection-bg); border-radius: 4px;">
                            <strong>🔍 DOM Monitoring:</strong><br>
                            • Watches for new questions, updates, and removals<br>
                            • Automatically detects changes in real-time<br>
                            • No polling or intervals needed
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                         <button id="mukana-scraper-start" style="background: var(--button-primary-bg); color: var(--button-primary-text); padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">
                             Start DOM Watcher
                         </button>
                         <button id="mukana-scraper-stop" style="background: var(--button-danger-bg); color: var(--button-danger-text); padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">
                             Stop DOM Watcher
                         </button>
                         <button id="mukana-scraper-status" style="background: var(--button-info-bg); color: var(--button-info-text); padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">
                             Show Status
                         </button>
                         <button id="mukana-scraper-force-update" style="background: var(--button-warning-bg, #ffc107); color: var(--button-primary-text, #000); padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; margin-top: 8px; width: 100%;">
                             🔄 Force Update (Test)
                         </button>
                         <button id="mukana-scraper-clear-data" style="background: var(--button-danger-bg, #dc3545); color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; margin-top: 8px; width: 100%;">
                             🗑️ Clear Stored Data
                         </button>
                         <button id="mukana-scraper-mimolive-state" style="background: var(--button-info-bg, #17a2b8); color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; margin-top: 8px; width: 100%;">
                             🎯 Show MimoLive State
                         </button>
                         <button id="mukana-scraper-compare" style="background: var(--button-warning-bg, #ffc107); color: black; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; margin-top: 8px; width: 100%;">
                             🔍 Compare Current vs MimoLive
                         </button>
                         <button id="mukana-scraper-force-reset" style="background: var(--button-danger-bg, #dc3545); color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; margin-top: 8px; width: 100%;">
                             🔄 Force Reset & Refresh
                         </button>
                     </div>
                    
                    <div style="margin-bottom: 15px; padding: 10px; background: var(--subsection-bg); border-radius: 4px; border-left: 4px solid var(--panel-border);">
                        <div style="font-size: 12px; color: var(--panel-text);">
                            <strong>👁️ Real-Time DOM Watching:</strong><br>
                            • Automatically detects DOM changes instantly<br>
                            • Click "Start DOM Watcher" to begin watching<br>
                            • Click "Stop DOM Watcher" to halt the watcher<br>
                            • Updates mimoLive immediately when changes occur
                        </div>
                    </div>
                    
                    <!-- Real-time activity indicator -->
                    <div id="mukana-activity-indicator" style="margin-bottom: 15px; padding: 10px; background: var(--status-success-bg); border-radius: 4px; border-left: 4px solid var(--button-primary-bg); display: none;">
                        <div style="font-size: 12px; color: var(--status-success-text);">
                            <strong>🔄 Activity Monitor:</strong><br>
                            <span id="activity-status">Ready</span><br>
                            <span id="last-activity">No activity yet</span>
                        </div>
                    </div>
                    
                    <div id="mukana-scraper-status-display" style="background: var(--subsection-bg); padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px; display: none; color: var(--panel-text);">
                        Status will appear here...
                    </div>
                </div>
            `;
            
            // Add to page first
            document.body.appendChild(panel);
            console.log('✅ Control panel added to page');
            
            // Wait a moment for DOM to be ready, then add event listeners
            setTimeout(() => {
                try {
                    console.log('⏳ Adding event listeners...');
                    
                    const closeBtn = document.getElementById('mukana-scraper-close');
                    if (closeBtn) {
                        closeBtn.addEventListener('click', () => {
                            panel.style.display = 'none';
                        });
                        console.log('✅ Close button event listener added');
                    }
                    
                    const startBtn = document.getElementById('mukana-scraper-start');
                    if (startBtn) {
                        startBtn.addEventListener('click', () => {
                            this.startScraper();
                        });
                        console.log('✅ Start button event listener added');
                    }
                    
                    const stopBtn = document.getElementById('mukana-scraper-stop');
                    if (stopBtn) {
                        stopBtn.addEventListener('click', () => {
                            this.stopScraper();
                        });
                        console.log('✅ Stop button event listener added');
                    }
                    
                    const statusBtn = document.getElementById('mukana-scraper-status');
                    if (statusBtn) {
                        statusBtn.addEventListener('click', () => {
                            this.showStatus();
                        });
                        console.log('✅ Status button event listener added');
                    }
                    
                    const forceUpdateBtn = document.getElementById('mukana-scraper-force-update');
                    if (forceUpdateBtn) {
                        forceUpdateBtn.addEventListener('click', () => {
                            this.forceUpdate();
                        });
                        console.log('✅ Force update button event listener added');
                    }
                    
                    const clearDataBtn = document.getElementById('mukana-scraper-clear-data');
                    if (clearDataBtn) {
                        clearDataBtn.addEventListener('click', () => {
                            this.clearStoredData();
                        });
                        console.log('✅ Clear data button event listener added');
                    }
                    
                    const mimoLiveStateBtn = document.getElementById('mukana-scraper-mimolive-state');
                    if (mimoLiveStateBtn) {
                        mimoLiveStateBtn.addEventListener('click', () => {
                            this.showMimoLiveState();
                        });
                        console.log('✅ MimoLive state button event listener added');
                    }
                    
                    const compareBtn = document.getElementById('mukana-scraper-compare');
                    if (compareBtn) {
                        compareBtn.addEventListener('click', () => {
                            this.compareCurrentVsMimoLive();
                        });
                        console.log('✅ Compare button event listener added');
                    }
                    
                    const forceResetBtn = document.getElementById('mukana-scraper-force-reset');
                    if (forceResetBtn) {
                        forceResetBtn.addEventListener('click', () => {
                            this.forceResetAndRefresh();
                        });
                        console.log('✅ Force reset button event listener added');
                    }
                    
                    // Configuration event listeners
                    const saveConfigBtn = document.getElementById('mukana-save-config');
                    if (saveConfigBtn) {
                        saveConfigBtn.addEventListener('click', () => {
                            this.saveConfiguration();
                        });
                        console.log('✅ Save config button event listener added');
                    }
                    
                    const resetConfigBtn = document.getElementById('mukana-reset-config');
                    if (resetConfigBtn) {
                        resetConfigBtn.addEventListener('click', () => {
                            this.resetConfiguration();
                        });
                        console.log('✅ Reset config button event listener added');
                    }
                    
                    const copyEndpointsBtn = document.getElementById('mukana-copy-endpoints');
                    if (copyEndpointsBtn) {
                        copyEndpointsBtn.addEventListener('click', () => {
                            this.copyEndpoints();
                        });
                        console.log('✅ Copy endpoints button event listener added');
                    }
                    
                    // Configuration section toggle event listener
                    const configHeader = document.getElementById('config-header');
                    if (configHeader) {
                        configHeader.addEventListener('click', () => {
                            this.toggleConfigSection();
                        });
                        console.log('✅ Configuration toggle event listener added');
                    }
                    
                    console.log('✅ All event listeners added successfully');
                } catch (eventError) {
                    console.error('❌ Error adding event listeners:', eventError);
                }
            }, 100);
            
            return true;
            
        } catch (error) {
            console.error('❌ Failed to create control panel:', error);
            return false;
        }
    }
    
    // Start the DOM watcher
    async startScraper() {
        try {
            if (this.isRunning) {
                console.log('⚠️ DOM watcher is already running!');
                return;
            }
            
            // Validate configuration before starting
            if (!this.config || !this.config.documentId || !this.config.port || 
                !this.config.titleLayer || !this.config.questionTagLayer || !this.config.textLayer ||
                !this.config.locationLayer || !this.config.sourceId) {
                console.error('❌ Invalid configuration. Please configure all fields first.');
                this.updateActivityIndicator('❌ Config Error', 'Please configure all fields');
                alert('Please configure all the Document ID, Port, Layer IDs, and Source ID before starting the scraper.');
                return;
            }
            
            // Validate document ID format (should be numeric)
            if (!/^\d+$/.test(this.config.documentId)) {
                console.error('❌ Invalid Document ID format. Should be numeric only.');
                this.updateActivityIndicator('❌ Config Error', 'Document ID should be numeric');
                alert('Document ID should contain only numbers. Please check your configuration.');
                return;
            }
            
            // Validate port format (should be numeric and reasonable range)
            if (!/^\d+$/.test(this.config.port) || parseInt(this.config.port) < 1024 || parseInt(this.config.port) > 65535) {
                console.error('❌ Invalid Port format. Should be numeric between 1024-65535.');
                this.updateActivityIndicator('❌ Config Error', 'Port should be 1024-65535');
                alert('Port should be a number between 1024 and 65535. Please check your configuration.');
                return;
            }
            
            // Validate layer IDs (should be valid UUID format)
            const uuidRegex = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;
            
            if (!uuidRegex.test(this.config.titleLayer)) {
                console.error('❌ Invalid Title Layer ID format. Should be valid UUID.');
                this.updateActivityIndicator('❌ Config Error', 'Title Layer should be valid UUID');
                alert('Title Layer ID should be valid UUID. Please check your configuration.');
                return;
            }
            
            if (!uuidRegex.test(this.config.textLayer)) {
                console.error('❌ Invalid Text Layer ID format. Should be valid UUID.');
                this.updateActivityIndicator('❌ Config Error', 'Text Layer should be valid UUID');
                alert('Text Layer ID should be valid UUID. Please check your configuration.');
                return;
            }
            
                        if (!uuidRegex.test(this.config.locationLayer)) {
                console.error('❌ Invalid Location Layer ID format. Should be valid UUID.');
                this.updateActivityIndicator('❌ Config Error', 'Location Layer should be valid UUID');
                alert('Location Layer ID should be valid UUID. Please check your configuration.');
                return;
            }
            
            if (!uuidRegex.test(this.config.questionTagLayer)) {
                console.error('❌ Invalid Question Tag Layer ID format. Should be valid UUID.');
                this.updateActivityIndicator('❌ Config Error', 'Question Tag Layer should be valid UUID');
                alert('Question Tag Layer ID should be valid UUID. Please check your configuration.');
                return;
            }
            
            
            
            console.log('✅ Configuration validated. Starting DOM watcher...');
            console.log('📋 Using configuration:', this.config);
            
            // Start watching the DOM for changes
            this.startDOMWatching();
            
        } catch (error) {
            console.error('❌ Failed to start DOM watcher:', error);
        }
    }
    
    // Start watching the DOM for changes
    startDOMWatching() {
        try {
            this.isRunning = true;
            this.updateCount = 0;
            this.lastUpdateTime = null;
            
            console.log('👁️ Starting DOM watcher...');
            
            // Get the questions list element (new Mukana panel view structure)
            const questionsList = document.getElementById('ul_qs_panelQs');
            if (!questionsList) {
                throw new Error('Questions list not found');
            }
            
            console.log('🎯 Found questions list element:', questionsList);
            console.log('🔍 Current question count:', questionsList.querySelectorAll('li').length);
            
            // Create mutation observer to watch for changes
            this.mutationObserver = new MutationObserver((mutations) => {
                this.handleDOMChanges(mutations);
            });
            
            // Start observing with more comprehensive options
            this.mutationObserver.observe(questionsList, {
                childList: true,      // Watch for added/removed questions
                subtree: true,        // Watch all descendants
                attributes: true,     // Watch for attribute changes (especially 'hostAnswer' class)
                characterData: false, // Don't watch text changes - too noisy
                attributeFilter: ['class']  // Only watch class attribute changes
            });
            
            // Also watch the document body for any changes that might affect our target
            this.bodyObserver = new MutationObserver((mutations) => {
                // Check if any of these mutations affect our target area
                mutations.forEach(mutation => {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                const targetElement = node.querySelector('#ul_qs_panelQs') || 
                                                   (node.id === 'ul_qs_panelQs' ? node : null);
                                if (targetElement) {
                                    console.log('🎯 Target element found in body mutation, reconnecting observer...');
                                    this.reconnectObserver();
                                }
                            }
                        });
                    }
                });
            });
            
            this.bodyObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            // Don't perform initial data extraction - wait for actual DOM changes
            console.log('⏳ Waiting for DOM changes before extracting data...');
            
            // Start health check
            this.startHealthCheck();
            
            // Start question check for Firebase updates
            this.startQuestionCheck();
            
            // Update UI to show running state
            this.updateScraperStatus('Watching DOM');
            this.updateScraperStatus('Watching DOM');
            this.updateActivityIndicator('Watching DOM', 'DOM watcher started');
            
            console.log('✅ DOM watcher started successfully');
            
        } catch (error) {
            console.error('❌ Error starting DOM watcher:', error);
            this.isRunning = false;
        }
    }
    
    // Handle DOM changes
    handleDOMChanges(mutations) {
        console.log('🚀🚀🚀 handleDOMChanges CALLED! 🚀🚀🚀');
        console.log('🔄 DOM changes detected:', mutations.length, 'mutations');
        
        let shouldUpdate = false;
        let changeType = '';
        let hasRelevantChange = false;
        
        mutations.forEach((mutation, index) => {
            console.log(`🔍 Mutation ${index + 1}:`, {
                type: mutation.type,
                target: mutation.target,
                addedNodes: mutation.addedNodes.length,
                removedNodes: mutation.removedNodes.length,
                attributeName: mutation.attributeName,
                oldValue: mutation.oldValue
            });
            
            if (mutation.type === 'childList') {
                // Check if this is a relevant change to the questions list
                if (mutation.target.id === 'ul_qs_panelQs' || 
                    mutation.target.closest('#ul_qs_panelQs')) {
                    
                    if (mutation.addedNodes.length > 0) {
                        // Check if added nodes are actual question elements
                        const addedQuestions = Array.from(mutation.addedNodes).filter(node => 
                            node.nodeType === Node.ELEMENT_NODE && 
                            node.tagName === 'LI' && 
                            node.querySelector('.msg_text') &&
                            node.querySelector('.msg_user')
                        );
                        
                        if (addedQuestions.length > 0) {
                            changeType = `Added ${addedQuestions.length} visible question(s)`;
                            console.log('📝 Relevant question(s) added:', addedQuestions.length);
                            shouldUpdate = true;
                            hasRelevantChange = true;
                        } else {
                            console.log('⏭️ Added nodes are not relevant questions');
                        }
                    }
                    
                    if (mutation.removedNodes.length > 0) {
                        const removedQuestions = Array.from(mutation.removedNodes).filter(node => 
                            node.nodeType === Node.ELEMENT_NODE && 
                            node.tagName === 'LI'
                        );
                        
                        if (removedQuestions.length > 0) {
                            changeType = `Removed ${removedQuestions.length} question(s)`;
                            console.log('📝 Questions removed:', removedQuestions.length);
                            shouldUpdate = true;
                            hasRelevantChange = true;
                        }
                    }
                }
            } else if (mutation.type === 'characterData') {
                // Only trigger on text changes within comment elements
                if (mutation.target.closest('#ul_comments_hostOutput li')) {
                    changeType = 'Comment text updated';
                    console.log('📝 Comment text changed:', {
                        oldValue: mutation.oldValue,
                        newValue: mutation.target.textContent
                    });
                    shouldUpdate = true;
                    hasRelevantChange = true;
                }
            } else if (mutation.type === 'attributes') {
                // Only trigger on relevant attribute changes
                if (mutation.target.closest('#ul_qs_panelQs li') && 
                    mutation.attributeName === 'class') {
                    
                    const oldValue = mutation.oldValue || '';
                    const newValue = mutation.target.getAttribute('class') || '';
                    
                    // Check if 'hostAnswer' class was added or removed (new Mukana structure)
                    const wasHostAnswer = oldValue.includes('hostAnswer');
                    const isNowHostAnswer = newValue.includes('hostAnswer');
                    
                    if (wasHostAnswer !== isNowHostAnswer) {
                        if (isNowHostAnswer) {
                            changeType = 'Question now being answered';
                            console.log('🎯 Question now being answered:', {
                                element: mutation.target,
                                oldClasses: oldValue,
                                newClasses: newValue,
                                questionId: mutation.target.id,
                                timestamp: new Date().toISOString()
                            });
                        } else {
                            changeType = 'Question no longer being answered';
                            console.log('⏭️ Question no longer being answered:', {
                                element: mutation.target,
                                oldClasses: oldValue,
                                newClasses: newValue,
                                questionId: mutation.target.id,
                                timestamp: new Date().toISOString()
                            });
                        }
                        shouldUpdate = true;
                        hasRelevantChange = true;
                    } else {
                        console.log('⏭️ Class change but hostAnswer status unchanged');
                    }
                }
            }
        });
        
        if (shouldUpdate && hasRelevantChange) {
            // Show real-time activity
            this.updateActivityIndicator('DOM Change Detected', changeType);
            
            console.log('🚀 DOM change confirmed, calling extractAndUpdateData immediately...');
            
            // Add a small delay to prevent rapid switching issues
            // This helps if Mukana is auto-switching questions back and forth
            setTimeout(() => {
                this.extractAndUpdateData().catch(error => {
                    console.error('❌ Error in extractAndUpdateData:', error);
                    this.updateActivityIndicator('❌ Update Error', error.message);
                });
            }, 100); // 100ms delay to let DOM settle
        } else {
            console.log('⏭️ No relevant comment changes detected, skipping update');
            console.log('🔍 shouldUpdate:', shouldUpdate, 'hasRelevantChange:', hasRelevantChange);
        }
        
        // IMPORTANT: Only update when there's actually a question with hostAnswer class
        // Don't trigger updates for general DOM changes that don't affect the active question
    }
    
    // Extract data and update mimoLive
    async extractAndUpdateData() {
        console.log('🚀🚀🚀 extractAndUpdateData CALLED! 🚀🚀🚀');
        try {
            console.log('🔍 Extracting data from DOM...');
            
            // Get all question elements (new Mukana panel view structure)
            const questionElements = document.querySelectorAll('#ul_qs_panelQs > li');
            console.log(`📝 Found ${questionElements.length} question elements`);
            
            if (questionElements.length === 0) {
                console.log('⏭️ No questions found, skipping update');
                return;
            }
            
            // Check if there are any questions being answered (hostAnswer class)
            const answeringQuestions = document.querySelectorAll('#ul_qs_panelQs > li.hostAnswer');
            console.log(`🎯 Found ${answeringQuestions.length} questions being answered`);
            
            if (answeringQuestions.length === 0) {
                console.log('⏭️ No questions being answered found, skipping update');
                
                // Clear mimoLive when there are no active questions
                if (this.lastCommentData && this.lastCommentData.length > 0) {
                    console.log('🧹 No active questions - clearing mimoLive data...');
                    this.clearMimoLiveData();
                }
                
                return;
            }
            
            // Get the FIRST question with hostAnswer class (the one currently being answered)
            const currentQuestion = answeringQuestions[0];
            console.log('✅ Found current question being answered:', currentQuestion);
            console.log('🔍 Question element details:', {
                id: currentQuestion.id,
                classes: currentQuestion.className,
                hasHostAnswer: currentQuestion.classList.contains('hostAnswer'),
                element: currentQuestion
            });
            
            const commentData = [];
            
            // Only process the current question (first one with hostAnswer class)
            if (currentQuestion && currentQuestion.classList.contains('hostAnswer')) {
                try {
                    // Extract username from new Mukana structure (.msg_user .uName)
                    const userElement = currentQuestion.querySelector('.msg_user .uName');
                    const username = userElement ? userElement.textContent.trim() : 'Unknown User';
                    
                    // Extract location from new Mukana structure (.msg_user .uLoc)
                    const locationElement = currentQuestion.querySelector('.msg_user .uLoc');
                    let location = '';
                    if (locationElement) {
                        location = locationElement.textContent.trim();
                        console.log(`📍 Found location: "${location}"`);
                    }
                    
                    // Extract question text from new Mukana structure (.msg_text)
                    const textElement = currentQuestion.querySelector('.msg_text');
                    const questionText = textElement ? textElement.textContent.trim() : 'No text';
                    
                    // Extract question tag and clean the text
                    const { tag, cleanedText: textWithoutTag } = this.extractQuestionTag(questionText);
                    
                    // Extract URL from cleaned text and clean it further
                    const { url, cleanedText } = this.extractFirstDeepLink(textWithoutTag);
                    
                    const data = {
                        id: currentQuestion.id || `question-current`,
                        username: username,
                        location: location,
                        comment: cleanedText,
                        questionTag: tag,
                        originalComment: questionText,
                        extractedUrl: url,
                        timestamp: Date.now(),
                        order: 1
                    };
                    
                    commentData.push(data);
                    console.log(`✅ Extracted current question:`, data);
                    
                } catch (questionError) {
                    console.error(`❌ Error extracting current question:`, questionError);
                }
            }
            
            console.log(`🎯 Successfully extracted current question data`);
            
            // Check if data has changed before sending to API
            console.log('🔍 Checking if data has changed...');
            console.log('📊 Current data:', commentData.length > 0 ? { 
                username: commentData[0].username, 
                location: commentData[0].location,
                extractedUrl: commentData[0].extractedUrl,
                timestamp: commentData[0].timestamp
            } : 'No data');
            console.log('📊 Last data:', this.lastCommentData && this.lastCommentData.length > 0 ? { 
                username: this.lastCommentData[0].username, 
                location: this.lastCommentData[0].location,
                extractedUrl: this.lastCommentData[0].extractedUrl,
                timestamp: this.lastCommentData[0].timestamp
            } : 'None');
            
            // Only update when data has actually changed
            const shouldUpdate = this.hasDataChanged(commentData);
            
            if (shouldUpdate) {
                console.log('🔄 Data change detected, updating mimoLive endpoints...');
                console.log('📤 Sending this data to mimoLive:', commentData);
                console.log('🎯 Question ID being sent:', commentData[0]?.id);
                console.log('📝 Question text being sent:', commentData[0]?.comment?.substring(0, 100));
                this.updateActivityIndicator('Updating mimoLive', 'Processing data changes');
                
                try {
                    await this.sendScrapedData(null, commentData);
                    
                    // CRITICAL: Store the current question data with validation
                    const dataToStore = {
                        id: commentData[0].id,
                        username: commentData[0].username,
                        location: commentData[0].location,
                        comment: commentData[0].comment,
                        questionTag: commentData[0].questionTag,
                        originalComment: commentData[0].originalComment,
                        extractedUrl: commentData[0].extractedUrl,
                        timestamp: commentData[0].timestamp,
                        order: commentData[0].order
                    };
                    
                    // Validate the data before storing
                    if (!dataToStore.id || !dataToStore.username) {
                        console.error('❌ Invalid data detected, refusing to store:', dataToStore);
                        throw new Error('Invalid question data detected');
                    }
                    
                    this.lastCommentData = [dataToStore]; // Store as array with single validated object
                    this.updateCount++;
                    this.lastUpdateTime = Date.now();
                    
                    console.log('✅ Update completed, new lastCommentData stored');
                    console.log('📊 Update count:', this.updateCount);
                    console.log('📊 Stored data for next comparison:', this.lastCommentData);
                    console.log('🎯 MimoLive now shows question ID:', commentData[0]?.id);
                    console.log('📝 MimoLive now shows question text:', commentData[0]?.comment?.substring(0, 100));
                    
                    // Verify storage was successful
                    if (this.lastCommentData && this.lastCommentData[0] && this.lastCommentData[0].id === commentData[0].id) {
                        console.log('✅ Data storage verification successful');
                    } else {
                        console.error('❌ Data storage verification failed!');
                        console.error('Expected ID:', commentData[0].id);
                        console.error('Stored ID:', this.lastCommentData?.[0]?.id);
                    }
                } catch (error) {
                    console.error('❌ Error during mimoLive update:', error);
                    this.updateActivityIndicator('❌ Update Failed', error.message);
                }
            } else {
                console.log('⏭️ Data unchanged, skipping mimoLive API update');
                console.log('📊 Data unchanged - lastCommentData remains:', this.lastCommentData);
            }
            
            // Update status display
            this.updateScraperStatus('Watching DOM');
            
        } catch (error) {
            console.error('❌ Error during data extraction:', error);
        }
    }
    
    // Send scraped data to destination URL
    async sendScrapedData(destinationUrl, data) {
        try {
            console.log('📤 Sending scraped data to:', destinationUrl);
            console.log('📊 Data being sent:', data);
            
            // Check if this is the specific URL format we need to handle, or if no URL was provided (use default endpoints)
            if ((destinationUrl && destinationUrl.includes(`127.0.0.1:${this.config.port}`) && destinationUrl.includes('tvGroup_Content__Text_TypeMultiline')) || !destinationUrl) {
                // Check if we have valid data to scrape
                if (!data || data.length === 0) {
                    console.log('⏳ No data to scrape yet, skipping API calls');
                    return;
                }
                
                // Check if the first comment has valid username and comment text
                const firstComment = data[0];
                console.log('🔍 First comment data:', firstComment);
                
                if (!firstComment.username || !firstComment.comment || 
                    firstComment.username === 'Unknown User' || firstComment.comment === 'No text') {
                    console.log('⏳ First comment has invalid data, skipping API calls');
                    return;
                }
                
                // Extract the username from the first comment
                const username = firstComment.username;
                
                console.log('📝 Sending username update:', username);
                
                // Create URL-encoded JSON for the update parameter
                const updateData = {
                    "input-values": {
                        "tvGroup_Content__Text_TypeMultiline": username
                    }
                };
                const updateParam = encodeURIComponent(JSON.stringify(updateData));
                
                // Build the full URL with the update parameter
                const titleEndpoint = `http://127.0.0.1:${this.config.port}/api/v1/documents/${this.config.documentId}/layers/${this.config.titleLayer}?include=data.attributes.input-values&fields%5Binput-values%5D=tvGroup_Content__Text_TypeMultiline&update=${updateParam}`;
                
                console.log('🌐 Attempting to connect to title endpoint:', titleEndpoint);
                
                try {
                    const response = await fetch(titleEndpoint, {
                        method: 'GET',
                        headers: {
                            'User-Agent': 'MukanaScraper/1.0'
                        }
                    });
                    
                    if (response.ok) {
                        console.log('✅ Username update sent successfully via GET');
                        console.log(`🎯 Title updated to: ${username}`);
                        this.updateActivityIndicator('✅ Title Updated', `Username: ${username}`);
                    } else {
                        const responseText = await response.text();
                        console.error('❌ Failed to update username. Status:', response.status);
                        console.error('❌ Response text:', responseText);
                        console.error('❌ Response headers:', Object.fromEntries(response.headers.entries()));
                        this.updateActivityIndicator('❌ Title Update Failed', `Status: ${response.status}`);
                        throw new Error(`Username update failed: ${response.status} - ${responseText}`);
                    }
                } catch (titleError) {
                    console.error('❌ Error updating username:', titleError);
                    console.error('❌ Error details:', {
                        name: titleError.name,
                        message: titleError.message,
                        stack: titleError.stack
                    });
                    
                    if (titleError.name === 'TypeError' && titleError.message.includes('fetch')) {
                        console.error(`🌐 Network error: Unable to connect to ${titleEndpoint}. Please check if the server is running and accessible.`);
                    } else {
                        console.error(`❌ Error updating username: ${titleError.message}`);
                    }
                    return; // Don't continue with text update if title update failed
                }
                
                // Now send the question tag to the question tag endpoint
                const questionTag = firstComment.questionTag;
                
                if (questionTag) {
                    console.log('🏷️ Sending question tag update:', questionTag);
                    
                    // Create URL-encoded JSON for the question tag update parameter
                    const tagUpdateData = {
                        "input-values": {
                            "tvGroup_Content__Text_TypeMultiline": questionTag
                        }
                    };
                    const tagUpdateParam = encodeURIComponent(JSON.stringify(tagUpdateData));
                    
                    // Build the full URL with the update parameter
                    const tagEndpoint = `http://127.0.0.1:${this.config.port}/api/v1/documents/${this.config.documentId}/layers/${this.config.questionTagLayer}?include=data.attributes.input-values&fields%5Binput-values%5D=tvGroup_Content__Text_TypeMultiline&update=${tagUpdateParam}`;
                    
                    console.log('🌐 Attempting to connect to question tag endpoint:', tagEndpoint);
                    
                    try {
                        const tagResponse = await fetch(tagEndpoint, {
                            method: 'GET',
                            headers: {
                                'User-Agent': 'MukanaScraper/1.0'
                            }
                        });
                        
                        if (tagResponse.ok) {
                            console.log('✅ Question tag update sent successfully via GET');
                            console.log(`🏷️ Question tag updated to: ${questionTag}`);
                            this.updateActivityIndicator('✅ Tag Updated', `Question Tag: ${questionTag}`);
                        } else {
                            const responseText = await tagResponse.text();
                            console.error('❌ Failed to update question tag. Status:', tagResponse.status);
                            console.error('❌ Response text:', responseText);
                            this.updateActivityIndicator('❌ Tag Update Failed', `Status: ${tagResponse.status}`);
                            throw new Error(`Question tag update failed: ${tagResponse.status} - ${responseText}`);
                        }
                    } catch (tagError) {
                        console.error('❌ Error updating question tag:', tagError);
                        console.error('❌ Error details:', {
                            name: tagError.name,
                            message: tagError.message,
                            stack: tagError.stack
                        });
                        
                        if (tagError.name === 'TypeError' && tagError.message.includes('fetch')) {
                            console.error(`🌐 Network error: Unable to connect to ${tagEndpoint}. Please check if the server is running and accessible.`);
                        } else {
                            console.error(`❌ Error updating question tag: ${tagError.message}`);
                        }
                        // Continue with other updates even if tag update fails
                    }
                } else {
                    console.log('🧹 No question tag found, clearing tag endpoint');
                    await this.clearQuestionTagEndpoint();
                }
                
                // Now send the comment text to the second endpoint
                const commentText = firstComment.comment;
                
                // Create URL-encoded JSON for the update parameter
                const textUpdateData = {
                    "input-values": {
                        "tvGroup_Content__Text_TypeMultiline": commentText
                    }
                };
                const textUpdateParam = encodeURIComponent(JSON.stringify(textUpdateData));
                
                // Build the full URL with the update parameter
                const textEndpoint = `http://127.0.0.1:${this.config.port}/api/v1/documents/${this.config.documentId}/layers/${this.config.textLayer}?include=data.attributes.input-values&fields%5Binput-values%5D=tvGroup_Content__Text_TypeMultiline&update=${textUpdateParam}`;
                
                console.log('🌐 Attempting to connect to text endpoint:', textEndpoint);
                
                try {
                    const textResponse = await fetch(textEndpoint, {
                        method: 'GET',
                        headers: {
                            'User-Agent': 'MukanaScraper/1.0'
                        }
                    });
                    
                    if (textResponse.ok) {
                        console.log('✅ Comment text update sent successfully via GET');
                        console.log(`🎯 Comment text updated: ${commentText}`);
                        this.updateActivityIndicator('✅ Comment Updated', `Comment: ${commentText}`);
                    } else {
                        const responseText = await textResponse.text();
                        console.error('❌ Failed to update comment text. Status:', textResponse.status);
                        console.error('❌ Response text:', responseText);
                        console.error('❌ Response headers:', Object.fromEntries(textResponse.headers.entries()));
                        this.updateActivityIndicator('❌ Comment Update Failed', `Status: ${textResponse.status}`);
                        throw new Error(`Comment text update failed: ${textResponse.status} - ${responseText}`);
                    }
                } catch (textError) {
                    console.error('❌ Error updating comment text:', textError);
                    console.error('❌ Error details:', {
                        name: textError.name,
                        message: textError.message,
                        stack: textError.stack
                    });
                    
                    if (textError.name === 'TypeError' && textError.message.includes('fetch')) {
                        console.error(`🌐 Network error: Unable to connect to ${textEndpoint}. Please check if the server is running and accessible.`);
                    } else {
                        console.error(`❌ Title updated but comment text error: ${textError.message}`);
                    }
                }
                
                // Now send the user info to the third endpoint
                const userInfo = firstComment.location || ''; // Only send the location, not username + location
                
                // Create URL-encoded JSON for the user info update parameter
                const userInfoUpdateData = {
                    "input-values": {
                        "tvGroup_Content__Text_TypeMultiline": userInfo
                    }
                };
                const userInfoUpdateParam = encodeURIComponent(JSON.stringify(userInfoUpdateData));
                
                // Build the full URL with the update parameter
                const userInfoEndpoint = `http://127.0.0.1:${this.config.port}/api/v1/documents/${this.config.documentId}/layers/${this.config.locationLayer}?include=data.attributes.input-values&fields%5Binput-values%5D=tvGroup_Content__Text_TypeMultiline&update=${userInfoUpdateParam}`;
                
                console.log('🌐 Attempting to connect to user info endpoint:', userInfoEndpoint);
                
                try {
                    const userInfoResponse = await fetch(userInfoEndpoint, {
                        method: 'GET',
                        headers: {
                            'User-Agent': 'MukanaScraper/1.0'
                        }
                    });
                    
                    if (userInfoResponse.ok) {
                        console.log('✅ User info update sent successfully via GET');
                        console.log(`🎯 Location updated: ${userInfo}`);
                        this.updateActivityIndicator('✅ Location Updated', `Location: ${userInfo}`);
                    } else {
                        const responseText = await userInfoResponse.text();
                        console.error('❌ Failed to update user info. Status:', userInfoResponse.status);
                        console.error('❌ Response text:', responseText);
                        console.error('❌ Response headers:', Object.fromEntries(userInfoResponse.headers.entries()));
                        this.updateActivityIndicator('❌ User Info Update Failed', `Status: ${userInfoResponse.status}`);
                        throw new Error(`User info update failed: ${userInfoResponse.status} - ${responseText}`);
                    }
                } catch (userInfoError) {
                    console.error('❌ Error updating user info:', userInfoError);
                    console.error('❌ Error details:', {
                        name: userInfoError.name,
                        message: userInfoError.message,
                        stack: userInfoError.stack
                    });
                    
                    if (userInfoError.name === 'TypeError' && userInfoError.message.includes('fetch')) {
                        console.error(`🌐 Network error: Unable to connect to ${userInfoEndpoint}. Please check if the server is running and accessible.`);
                    } else {
                        console.error(`❌ Error updating user info: ${userInfoError.message}`);
                    }
                }
                
                // Now send the extracted URL to the QR endpoint (4th endpoint)
                const extractedUrl = firstComment.extractedUrl;
                
                if (extractedUrl) {
                    console.log('🔗 Sending extracted URL to QR endpoint:', extractedUrl);
                    await this.sendURLToQREndpoint(extractedUrl);
                    const tagInfo = firstComment.questionTag ? ` + Tag: ${firstComment.questionTag}` : '';
                    this.updateActivityIndicator('✅ Complete Update', `Title: ${username}${tagInfo} + Comment + Location + QR: ${extractedUrl}`);
                } else {
                    console.log('🧹 No URL found, clearing QR endpoint');
                    await this.clearQREndpoint();
                    const tagInfo = firstComment.questionTag ? ` + Tag: ${firstComment.questionTag}` : '';
                    this.updateActivityIndicator('✅ Complete Update', `Title: ${username}${tagInfo} + Comment + Location + QR Cleared`);
                }
            } else {
                // Default payload for other URLs
                const payload = {
                    type: 'mukana_scraped_data',
                    timestamp: Date.now(),
                    totalComments: data.length,
                    comments: data,
                    source: window.location.href
                };
                
                const response = await fetch(destinationUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'MukanaScraper/1.0'
                    },
                    body: JSON.stringify(payload)
                });
                
                            if (response.ok) {
                console.log('✅ Data sent successfully');
                console.log(`📤 Successfully scraped and sent ${data.length} comments to ${destinationUrl}`);
            } else {
                console.error('❌ Failed to send data. Status:', response.status);
            }
            }
            
        } catch (error) {
            console.error('❌ Error sending data:', error);
        }
    }
    
    // Stop the DOM watcher
    stopScraper() {
        try {
            if (!this.isRunning) {
                console.log('⚠️ DOM watcher is not currently running');
                return;
            }
            
            console.log('🛑 Stopping DOM watcher...');
            
            // Disconnect the mutation observer
            if (this.mutationObserver) {
                this.mutationObserver.disconnect();
                this.mutationObserver = null;
                console.log('✅ Mutation observer disconnected');
            }
            
            // Disconnect body observer
            if (this.bodyObserver) {
                this.bodyObserver.disconnect();
                this.bodyObserver = null;
                console.log('✅ Body observer disconnected');
            }
            
            // Stop health check
            if (this.healthCheckInterval) {
                clearInterval(this.healthCheckInterval);
                this.healthCheckInterval = null;
                console.log('✅ Health check stopped');
            }
            
            // Stop question check
            if (this.questionCheckInterval) {
                clearInterval(this.questionCheckInterval);
                this.questionCheckInterval = null;
                console.log('✅ Question check stopped');
            }
            
            // Update state
            this.isRunning = false;
            
            // Update UI to show stopped state
            this.updateScraperStatus('Stopped');
            this.updateActivityIndicator('Stopped', 'DOM watcher stopped');
            
            console.log('✅ DOM watcher stopped successfully');
            console.log(`🛑 DOM watcher stopped. Total updates performed: ${this.updateCount}`);
            
        } catch (error) {
            console.error('❌ Error stopping DOM watcher:', error);
        }
    }
    
    // Update DOM watcher status display
    updateScraperStatus(status) {
        const statusDiv = document.getElementById('mukana-scraper-status-display');
        if (statusDiv) {
            const questionElements = document.querySelectorAll('#ul_qs_panelQs > li');
            const lastUpdateText = this.lastUpdateTime ? new Date(this.lastUpdateTime).toLocaleTimeString() : 'Never';
            
            statusDiv.innerHTML = `
                <strong>DOM Watcher Status:</strong><br>
                Status: ${status}<br>
                Updates Performed: ${this.updateCount}<br>
                Questions Found: ${questionElements.length}<br>
                Fields Monitored: .msg_user .uName, .msg_text, .msg_user .uLoc<br>
                Last Update: ${lastUpdateText}<br>
                Current Time: ${new Date().toLocaleTimeString()}
            `;
            statusDiv.style.display = 'block';
        }
    }
    
    // Update real-time activity indicator
    updateActivityIndicator(activity, details = '') {
        const indicator = document.getElementById('mukana-activity-indicator');
        const statusSpan = document.getElementById('activity-status');
        const lastActivitySpan = document.getElementById('last-activity');
        
        if (indicator && statusSpan && lastActivitySpan) {
            // Show the indicator
            indicator.style.display = 'block';
            
            // Update status
            statusSpan.textContent = activity;
            
            // Update last activity with timestamp
            const timestamp = new Date().toLocaleTimeString();
            lastActivitySpan.textContent = `${details} at ${timestamp}`;
            
            // Auto-hide after 5 seconds if it's not a persistent status
            if (activity !== 'Watching DOM' && activity !== 'Stopped') {
                setTimeout(() => {
                    if (indicator && this.isRunning) {
                        indicator.style.display = 'none';
                    }
                }, 5000);
            }
        }
    }
    
    // Check if question data has changed since last update
    hasDataChanged(newData) {
        console.log('🔍 hasDataChanged called with:', {
            newData: newData,
            lastCommentData: this.lastCommentData,
            newDataLength: newData?.length,
            lastDataLength: this.lastCommentData?.length
        });
        
        if (!this.lastCommentData || !newData || newData.length === 0) {
            console.log('📊 First update or no data, considering data changed');
            return true; // First update or no data, consider it changed
        }
        
        // Since we only process one question at a time, compare the first (and only) question
        const lastQuestion = this.lastCommentData[0];
        const newQuestion = newData[0];
        
        console.log('🔍 Comparing questions:', {
            lastQuestion: lastQuestion,
            newQuestion: newQuestion
        });
        
        if (!lastQuestion || !newQuestion) {
            console.log('📊 Question data missing, considering data changed');
            return true;
        }
        
        // CRITICAL: Validate question data integrity
        if (!lastQuestion.id || !newQuestion.id) {
            console.error('❌ Invalid question data detected in comparison');
            console.error('Last question:', lastQuestion);
            console.error('New question:', newQuestion);
            return true; // Force update if data is corrupted
        }
        
        // CRITICAL: Check if we're comparing the same question type
        if (lastQuestion.id === newQuestion.id) {
            console.log('🔍 Same question ID detected, checking for content changes...');
        } else {
            console.log('🔄 Different question ID detected, forcing update...');
            return true;
        }
        
        // Check if any field has changed - use strict comparison
        const usernameChanged = String(lastQuestion.username) !== String(newQuestion.username);
        const locationChanged = String(lastQuestion.location) !== String(newQuestion.location);
        const tagChanged = String(lastQuestion.questionTag || '') !== String(newQuestion.questionTag || '');
        const urlChanged = String(lastQuestion.extractedUrl || '') !== String(newQuestion.extractedUrl || '');
        
        console.log('🔍 Field comparison results:', {
            username: { old: lastQuestion.username, new: newQuestion.username, changed: usernameChanged },
            location: { old: lastQuestion.location, new: newQuestion.location, changed: locationChanged },
            tag: { old: lastQuestion.questionTag, new: newQuestion.questionTag, changed: tagChanged },
            url: { old: lastQuestion.extractedUrl, new: newQuestion.extractedUrl, changed: urlChanged }
        });
        
        if (usernameChanged || locationChanged || tagChanged || urlChanged) {
            console.log('📊 Data change detected in current question');
            return true;
        }
        
        // Also check if the question ID changed (different question being answered)
        const questionIdChanged = lastQuestion.id !== newQuestion.id;
        if (questionIdChanged) {
            console.log('📊 Question ID changed - different question being answered');
            console.log('🔄 Switching from question:', lastQuestion.id, 'to:', newQuestion.id);
            console.log('📝 Old question text:', lastQuestion.comment?.substring(0, 100));
            console.log('📝 New question text:', newQuestion.comment?.substring(0, 100));
            return true;
        }
        
        console.log('📊 No data changes detected in current question');
        return false;
    }
    
    // Show scraper status
    showStatus() {
        this.updateScraperStatus(this.isRunning ? 'Running' : 'Stopped');
        
        // Also refresh configuration display
        this.refreshConfigurationDisplay();
    }
    
    // Refresh configuration display with current values
    refreshConfigurationDisplay() {
        const documentIdInput = document.getElementById('mukana-document-id');
        const portInput = document.getElementById('mukana-port');
        const titleLayerInput = document.getElementById('mukana-title-layer');
        const questionTagLayerInput = document.getElementById('mukana-question-tag-layer');
        const textLayerInput = document.getElementById('mukana-text-layer');
        const locationLayerInput = document.getElementById('mukana-location-layer');
        const sourceIdInput = document.getElementById('mukana-source-id');
        
        const configDocIdSpan = document.getElementById('config-doc-id');
        const configPortSpan = document.getElementById('config-port');
        const configTitleLayerSpan = document.getElementById('config-title-layer');
        const configQuestionTagLayerSpan = document.getElementById('config-question-tag-layer');
        const configTextLayerSpan = document.getElementById('config-text-layer');
        const configLocationLayerSpan = document.getElementById('config-location-layer');
        const configSourceIdSpan = document.getElementById('config-source-id');
        
        if (documentIdInput && this.config) {
            documentIdInput.value = this.config.documentId || '572187142';
        }
        
        if (portInput && this.config) {
            portInput.value = this.config.port || '49262';
        }
        
        if (titleLayerInput && this.config) {
            titleLayerInput.value = this.config.titleLayer || 'D692CF88-5C77-47F3-A513-5129BDB76FC7';
        }
        
        if (questionTagLayerInput && this.config) {
            questionTagLayerInput.value = this.config.questionTagLayer || 'D692CF88-5C77-47F3-A513-5129BDB76FC8';
        }
        
        if (textLayerInput && this.config) {
            textLayerInput.value = this.config.textLayer || '11F0706A-4E1E-4DBA-A620-2D3EF44A9F2D';
        }
        
        if (locationLayerInput && this.config) {
            locationLayerInput.value = this.config.locationLayer || '73F19730-1C97-4660-8091-37428DDEC4A6';
        }
        
        if (sourceIdInput && this.config) {
            sourceIdInput.value = this.config.sourceId || '572187142-1CDC27E3-762F-4054-86F7-3403FA9518E0';
        }
        
        if (configDocIdSpan && this.config) {
            configDocIdSpan.textContent = this.config.documentId || '572187142';
        }
        
        if (configPortSpan && this.config) {
            configPortSpan.textContent = this.config.port || '49262';
        }
        
        if (configTitleLayerSpan && this.config) {
            configTitleLayerSpan.textContent = this.config.titleLayer || 'D692CF88-5C77-47F3-A513-5129BDB76FC7';
        }
        
        if (configQuestionTagLayerSpan && this.config) {
            configQuestionTagLayerSpan.textContent = this.config.questionTagLayer || 'D692CF88-5C77-47F3-A513-5129BDB76FC8';
        }
        
        if (configTextLayerSpan && this.config) {
            configTextLayerSpan.textContent = this.config.textLayer || '11F0706A-4E1E-4DBA-A620-2D3EF44A9F2D';
        }
        
        if (configLocationLayerSpan && this.config) {
            configLocationLayerSpan.textContent = this.config.locationLayer || '73F19730-1C97-4660-8091-37428DDEC4A6';
        }
        
        if (configSourceIdSpan && this.config) {
            configSourceIdSpan.textContent = this.config.sourceId || '572187142-1CDC27E3-762F-4054-86F7-3403FA9518E0';
        }
        
        // Update API endpoints info display
        this.updateAPIEndpointsInfo();
        
        console.log('✅ Configuration display refreshed with current values:', this.config);
    }
    
    // Update the API endpoints info display
    updateAPIEndpointsInfo() {
        const apiEndpointsInfo = document.querySelector('#mukana-config-status + div');
        if (apiEndpointsInfo && this.config) {
            const docId = this.config.documentId || '572187142';
            const port = this.config.port || '49262';
            
            apiEndpointsInfo.innerHTML = `
                <strong>API Endpoints will be:</strong><br>
                • Username: <code>127.0.0.1:${port}/api/v1/documents/${docId}/layers/${this.config.titleLayer}</code><br>
                • Text: <code>127.0.0.1:${port}/api/v1/documents/${docId}/layers/${this.config.textLayer}</code><br>
                • Location: <code>127.0.0.1:${port}/api/v1/documents/${docId}/layers/${this.config.locationLayer}</code><br>
                • QR: <code>127.0.0.1:${port}/api/v1/documents/${docId}/sources/${this.config.sourceId}</code>
            `;
        }
    }
    
    // Copy current endpoints to clipboard
    async copyEndpoints() {
        try {
            if (!this.config) {
                alert('Please save your configuration first');
                return;
            }
            
            const docId = this.config.documentId;
            const port = this.config.port;
            
            const endpoints = `Name Endpoint:
127.0.0.1:${port}/api/v1/documents/${docId}/layers/${this.config.titleLayer}

Question Tag Endpoint:
127.0.0.1:${port}/api/v1/documents/${docId}/layers/${this.config.questionTagLayer}

Text Endpoint:
127.0.0.1:${port}/api/v1/documents/${docId}/layers/${this.config.textLayer}

Location Endpoint:
127.0.0.1:${port}/api/v1/documents/${docId}/layers/${this.config.locationLayer}

QR Endpoint:
127.0.0.1:${port}/api/v1/documents/${docId}/sources/${this.config.sourceId}`;
            
            await navigator.clipboard.writeText(endpoints);
            
            // Show success message
            const copyBtn = document.getElementById('mukana-copy-endpoints');
            if (copyBtn) {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = '✅ Copied!';
                copyBtn.style.background = '#28a745';
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                    copyBtn.style.background = '#17a2b8';
                }, 2000);
            }
            
            this.updateActivityIndicator('✅ Endpoints Copied', 'All endpoints copied to clipboard');
            console.log('✅ Endpoints copied to clipboard');
            
        } catch (error) {
            console.error('❌ Failed to copy endpoints:', error);
            this.updateActivityIndicator('❌ Copy Failed', error.message);
            alert('Failed to copy endpoints: ' + error.message);
        }
    }
    
    // Extract first deep link from text
    extractFirstDeepLink(text) {
        if (!text || typeof text !== 'string') {
            return { url: null, cleanedText: text };
        }
        
        // Regex to find deep links (URLs with content after TLD)
        const deepLinkRegex = /https?:\/\/[^\s]+[\/\w\-\.\?=&%]+|www\.[^\s]+[\/\w\-\.\?=&%]+/i;
        const match = text.match(deepLinkRegex);
        
        if (!match) {
            return { url: null, cleanedText: text };
        }
        
        const url = match[0];
        let cleanedText = text.replace(url, '');
        
        // Clean up trailing punctuation and spaces
        cleanedText = cleanedText.replace(/[,\s]*$/, ''); // Remove trailing comma and spaces
        cleanedText = cleanedText.trim();
        
        console.log('🔗 URL extracted:', url);
        console.log('📝 Cleaned text:', cleanedText);
        
        return { url: url, cleanedText: cleanedText };
    }
    
    // Extract question tag from text (e.g., "[TAG] Question text here")
    extractQuestionTag(text) {
        if (!text || typeof text !== 'string') {
            return { tag: null, cleanedText: text };
        }
        
        // Regex to find question tags in format [TAG] or (TAG) or #TAG
        const tagRegex = /^[\[\(#]([^\]]+)[\]\)]?\s*(.*)/;
        const match = text.match(tagRegex);
        
        if (!match) {
            return { tag: null, cleanedText: text };
        }
        
        const tag = match[1].trim();
        let cleanedText = match[2].trim();
        
        console.log('🏷️ Question tag extracted:', tag);
        console.log('📝 Cleaned question text:', cleanedText);
        
        return { tag: tag, cleanedText: cleanedText };
    }
    
    // Send URL to QR endpoint
    async sendURLToQREndpoint(url) {
        try {
            if (!this.config || !this.config.sourceId) {
                console.error('❌ Source ID not configured for QR endpoint');
                return;
            }
            
            // Create URL-encoded JSON for the update parameter
            const updateData = {
                "input-values": {
                    "tvGroup_Content__QR_Content": url
                }
            };
            const updateParam = encodeURIComponent(JSON.stringify(updateData));
            
            // Build the full URL with the update parameter
            const qrEndpoint = `http://127.0.0.1:${this.config.port}/api/v1/documents/${this.config.documentId}/sources/${this.config.sourceId}?include=data.attributes.input-values&fields%5Binput-values%5D=tvGroup_Content__QR_Content&update=${updateParam}`;
            
            console.log('🌐 Attempting to connect to QR endpoint:', qrEndpoint);
            
            const response = await fetch(qrEndpoint, {
                method: 'GET',
                headers: {
                    'User-Agent': 'MukanaScraper/1.0'
                }
            });
            
            if (response.ok) {
                console.log('✅ URL sent successfully to QR endpoint');
                this.updateActivityIndicator('✅ QR Updated', `URL: ${url}`);
            } else {
                const responseText = await response.text();
                console.error('❌ Failed to send URL to QR endpoint. Status:', response.status);
                console.error('❌ Response text:', responseText);
                this.updateActivityIndicator('❌ QR Update Failed', `Status: ${response.status}`);
                throw new Error(`QR endpoint update failed: ${response.status} - ${responseText}`);
            }
            
        } catch (error) {
            console.error('❌ Error sending URL to QR endpoint:', error);
            this.updateActivityIndicator('❌ QR Error', error.message);
        }
    }
    
    // Clear QR endpoint (send empty string)
    async clearQREndpoint() {
        try {
            if (!this.config || !this.config.sourceId) {
                console.error('❌ Source ID not configured for QR endpoint');
                return;
            }
            
            // Create URL-encoded JSON for the update parameter with empty string
            const updateData = {
                "input-values": {
                    "tvGroup_Content__QR_Content": ""
                }
            };
            const updateParam = encodeURIComponent(JSON.stringify(updateData));
            
            // Build the full URL with the update parameter
            const qrEndpoint = `http://127.0.0.1:${this.config.port}/api/v1/documents/${this.config.documentId}/sources/${this.config.sourceId}?include=data.attributes.input-values&fields%5Binput-values%5D=tvGroup_Content__QR_Content&update=${updateParam}`;
            
            console.log('🌐 Clearing QR endpoint:', qrEndpoint);
            
            const response = await fetch(qrEndpoint, {
                method: 'GET',
                headers: {
                    'User-Agent': 'MukanaScraper/1.0'
                }
            });
            
            if (response.ok) {
                console.log('✅ QR endpoint cleared successfully');
                this.updateActivityIndicator('✅ QR Cleared', 'QR field cleared');
            } else {
                const responseText = await response.text();
                console.error('❌ Failed to clear QR endpoint. Status:', response.status);
                console.error('❌ Response text:', responseText);
                this.updateActivityIndicator('❌ QR Clear Failed', `Status: ${response.status}`);
            }
            
        } catch (error) {
            console.error('❌ Error clearing QR endpoint:', error);
            this.updateActivityIndicator('❌ QR Clear Error', error.message);
        }
    }
    
    // Clear question tag endpoint (send empty string)
    async clearQuestionTagEndpoint() {
        try {
            if (!this.config || !this.config.questionTagLayer) {
                console.error('❌ Question Tag Layer not configured for tag endpoint');
                return;
            }
            
            // Create URL-encoded JSON for the update parameter with empty string
            const updateData = {
                "input-values": {
                    "tvGroup_Content__Text_TypeMultiline": ""
                }
            };
            const updateParam = encodeURIComponent(JSON.stringify(updateData));
            
            // Build the full URL with the update parameter
            const tagEndpoint = `http://127.0.0.1:${this.config.port}/api/v1/documents/${this.config.documentId}/layers/${this.config.questionTagLayer}?include=data.attributes.input-values&fields%5Binput-values%5D=tvGroup_Content__Text_TypeMultiline&update=${updateParam}`;
            
            console.log('🌐 Clearing question tag endpoint:', tagEndpoint);
            
            const response = await fetch(tagEndpoint, {
                method: 'GET',
                headers: {
                    'User-Agent': 'MukanaScraper/1.0'
                }
            });
            
            if (response.ok) {
                console.log('✅ Question tag endpoint cleared successfully');
                this.updateActivityIndicator('✅ Tag Cleared', 'Question tag field cleared');
            } else {
                const responseText = await response.text();
                console.error('❌ Failed to clear question tag endpoint. Status:', response.status);
                console.error('❌ Response text:', responseText);
                this.updateActivityIndicator('❌ Tag Clear Failed', `Status: ${response.status}`);
            }
            
        } catch (error) {
            console.error('❌ Error clearing question tag endpoint:', error);
            this.updateActivityIndicator('❌ Tag Clear Error', error.message);
        }
    }
    
    // Test URL extraction (for debugging)
    testURLExtraction() {
        console.log('🧪 Testing URL extraction...');
        
        const testCases = [
            "What do you think about this article? https://www.mediaevent.no/article/123 about the new features",
            "Check this out: https://example.com/page1 and also https://example.com/page2",
            "What's your opinion on this topic?",
            "Visit http://www.test.com/path?param=value for more info",
            "Just a simple question without any links"
        ];
        
        testCases.forEach((testCase, index) => {
            console.log(`\n📝 Test Case ${index + 1}: "${testCase}"`);
            const result = this.extractFirstDeepLink(testCase);
            console.log(`🔗 Extracted URL: ${result.url || 'None'}`);
            console.log(`🧹 Cleaned Text: "${result.cleanedText}"`);
        });
        
        console.log('\n✅ URL extraction test completed');
    }
    
    // Force refresh of DOM watcher
    refreshDOMWatcher() {
        if (this.isRunning && this.mutationObserver) {
            console.log('🔄 Refreshing DOM watcher...');
            
            // Disconnect current observer
            this.mutationObserver.disconnect();
            
            // Reconnect to the same element
            const questionsList = document.getElementById('ul_qs_panelQs');
            if (questionsList) {
                this.mutationObserver.observe(questionsList, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    characterData: true,
                    attributeOldValue: true,
                    characterDataOldValue: true,
                    attributeFilter: ['class', 'id', 'style']
                });
                console.log('✅ DOM watcher refreshed successfully');
                this.updateActivityIndicator('DOM Watcher Refreshed', 'Observer reconnected');
            } else {
                console.error('❌ Questions list not found during refresh');
            }
        }
    }
    
    // Reconnect observer to target element
    reconnectObserver() {
        if (this.isRunning && this.mutationObserver) {
            console.log('🔄 Reconnecting observer...');
            
            // Disconnect current observer
            this.mutationObserver.disconnect();
            
            // Find the target element again
            const questionsList = document.getElementById('ul_qs_panelQs');
            if (questionsList) {
                this.mutationObserver.observe(questionsList, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    characterData: true,
                    attributeOldValue: true,
                    characterDataOldValue: true,
                    attributeFilter: ['class', 'id', 'style']
                });
                console.log('✅ Observer reconnected successfully');
                this.updateActivityIndicator('Observer Reconnected', 'Reconnected to target element');
            } else {
                console.error('❌ Questions list not found during reconnect');
            }
        }
    }
    
    // Start periodic health check
    startHealthCheck() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        
        this.healthCheckInterval = setInterval(() => {
            if (this.isRunning) {
                this.performHealthCheck();
            }
        }, 5000); // Check every 5 seconds
    }
    
    // Start periodic question check (for Firebase updates)
    startQuestionCheck() {
        if (this.questionCheckInterval) {
            clearInterval(this.questionCheckInterval);
        }
        
        this.questionCheckInterval = setInterval(() => {
            if (this.isRunning) {
                this.performQuestionCheck();
            }
        }, 2000); // Check every 2 seconds for new questions
    }
    
    // Perform health check on the observer
    performHealthCheck() {
        try {
            const questionsList = document.getElementById('ul_qs_panelQs');
            if (!questionsList) {
                console.log('⚠️ Health check: Questions list not found');
                return;
            }
            
            // Check if observer is still connected
            if (this.mutationObserver && this.mutationObserver.disconnected) {
                console.log('⚠️ Health check: Observer disconnected, reconnecting...');
                this.reconnectObserver();
                return;
            }
            
            // Check if we're still observing the right element
            const currentCount = questionsList.querySelectorAll('li').length;
            console.log('💚 Health check: Observer healthy, current question count:', currentCount);
            
        } catch (error) {
            console.error('❌ Health check error:', error);
        }
    }

// Perform question check for new Firebase data
performQuestionCheck() {
    try {
        const questionsList = document.getElementById('ul_qs_panelQs');
        if (!questionsList) {
            return;
        }
        
        const currentQuestions = questionsList.querySelectorAll('li');
        const currentCount = currentQuestions.length;
        
        // Only log if there are questions or if count changed
        if (currentCount > 0 || (this.lastCommentData && currentCount !== this.lastCommentData.length)) {
            console.log('🔍 Question check: Found', currentCount, 'questions');
            
            // Only extract data if there's actually a question being answered
            const answeringQuestions = questionsList.querySelectorAll('li.hostAnswer');
            
            if (currentCount > 0 && answeringQuestions.length > 0 && (!this.lastCommentData || currentCount !== this.lastCommentData.length)) {
                console.log('🔄 Question count changed AND there\'s an active question, extracting data...');
                this.extractAndUpdateData();
            } else if (currentCount > 0 && (!this.lastCommentData || currentCount !== this.lastCommentData.length)) {
                console.log('🔄 Question count changed but NO active question, skipping data extraction');
            }
        }
        
    } catch (error) {
        console.error('❌ Question check error:', error);
    }
}
    
    // Simple debug method to check current state
    debugCurrentState() {
        console.log('🔍 Current DOM Watcher State:', {
            isRunning: this.isRunning,
            hasObserver: !!this.mutationObserver,
            observerConnected: this.mutationObserver ? !this.mutationObserver.disconnected : false,
            lastCommentData: this.lastCommentData ? this.lastCommentData.length : 0,
            updateCount: this.updateCount,
            lastUpdateTime: this.lastUpdateTime ? new Date(this.lastUpdateTime).toLocaleTimeString() : 'Never'
        });
        
        // Check current DOM state
        const questionsList = document.getElementById('ul_qs_panelQs');
        if (questionsList) {
            const questionElements = questionsList.querySelectorAll('li');
            const answeringQuestions = questionsList.querySelectorAll('li.hostAnswer');
            
            console.log('📝 Current DOM Questions:', {
                totalElements: questionElements.length,
                answeringElements: answeringQuestions.length,
                elements: Array.from(questionElements).map((el, i) => ({
                    index: i,
                    id: el.id,
                    classes: el.className,
                    isAnswering: el.classList.contains('hostAnswer'),
                    hasUser: !!el.querySelector('.msg_user .uName'),
                    hasText: !!el.querySelector('.msg_text .msg_body'),
                    userText: el.querySelector('.msg_user .uName')?.textContent?.trim() || 'N/A',
                    questionText: el.querySelector('.msg_text .msg_body')?.textContent?.trim()?.substring(0, 50) || 'N/A'
                }))
            });
        } else {
            console.log('❌ Questions list element not found in DOM');
        }
        
        // Test if observer is working by manually triggering a check
        if (this.isRunning) {
            console.log('🧪 Testing observer by manually extracting data...');
            this.extractAndUpdateData();
        }
        
        // Show hostAnswer status clearly
        console.log('🎯 === HOSTANSWER STATUS ===');
        const allQuestions = document.querySelectorAll('#ul_qs_panelQs > li');
        allQuestions.forEach((question, index) => {
            const hasHostAnswer = question.classList.contains('hostAnswer');
            const username = question.querySelector('.msg_user .uName')?.textContent.trim() || 'No username';
            const status = hasHostAnswer ? '✅ ACTIVE' : '⏸️ INACTIVE';
            console.log(`  ${index + 1}. ${status} - ID: ${question.id}, Username: "${username}"`);
        });
        console.log('🎯 === END HOSTANSWER STATUS ===');
        
        // Add detailed comparison test
        console.log('🔍 === DETAILED DATA COMPARISON TEST ===');
        if (this.lastCommentData && this.lastCommentData.length > 0) {
            const lastData = this.lastCommentData[0];
            console.log('📊 Last stored data details:');
            console.log('  - ID:', lastData.id);
            console.log('  - Username:', lastData.username);
            console.log('  - Comment:', lastData.comment?.substring(0, 50));
            console.log('  - Location:', lastData.location);
            console.log('  - URL:', lastData.extractedUrl);
            console.log('  - Timestamp:', lastData.timestamp);
            console.log('  - Order:', lastData.order);
        }
        
        // Test the hasDataChanged function with current data
        const currentQuestions = document.querySelectorAll('#ul_qs_panelQs > li.hostAnswer');
        if (currentQuestions.length > 0) {
            const currentQuestion = currentQuestions[0];
            const testData = [{
                id: currentQuestion.id || 'question-current',
                username: currentQuestion.querySelector('.msg_user .uName')?.textContent.trim() || 'Unknown User',
                location: currentQuestion.querySelector('.msg_user .uLoc')?.textContent.trim() || '',
                comment: currentQuestion.querySelector('.msg_text')?.textContent.trim() || 'No text',
                extractedUrl: '',
                timestamp: Date.now(),
                order: 1
            }];
            
            console.log('🧪 Testing hasDataChanged with current data:', testData);
            const wouldChange = this.hasDataChanged(testData);
            console.log('🧪 Would this data trigger an update?', wouldChange);
        }
        console.log('🔍 === END COMPARISON TEST ===');
    }
    
    // Test the observer by simulating a DOM change
    testObserver() {
        if (!this.isRunning) {
            console.log('⚠️ Cannot test observer - DOM watcher not running');
            return;
        }
        
        console.log('🧪 Testing observer functionality...');
        
        // Check if observer is connected
        if (this.mutationObserver && this.mutationObserver.disconnected) {
            console.log('❌ Observer is disconnected, reconnecting...');
            this.reconnectObserver();
            return;
        }
        
        // Test if observer is actually watching the right element
        const questionsList = document.getElementById('ul_qs_panelQs');
        if (questionsList) {
            console.log('🔍 Testing observer by manually adding a test class...');
            
            // Manually add a test class to trigger the observer
            questionsList.classList.add('test-observer-class');
            console.log('✅ Added test class, observer should trigger...');
            
            // Remove the test class
            setTimeout(() => {
                questionsList.classList.remove('test-observer-class');
                console.log('✅ Removed test class');
            }, 1000);
        }
        
        // Manually trigger data extraction
        console.log('🔍 Manually triggering data extraction...');
        this.extractAndUpdateData();
        
        // Check if we can detect changes
        if (questionsList) {
            const currentCount = questionsList.querySelectorAll('li').length;
            console.log('📊 Current question count:', currentCount);
            console.log('📊 Last known count:', this.lastCommentData ? this.lastCommentData.length : 'None');
            
            if (this.lastCommentData && currentCount !== this.lastCommentData.length) {
                console.log('✅ Observer should detect this change!');
            } else {
                console.log('⚠️ No change detected - observer may not be working');
            }
        }
    }
    
    // Force update mimoLive (for testing purposes)
    forceUpdate() {
        if (!this.isRunning) {
            console.log('⚠️ Cannot force update - DOM watcher not running');
            return;
        }
        
        console.log('🔄 Force updating mimoLive...');
        this.updateActivityIndicator('Force Update', 'Manually triggered update');
        
        // Clear last data to force an update
        this.lastCommentData = null;
        console.log('📊 Cleared lastCommentData to force update');
        
        // Verify data was cleared
        if (this.lastCommentData === null) {
            console.log('✅ lastCommentData successfully cleared');
        } else {
            console.error('❌ Failed to clear lastCommentData!');
        }
        
        // Extract and update data
        this.extractAndUpdateData();
    }
    
    // Clear stored data for testing
    clearStoredData() {
        console.log('🗑️ Clearing stored data...');
        this.lastCommentData = null;
        this.updateCount = 0;
        this.lastUpdateTime = null;
        console.log('📊 All stored data cleared');
        this.updateActivityIndicator('Data Cleared', 'Stored data has been cleared');
    }
    
    // Force reset and refresh (useful when data gets corrupted)
    forceResetAndRefresh() {
        console.log('🔄 Force reset and refresh initiated...');
        
        // Clear all stored data
        this.clearStoredData();
        
        // Force a fresh data extraction
        setTimeout(() => {
            console.log('🔄 Forcing fresh data extraction...');
            this.extractAndUpdateData().catch(error => {
                console.error('❌ Error in forced data extraction:', error);
            });
        }, 500);
        
        this.updateActivityIndicator('Force Reset', 'Refreshing data...');
    }
    
    // Show current mimoLive state vs stored data
    showMimoLiveState() {
        console.log('🎯 === MIMOLIVE STATE ANALYSIS ===');
        console.log('📊 Currently stored in extension:', this.lastCommentData);
        console.log('📊 Update count:', this.updateCount);
        console.log('📊 Last update time:', this.lastUpdateTime ? new Date(this.lastUpdateTime).toLocaleTimeString() : 'Never');
        
        // Check current DOM state
        const currentQuestions = document.querySelectorAll('#ul_qs_panelQs > li.hostAnswer');
        if (currentQuestions.length > 0) {
            const currentQuestion = currentQuestions[0];
            console.log('🎯 Current question in DOM:', {
                id: currentQuestion.id,
                username: currentQuestion.querySelector('.msg_user .uName')?.textContent.trim(),
                location: currentQuestion.querySelector('.msg_user .uLoc')?.textContent.trim(),
                hasUrl: !!currentQuestion.querySelector('.msg_text')?.textContent.includes('http')
            });
        }
        
        // Check if there are multiple questions and their states
        const allQuestions = document.querySelectorAll('#ul_qs_panelQs > li');
        console.log('📋 All questions in list:', allQuestions.length);
        allQuestions.forEach((question, index) => {
            const hasHostAnswer = question.classList.contains('hostAnswer');
            const username = question.querySelector('.msg_user .uName')?.textContent.trim() || 'No username';
            console.log(`  ${index + 1}. ID: ${question.id}, hostAnswer: ${hasHostAnswer}, Username: "${username}"`);
        });
        
        console.log('🎯 === END MIMOLIVE STATE ===');
    }
    
    // Compare current DOM question vs what's stored in extension
    compareCurrentVsMimoLive() {
        console.log('🔍 === CURRENT vs MIMOLIVE COMPARISON ===');
        
        // What's currently in the DOM
        const currentQuestions = document.querySelectorAll('#ul_qs_panelQs > li.hostAnswer');
        if (currentQuestions.length > 0) {
            const currentQuestion = currentQuestions[0];
            const currentData = {
                id: currentQuestion.id,
                username: currentQuestion.querySelector('.msg_user .uName')?.textContent.trim() || 'Unknown',
                location: currentQuestion.querySelector('.msg_user .uLoc')?.textContent.trim() || 'Unknown',
                text: currentQuestion.querySelector('.msg_text')?.textContent.trim()?.substring(0, 100) || 'No text'
            };
            console.log('🎯 Current question in DOM:', currentData);
        } else {
            console.log('❌ No active question in DOM');
        }
        
        // What's stored in the extension
        if (this.lastCommentData && this.lastCommentData.length > 0) {
            const storedData = this.lastCommentData[0];
            console.log('📊 Stored in extension:', {
                id: storedData.id,
                username: storedData.username,
                location: storedData.location,
                text: storedData.comment?.substring(0, 100) || 'No text'
            });
        } else {
            console.log('📊 Nothing stored in extension');
        }
        
        // What should be in mimoLive (based on stored data)
        if (this.lastCommentData && this.lastCommentData.length > 0) {
            const mimoLiveData = this.lastCommentData[0];
            console.log('🎬 MimoLive should show:', {
                id: mimoLiveData.id,
                username: mimoLiveData.username,
                location: mimoLiveData.location,
                text: mimoLiveData.comment?.substring(0, 100) || 'No text'
            });
        } else {
            console.log('🎬 MimoLive should show: Nothing (no data stored)');
        }
        
        console.log('🔍 === END COMPARISON ===');
    }
    
    // Clear mimoLive data when no questions are active
    async clearMimoLiveData() {
        try {
            console.log('🧹 Clearing mimoLive data...');
            
            // Clear username
            const clearTitleData = {
                "input-values": {
                    "tvGroup_Content__Text_TypeMultiline": ""
                }
            };
            const titleParam = encodeURIComponent(JSON.stringify(clearTitleData));
            const titleEndpoint = `http://127.0.0.1:${this.config.port}/api/v1/documents/${this.config.documentId}/layers/${this.config.titleLayer}?include=data.attributes.input-values&fields%5Binput-values%5D=tvGroup_Content__Text_TypeMultiline&update=${titleParam}`;
            
            await fetch(titleEndpoint, { method: 'GET' });
            console.log('✅ Title cleared in mimoLive');
            
            // Clear question text
            const clearTextData = {
                "input-values": {
                    "tvGroup_Content__Text_TypeMultiline": ""
                }
            };
            const textParam = encodeURIComponent(JSON.stringify(clearTextData));
            const textEndpoint = `http://127.0.0.1:${this.config.port}/api/v1/documents/${this.config.documentId}/layers/${this.config.textLayer}?include=data.attributes.input-values&fields%5Binput-values%5D=tvGroup_Content__Text_TypeMultiline&update=${textParam}`;
            
            await fetch(textEndpoint, { method: 'GET' });
            console.log('✅ Question text cleared in mimoLive');
            
            // Clear question tag
            const clearTagData = {
                "input-values": {
                    "tvGroup_Content__Text_TypeMultiline": ""
                }
            };
            const tagParam = encodeURIComponent(JSON.stringify(clearTagData));
            const tagEndpoint = `http://127.0.0.1:${this.config.port}/api/v1/documents/${this.config.documentId}/layers/${this.config.questionTagLayer}?include=data.attributes.input-values&fields%5Binput-values%5D=tvGroup_Content__Text_TypeMultiline&update=${tagParam}`;
            
            await fetch(tagEndpoint, { method: 'GET' });
            console.log('✅ Question tag cleared in mimoLive');
            
            // Clear location
            const clearLocationData = {
                "input-values": {
                    "tvGroup_Content__Text_TypeMultiline": ""
                }
            };
            const locationParam = encodeURIComponent(JSON.stringify(clearLocationData));
            const locationEndpoint = `http://127.0.0.1:${this.config.port}/api/v1/documents/${this.config.documentId}/layers/${this.config.locationLayer}?include=data.attributes.input-values&fields%5Binput-values%5D=tvGroup_Content__Text_TypeMultiline&update=${locationParam}`;
            
            await fetch(locationEndpoint, { method: 'GET' });
            console.log('✅ Location cleared in mimoLive');
            
            // Clear QR code
            const clearQRData = {
                "input-values": {
                    "tvGroup_Content__QR_Content": ""
                }
            };
            const qrParam = encodeURIComponent(JSON.stringify(clearQRData));
            const qrEndpoint = `http://127.0.0.1:${this.config.port}/api/v1/documents/${this.config.documentId}/sources/${this.config.sourceId}?include=data.attributes.input-values&fields%5Binput-values%5D=tvGroup_Content__QR_Content&update=${qrParam}`;
            
            await fetch(qrEndpoint, { method: 'GET' });
            console.log('✅ QR code cleared in mimoLive');
            
            // Clear stored data
            this.lastCommentData = null;
            console.log('🧹 MimoLive data cleared successfully');
            this.updateActivityIndicator('Data Cleared', 'No active questions');
            
        } catch (error) {
            console.error('❌ Error clearing mimoLive data:', error);
        }
    }
    
    // Force check for new questions (useful when Firebase adds them)
    forceQuestionCheck() {
        if (!this.isRunning) {
            console.log('⚠️ Cannot check questions - DOM watcher not running');
            return;
        }
        
        console.log('🔍 Forcing question check...');
        
        const questionsList = document.getElementById('ul_qs_panelQs');
        if (questionsList) {
            const currentQuestions = questionsList.querySelectorAll('li');
            const currentCount = currentQuestions.length;
            
            console.log('📊 Current question count:', currentCount);
            console.log('📊 Last known count:', this.lastCommentData ? this.lastCommentData.length : 'None');
            
            // Check for questions being answered
            const answeringQuestions = questionsList.querySelectorAll('li.hostAnswer');
            console.log('🎯 Questions with hostAnswer class:', answeringQuestions.length);
            
            if (answeringQuestions.length > 0) {
                console.log('✅ Found question being answered, extracting data...');
                this.extractAndUpdateData();
            } else if (currentCount > 0) {
                console.log('📝 Found questions but none are being answered yet');
            } else {
                console.log('⏭️ No questions found yet');
            }
        }
    }
    
    // Toggle configuration section visibility
    toggleConfigSection() {
        const configContent = document.getElementById('config-content');
        const toggleIcon = document.getElementById('config-toggle-icon');
        
        if (configContent && toggleIcon) {
            if (configContent.style.display === 'none') {
                configContent.style.display = 'block';
                toggleIcon.textContent = '▼';
                toggleIcon.style.transform = 'rotate(0deg)';
            } else {
                configContent.style.display = 'none';
                toggleIcon.textContent = '▶';
                toggleIcon.style.transform = 'rotate(-90deg)';
            }
        }
    }
    
    // Test API endpoints directly
    async testAPIEndpoints() {
        console.log('🧪 Testing API endpoints directly...');
        
        try {
            // Test title endpoint
            const testData = {
                "input-values": {
                    "tvGroup_Content__Title": "TEST_USER"
                }
            };
            const updateParam = encodeURIComponent(JSON.stringify(testData));
            const titleEndpoint = `http://127.0.0.1:49262/api/v1/documents/572187142/layers/D692CF88-5C77-47F3-A513-5129BDB76FC7?include=data.attributes.input-values&fields%5Binput-values%5D=tvGroup_Content__Title&update=${updateParam}`;
            
            console.log('🌐 Testing title endpoint:', titleEndpoint);
            
            const response = await fetch(titleEndpoint, {
                method: 'GET',
                headers: {
                    'User-Agent': 'MukanaScraper/1.0'
                }
            });
            
            if (response.ok) {
                console.log('✅ Title endpoint test successful');
                const responseText = await response.text();
                console.log('📄 Response:', responseText);
            } else {
                console.error('❌ Title endpoint test failed:', response.status);
                const responseText = await response.text();
                console.error('📄 Response:', responseText);
            }
            
        } catch (error) {
            console.error('❌ API test error:', error);
        }
    }

    // Test adding hostAnswer class manually
    testAddingHostAnswerClass() {
        if (!this.isRunning) {
            console.log('⚠️ Cannot test - DOM watcher not running');
            return;
        }
        
        console.log('🧪 Testing adding hostAnswer class manually...');
        
        const questionsList = document.getElementById('ul_qs_panelQs');
        if (questionsList) {
            const questionElements = questionsList.querySelectorAll('li');
            if (questionElements.length > 0) {
                const firstQuestion = questionElements[0];
                console.log('📝 Adding hostAnswer class to first question:', firstQuestion);
                firstQuestion.classList.add('hostAnswer');
                console.log('✅ Added hostAnswer class, observer should trigger...');
                
                // Remove it after 3 seconds
                setTimeout(() => {
                    firstQuestion.classList.remove('hostAnswer');
                    console.log('✅ Removed hostAnswer class');
                }, 3000);
            } else {
                console.log('⏭️ No questions found to test with');
            }
        }
    }

    // Save configuration to Chrome storage
    async saveConfiguration() {
        try {
            const documentId = document.getElementById('mukana-document-id').value.trim();
            const port = document.getElementById('mukana-port').value.trim();
            const titleLayer = document.getElementById('mukana-title-layer').value.trim();
            const questionTagLayer = document.getElementById('mukana-question-tag-layer').value.trim();
            const textLayer = document.getElementById('mukana-text-layer').value.trim();
            const locationLayer = document.getElementById('mukana-location-layer').value.trim();
            const sourceId = document.getElementById('mukana-source-id').value.trim();
            
            if (!documentId) {
                alert('Please enter a valid Document ID');
                return;
            }
            
            if (!port) {
                alert('Please enter a valid Port');
                return;
            }
            
            if (!titleLayer) {
                alert('Please enter a valid Title Layer ID');
                return;
            }
            
            if (!questionTagLayer) {
                alert('Please enter a valid Question Tag Layer ID');
                return;
            }
            
            if (!textLayer) {
                alert('Please enter a valid Text Layer ID');
                return;
            }
            
            if (!locationLayer) {
                alert('Please enter a valid Location Layer ID');
                return;
            }
            
            if (!sourceId) {
                alert('Please enter a valid Source ID');
                return;
            }
            
            // Update local config
            this.config = {
                documentId: documentId,
                port: port,
                titleLayer: titleLayer,
                questionTagLayer: questionTagLayer,
                textLayer: textLayer,
                locationLayer: locationLayer,
                sourceId: sourceId
            };
            
            // Save to Chrome storage
            await chrome.storage.local.set({
                mukanaScraperConfig: this.config
            });
            
            console.log('✅ Configuration saved:', this.config);
            this.updateActivityIndicator('✅ Config Saved', `Document ID: ${documentId}, Port: ${port}`);
            
            // Refresh the configuration display
            this.refreshConfigurationDisplay();
            
            // Show success message
            const saveBtn = document.getElementById('mukana-save-config');
            if (saveBtn) {
                const originalText = saveBtn.textContent;
                saveBtn.textContent = 'Saved!';
                saveBtn.style.background = '#28a745';
                setTimeout(() => {
                    saveBtn.textContent = originalText;
                    saveBtn.style.background = '#28a745';
                }, 2000);
            }
            
        } catch (error) {
            console.error('❌ Failed to save configuration:', error);
            this.updateActivityIndicator('❌ Config Save Failed', error.message);
            alert('Failed to save configuration: ' + error.message);
        }
    }
    
    // Reset configuration to defaults
    async resetConfiguration() {
        try {
            const defaultConfig = {
                documentId: '572187142',
                port: '49262',
                titleLayer: 'D692CF88-5C77-47F3-A513-5129BDB76FC7',
                questionTagLayer: 'D692CF88-5C77-47F3-A513-5129BDB76FC8',
                textLayer: '11F0706A-4E1E-4DBA-A620-2D3EF44A9F2D',
                locationLayer: '73F19730-1C97-4660-8091-37428DDEC4A6',
                sourceId: '572187142-1CDC27E3-762F-4054-86F7-3403FA9518E0'
            };
            
            // Update local config
            this.config = defaultConfig;
            
            // Save to Chrome storage
            await chrome.storage.local.set({
                mukanaScraperConfig: this.config
            });
            
            // Update UI
            const documentIdInput = document.getElementById('mukana-document-id');
            const portInput = document.getElementById('mukana-port');
            const titleLayerInput = document.getElementById('mukana-title-layer');
            const questionTagLayerInput = document.getElementById('mukana-question-tag-layer');
            const textLayerInput = document.getElementById('mukana-text-layer');
            const locationLayerInput = document.getElementById('mukana-location-layer');
            const sourceIdInput = document.getElementById('mukana-source-id');
            
            if (documentIdInput) documentIdInput.value = defaultConfig.documentId;
            if (portInput) portInput.value = defaultConfig.port;
            if (titleLayerInput) titleLayerInput.value = defaultConfig.titleLayer;
            if (questionTagLayerInput) questionTagLayerInput.value = defaultConfig.questionTagLayer;
            if (textLayerInput) textLayerInput.value = defaultConfig.textLayer;
            if (locationLayerInput) locationLayerInput.value = defaultConfig.locationLayer;
            if (sourceIdInput) sourceIdInput.value = defaultConfig.sourceId;
            
            console.log('✅ Configuration reset to defaults:', this.config);
            this.updateActivityIndicator('✅ Config Reset', 'Reset to default values');
            
        } catch (error) {
            console.error('❌ Failed to reset configuration:', error);
            this.updateActivityIndicator('❌ Config Reset Failed', error.message);
            alert('Failed to reset configuration: ' + error.message);
        }
    }
}

// Initialize the injector when the page is ready
function initializeInjector() {
            console.log('🔧 Attempting to initialize Mukana to mimoLive Sync Injector...');
    try {
        const injector = new MukanaScraperInjector();
        // Make injector globally accessible
        window.mukanaScraperInjector = injector;
        console.log('✅ Injector made globally accessible');
        return injector;
    } catch (error) {
        console.error('❌ Failed to create injector:', error);
        // Try again after a delay
        setTimeout(initializeInjector, 2000);
    }
}

// Smart initialization that waits for the page to be ready
function smartInitialize() {
    console.log('🧠 Smart initialization check...');
    
    // Check if this is a teleprompter page that needs Event ID
    const loginWrap = document.getElementById('login_wrap');
    const appContent = document.getElementById('app_content');
    
    if (loginWrap && !loginWrap.classList.contains('hidden')) {
        console.log('⏳ Waiting for Event ID to be entered...');
        // Wait for the login form to be submitted
        const eventIdInput = document.getElementById('eventId');
        if (eventIdInput) {
            eventIdInput.addEventListener('change', () => {
                console.log('📝 Event ID changed, waiting for app initialization...');
                setTimeout(initializeInjector, 2000);
            });
        }
        // Also check periodically
        setTimeout(smartInitialize, 2000);
        return;
    }
    
    if (appContent && appContent.classList.contains('hidden')) {
        console.log('⏳ App content still hidden, waiting...');
        setTimeout(smartInitialize, 1000);
        return;
    }
    
    console.log('✅ Page appears ready, initializing injector...');
    initializeInjector();
}

// Make functions globally accessible for popup to call
window.initializeInjector = initializeInjector;
window.smartInitialize = smartInitialize;

// Make URL extraction test globally accessible for debugging
window.testURLExtraction = function() {
    if (window.mukanaScraperInjector) {
        window.mukanaScraperInjector.testURLExtraction();
    } else {
        console.log('❌ Mukana to mimoLive Sync Injector not initialized yet');
    }
};



// Function to create control panel directly (for popup to call)
window.createMukanaControlPanel = function() {
    console.log('🎯 Creating control panel directly from popup...');
    try {
        // Try to create the real control panel
        if (window.mukanaScraperInjector) {
            console.log('🔄 Using existing injector...');
            return window.mukanaScraperInjector.createControlPanel();
        } else {
            console.log('🔄 No injector found, creating new one...');
            try {
                const injector = new MukanaScraperInjector();
                return injector.createControlPanel();
            } catch (injectorError) {
                console.error('❌ Failed to create injector:', injectorError);
                return false;
            }
        }
    } catch (error) {
        console.error('❌ Failed to create control panel directly:', error);
        return false;
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', smartInitialize);
} else {
    // If page is already loaded, wait a bit for dynamic content
    setTimeout(smartInitialize, 1000);
}

// Also try to initialize after a longer delay as a fallback
setTimeout(smartInitialize, 5000);

// Listen for manual initialization trigger from popup
window.addEventListener('mukana-scraper-init', () => {
    console.log('🎯 Received manual initialization trigger from popup');
    if (window.mukanaScraperInjector) {
        console.log('🔄 Re-initializing existing injector...');
        window.mukanaScraperInjector.init();
    } else {
        console.log('🔄 Creating new injector from popup trigger...');
        smartInitialize();
    }
});

// Create a simple fallback control panel after 10 seconds if nothing else works
setTimeout(() => {
    if (!document.getElementById('mukana-scraper-panel')) {
        console.log('🔄 Creating fallback control panel...');
        const fallbackPanel = document.createElement('div');
        fallbackPanel.id = 'mukana-scraper-fallback';
        fallbackPanel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 300px;
            background: #ff6b6b;
            color: white;
            padding: 15px;
            border-radius: 8px;
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;
        fallbackPanel.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 10px;">⚠️ Mukana to mimoLive Sync (Fallback)</div>
            <div style="font-size: 12px; margin-bottom: 10px;">
                Main control panel failed to load. This is a fallback.
            </div>
            <button onclick="location.reload()" style="background: white; color: #ff6b6b; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">
                Reload Page
            </button>
        `;
        document.body.appendChild(fallbackPanel);
        console.log('✅ Fallback control panel created');
    }
}, 10000);
