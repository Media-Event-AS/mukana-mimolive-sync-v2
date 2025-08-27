// Mukana Panelist Content Scraper
// This script extracts panelist comments and forwards them to a destination URL
// Updated for latest Mukana page structure with Google authentication support

class MukanaScraper {
    constructor(destinationUrl, options = {}) {
        this.destinationUrl = destinationUrl;
        this.options = {
            interval: options.interval || 5000, // Check for updates every 5 seconds
            includeUserInfo: options.includeUserInfo !== false,
            includeNotes: options.includeNotes !== false,
            includeVotes: options.includeVotes !== false,
            maxComments: options.maxComments || 999,
            includeTimestamps: options.includeTimestamps !== false,
            includePhonetics: options.includePhonetics !== false,
            autoLogin: options.autoLogin !== false, // Enable automatic Google login
            loginTimeout: options.loginTimeout || 30000, // 30 seconds timeout for login
            ...options
        };
        
        this.lastUpdateTime = 0;
        this.commentCache = new Map();
        this.isRunning = false;
        this.intervalId = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.isAuthenticated = false;
        this.authCheckInterval = null;
        this.loginAttempts = 0;
        this.maxLoginAttempts = 3;
        
        console.log('MukanaScraper initialized with destination:', destinationUrl);
        console.log('Options:', this.options);
        
        // Initialize authentication if enabled
        if (this.options.autoLogin) {
            this.initializeAuthentication();
        }
    }
    
    // Initialize Google authentication
    async initializeAuthentication() {
        try {
            console.log('🔐 Initializing Google authentication...');
            
            // Check if Firebase is available
            if (typeof firebase === 'undefined') {
                console.error('❌ Firebase not found. Please ensure Firebase is loaded before initializing the scraper.');
                return false;
            }
            
            console.log('✅ Firebase detected, checking configuration...');
            
            // Check Firebase app configuration
            try {
                const app = firebase.app();
                console.log('✅ Firebase app initialized:', app.name);
                console.log('📋 Firebase config:', app.options);
            } catch (error) {
                console.error('❌ Firebase app not properly initialized:', error);
                return false;
            }
            
            // Check if Firebase Auth is available
            if (typeof firebase.auth === 'undefined') {
                console.error('❌ Firebase Auth not available. Check if firebase-auth.js is loaded.');
                return false;
            }
            
            console.log('✅ Firebase Auth available');
            
            // Check current auth state
            const currentUser = firebase.auth().currentUser;
            if (currentUser) {
                console.log('✅ Already authenticated as:', currentUser.displayName || currentUser.email);
                this.isAuthenticated = true;
                return true;
            }
            
            console.log('ℹ️ No current user, setting up auth state listener...');
            
            // Set up auth state listener
            firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    console.log('✅ Authentication successful:', user.displayName || user.email);
                    console.log('👤 User details:', {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        providerId: user.providerData[0]?.providerId
                    });
                    this.isAuthenticated = true;
                    this.onAuthenticationSuccess();
                } else {
                    console.log('ℹ️ User signed out or not authenticated');
                    this.isAuthenticated = false;
                    this.onAuthenticationFailure();
                }
            });
            
            // Try to sign in with Google
            console.log('🚀 Attempting Google sign-in...');
            return await this.signInWithGoogle();
            
        } catch (error) {
            console.error('❌ Authentication initialization failed:', error);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                stack: error.stack
            });
            return false;
        }
    }
    
    // Sign in with Google
    async signInWithGoogle() {
        try {
            console.log('🔐 Attempting Google sign-in...');
            
            // Check if Google provider is available
            if (typeof firebase.auth.GoogleAuthProvider === 'undefined') {
                console.error('❌ Google Auth Provider not available');
                return false;
            }
            
            const provider = new firebase.auth.GoogleAuthProvider();
            console.log('✅ Google Auth Provider created');
            
            // Add scopes if needed
            provider.addScope('email');
            provider.addScope('profile');
            console.log('✅ Scopes added: email, profile');
            
            // Set custom parameters
            provider.setCustomParameters({
                prompt: 'select_account'
            });
            console.log('✅ Custom parameters set');
            
            console.log('🚀 Initiating sign-in popup...');
            const result = await firebase.auth().signInWithPopup(provider);
            
            console.log('✅ Google sign-in successful');
            console.log('👤 Sign-in result:', {
                user: result.user?.displayName || result.user?.email,
                credential: result.credential?.providerId
            });
            
            return true;
            
        } catch (error) {
            console.error('❌ Google sign-in failed:', error);
            console.error('Error details:', {
                code: error.code,
                message: error.message,
                email: error.email,
                credential: error.credential
            });
            
            if (error.code === 'auth/popup-closed-by-user') {
                console.log('ℹ️ Sign-in popup was closed by user');
            } else if (error.code === 'auth/popup-blocked') {
                console.log('ℹ️ Sign-in popup was blocked. Trying redirect method...');
                return await this.signInWithGoogleRedirect();
            } else if (error.code === 'auth/unauthorized-domain') {
                console.error('❌ Domain not authorized in Firebase console');
                console.error('   Please add localhost to authorized domains in Firebase Console');
            } else if (error.code === 'auth/operation-not-allowed') {
                console.error('❌ Google sign-in not enabled in Firebase console');
                console.error('   Please enable Google sign-in in Firebase Console > Authentication > Sign-in method');
            } else if (error.code === 'auth/network-request-failed') {
                console.error('❌ Network request failed. Check your internet connection.');
            }
            
            return false;
        }
    }
    
    // Sign in with Google using redirect (fallback for blocked popups)
    async signInWithGoogleRedirect() {
        try {
            console.log('Attempting Google sign-in with redirect...');
            
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('email');
            provider.addScope('profile');
            
            await firebase.auth().signInWithRedirect(provider);
            return true;
            
        } catch (error) {
            console.error('Google redirect sign-in failed:', error);
            return false;
        }
    }
    
    // Handle successful authentication
    onAuthenticationSuccess() {
        console.log('Authentication successful, checking page readiness...');
        this.checkPageReadiness();
    }
    
    // Handle authentication failure
    onAuthenticationFailure() {
        console.log('Authentication failed or user signed out');
        this.isAuthenticated = false;
        
        if (this.isRunning) {
            console.log('Stopping scraper due to authentication failure');
            this.stop();
        }
    }
    
    // Check if the page is ready for scraping
    checkPageReadiness() {
        console.log('Checking page readiness...');
        
        // Check if we're on a Mukana page (panelist or teleprompter)
        if (!window.location.href.includes('mukana-panelist') && !window.location.href.includes('mukana-teleprompter')) {
            console.log('Not on Mukana page, waiting for navigation...');
            return false;
        }
        
        // Check if the comments list is available
        const commentsList = document.getElementById('ul_comments_hostOutput');
        if (!commentsList) {
            console.log('Comments list not found, page may still be loading...');
            return false;
        }
        
        // Check if Firebase auth is complete
        if (!this.isAuthenticated) {
            console.log('Not authenticated yet, waiting...');
            return false;
        }
        
        console.log('Page is ready for scraping');
        return true;
    }
    
    // Start the scraper
    start() {
        if (this.isRunning) {
            console.log('Scraper is already running');
            return;
        }
        
        // Check authentication first
        if (this.options.autoLogin && !this.isAuthenticated) {
            console.log('Waiting for authentication before starting scraper...');
            this.waitForAuthentication();
            return;
        }
        
        // Check page readiness
        if (!this.checkPageReadiness()) {
            console.log('Page not ready, waiting...');
            this.waitForPageReadiness();
            return;
        }
        
        this.isRunning = true;
        console.log('Starting Mukana scraper...');
        
        // Initial scrape
        this.scrapeComments();
        
        // Set up interval for continuous monitoring
        this.intervalId = setInterval(() => {
            this.scrapeComments();
        }, this.options.interval);
    }
    
    // Wait for authentication to complete
    waitForAuthentication() {
        if (this.authCheckInterval) {
            clearInterval(this.authCheckInterval);
        }
        
        this.authCheckInterval = setInterval(() => {
            if (this.isAuthenticated) {
                console.log('Authentication complete, checking page readiness...');
                clearInterval(this.authCheckInterval);
                this.authCheckInterval = null;
                this.start();
            }
        }, 1000);
        
        // Set timeout for authentication
        setTimeout(() => {
            if (this.authCheckInterval) {
                clearInterval(this.authCheckInterval);
                this.authCheckInterval = null;
                console.error('Authentication timeout reached');
            }
        }, this.options.loginTimeout);
    }
    
    // Wait for page to be ready
    waitForPageReadiness() {
        if (this.authCheckInterval) {
            clearInterval(this.authCheckInterval);
        }
        
        this.authCheckInterval = setInterval(() => {
            if (this.checkPageReadiness()) {
                console.log('Page is ready, starting scraper...');
                clearInterval(this.authCheckInterval);
                this.authCheckInterval = null;
                this.start();
            }
        }, 2000);
        
        // Set timeout for page readiness
        setTimeout(() => {
            if (this.authCheckInterval) {
                clearInterval(this.authCheckInterval);
                this.authCheckInterval = null;
                console.error('Page readiness timeout reached');
            }
        }, this.options.loginTimeout);
    }
    
    // Stop the scraper
    stop() {
        if (!this.isRunning) {
            return;
        }
        
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        if (this.authCheckInterval) {
            clearInterval(this.authCheckInterval);
            this.authCheckInterval = null;
        }
        
        console.log('Mukana scraper stopped');
    }
    
    // Extract comments from the page
    scrapeComments() {
        try {
            const commentsList = document.getElementById('ul_comments_hostOutput');
            if (!commentsList) {
                console.log('Comments list not found, page may not be loaded yet');
                this.retryCount++;
                if (this.retryCount > this.maxRetries) {
                    console.warn('Max retries reached, stopping scraper');
                    this.stop();
                }
                return;
            }
            
            // Reset retry count on successful find
            this.retryCount = 0;
            
            const commentItems = commentsList.querySelectorAll('li');
            console.log(`Found ${commentItems.length} comment items`);
            
            const comments = [];
            
            commentItems.forEach((item, index) => {
                if (index >= this.options.maxComments) return;
                
                const commentData = this.extractCommentData(item);
                if (commentData) {
                    comments.push(commentData);
                }
            });
            
            // Check if we have new or updated comments
            const hasChanges = this.detectChanges(comments);
            
            if (hasChanges) {
                console.log(`Changes detected, forwarding ${comments.length} comments`);
                this.forwardComments(comments);
                this.updateCache(comments);
            } else {
                console.log('No changes detected, skipping forward');
            }
            
        } catch (error) {
            console.error('Error scraping comments:', error);
        }
    }
    
    // Extract data from a single comment element
    extractCommentData(commentElement) {
        try {
            const commentId = commentElement.dataset.id || commentElement.id?.replace('cmntHostOutput-', '');
            if (!commentId) {
                console.warn('Comment element missing ID:', commentElement);
                return null;
            }
            
            const userInfo = commentElement.querySelector('.user_info');
            const messageText = commentElement.querySelector('.msg_text');
            const messageNotes = commentElement.querySelector('.msg_notes');
            const voteCount = commentElement.querySelector('.vote_count');
            const phonetics = commentElement.querySelector('.phoenetics');
            
            // Extract user information more robustly
            let username = '';
            let userLocation = '';
            let userPhonetics = '';
            let timestamp = '';
            
            if (userInfo) {
                const userSpan = userInfo.querySelector('.msg_user');
                username = userSpan?.textContent?.trim() || '';
                
                // Extract location from spans that contain parentheses
                const locationSpan = userInfo.querySelector('span:not(.msg_user):not(.msg_time):not(.vote_count):not(.phoenetics)');
                if (locationSpan) {
                    const locationText = locationSpan.textContent?.trim() || '';
                    userLocation = locationText.replace(/[()]/g, '').trim();
                }
                
                // Extract phonetics
                if (this.options.includePhonetics && phonetics) {
                    userPhonetics = phonetics.textContent?.trim() || '';
                }
                
                // Extract timestamp if available
                if (this.options.includeTimestamps) {
                    const timeSpan = userInfo.querySelector('.msg_time');
                    timestamp = timeSpan?.textContent?.trim() || '';
                }
            }
            
            const commentData = {
                id: commentId,
                orderId: parseInt(commentElement.dataset.orderid) || 0,
                timestamp: Date.now(),
                isAnswering: commentElement.classList.contains('answering'),
                
                // User information
                username: username,
                userLocation: userLocation,
                phonetics: userPhonetics,
                displayTimestamp: timestamp,
                
                // Comment content
                question: messageText?.textContent?.trim() || '',
                notes: this.options.includeNotes ? (messageNotes?.textContent?.trim() || '') : '',
                
                // Metadata
                voteCount: this.options.includeVotes ? (voteCount?.textContent?.trim() || '0') : '0',
                
                // Status
                status: commentElement.classList.contains('answering') ? 'answering' : 'active',
                
                // Additional metadata
                elementClasses: Array.from(commentElement.classList).join(' '),
                hasUserInfo: !!userInfo,
                hasMessageText: !!messageText,
                hasNotes: !!messageNotes,
                hasVoteCount: !!voteCount
            };
            
            return commentData;
            
        } catch (error) {
            console.error('Error extracting comment data:', error);
            return null;
        }
    }
    
    // Detect if there are changes in the comments
    detectChanges(newComments) {
        if (newComments.length !== this.commentCache.size) {
            console.log(`Comment count changed: ${this.commentCache.size} -> ${newComments.length}`);
            return true;
        }
        
        for (const comment of newComments) {
            const cached = this.commentCache.get(comment.id);
            if (!cached) {
                console.log(`New comment detected: ${comment.id}`);
                return true;
            }
            
            // Check for content changes
            if (cached.question !== comment.question ||
                cached.status !== comment.status ||
                cached.orderId !== comment.orderId ||
                cached.notes !== comment.notes ||
                cached.voteCount !== comment.voteCount) {
                console.log(`Comment ${comment.id} changed:`, {
                    question: cached.question !== comment.question,
                    status: cached.status !== comment.status,
                    orderId: cached.orderId !== comment.orderId,
                    notes: cached.notes !== comment.notes,
                    voteCount: cached.voteCount !== comment.voteCount
                });
                return true;
            }
        }
        
        return false;
    }
    
    // Update the internal cache
    updateCache(comments) {
        this.commentCache.clear();
        comments.forEach(comment => {
            this.commentCache.set(comment.id, comment);
        });
        console.log(`Cache updated with ${comments.length} comments`);
    }
    
    // Forward comments to destination URL
    async forwardComments(comments) {
        try {
            const payload = {
                type: 'panelist_update',
                timestamp: Date.now(),
                eventId: this.getEventId(),
                totalComments: comments.length,
                comments: comments,
                metadata: {
                    scraperVersion: '1.2.0',
                    source: 'mukana-panelist',
                    pageUrl: window.location.href,
                    userAgent: navigator.userAgent,
                    includeUserInfo: this.options.includeUserInfo,
                    includeNotes: this.options.includeNotes,
                    includeVotes: this.options.includeVotes,
                    includeTimestamps: this.options.includeTimestamps,
                    includePhonetics: this.options.includePhonetics,
                    authenticated: this.isAuthenticated,
                    authUser: this.getCurrentUserInfo()
                }
            };
            
            console.log('Forwarding', comments.length, 'comments to:', this.destinationUrl);
            console.log('Payload preview:', {
                type: payload.type,
                timestamp: payload.timestamp,
                eventId: payload.eventId,
                totalComments: payload.totalComments,
                sampleComment: payload.comments[0] || 'No comments'
            });
            
            const response = await fetch(this.destinationUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'MukanaScraper/1.2.0',
                    'X-Source': 'mukana-panelist',
                    'X-Timestamp': Date.now().toString(),
                    'X-Authenticated': this.isAuthenticated.toString()
                },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                console.log('Successfully forwarded comments to destination');
                this.lastUpdateTime = Date.now();
            } else {
                console.error('Failed to forward comments. Status:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('Error response:', errorText);
            }
            
        } catch (error) {
            console.error('Error forwarding comments:', error);
        }
    }
    
    // Get current user information
    getCurrentUserInfo() {
        try {
            const user = firebase.auth().currentUser;
            if (user) {
                return {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    providerId: user.providerData[0]?.providerId
                };
            }
        } catch (error) {
            console.error('Error getting user info:', error);
        }
        return null;
    }
    
    // Get the current event ID from the page
    getEventId() {
        const eventInput = document.getElementById('eventId');
        if (eventInput && eventInput.value) {
            return eventInput.value;
        }
        
        // Try to get from URL hash
        if (window.location.hash) {
            return window.location.hash.substring(1);
        }
        
        // Try to get from URL parameters
        try {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get('event') || 'unknown';
        } catch (e) {
            return 'unknown';
        }
    }
    
    // Get current scraper status
    getStatus() {
        return {
            isRunning: this.isRunning,
            lastUpdate: this.lastUpdateTime,
            cachedComments: this.commentCache.size,
            destinationUrl: this.destinationUrl,
            options: this.options,
            retryCount: this.retryCount,
            pageUrl: window.location.href,
            eventId: this.getEventId(),
            isAuthenticated: this.isAuthenticated,
            currentUser: this.getCurrentUserInfo()
        };
    }
    
    // Force a manual scrape
    forceScrape() {
        console.log('Manual scrape triggered');
        this.scrapeComments();
    }
    
    // Sign out current user
    async signOut() {
        try {
            if (firebase.auth().currentUser) {
                await firebase.auth().signOut();
                console.log('User signed out successfully');
            }
        } catch (error) {
            console.error('Error signing out:', error);
        }
    }
}

// Auto-start function when the page is ready
function autoStartScraper(destinationUrl, options = {}) {
    // Wait for the page to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initializeScraper(destinationUrl, options);
        });
    } else {
        initializeScraper(destinationUrl, options);
    }
}

// Initialize the scraper
function initializeScraper(destinationUrl, options = {}) {
    // Wait a bit more for the Firebase and other scripts to initialize
    setTimeout(() => {
        try {
            // Check if we're on the right page
            if (!document.getElementById('ul_comments_hostOutput')) {
                console.log('Waiting for Mukana page to load...');
                setTimeout(() => initializeScraper(destinationUrl, options), 2000);
                return;
            }
            
            // Create and start the scraper
            window.mukanaScraper = new MukanaScraper(destinationUrl, options);
            
            // If auto-login is disabled, start immediately
            if (!options.autoLogin) {
                window.mukanaScraper.start();
            }
            
            console.log('Mukana scraper initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize scraper:', error);
        }
    }, 3000);
}

// Utility function to manually start the scraper
function startMukanaScraper(destinationUrl, options = {}) {
    if (window.mukanaScraper) {
        window.mukanaScraper.stop();
    }
    
    window.mukanaScraper = new MukanaScraper(destinationUrl, options);
    window.mukanaScraper.start();
    return window.mukanaScraper;
}

// Utility function to stop the scraper
function stopMukanaScraper() {
    if (window.mukanaScraper) {
        window.mukanaScraper.stop();
        return true;
    }
    return false;
}

// Utility function to force a manual scrape
function forceMukanaScrape() {
    if (window.mukanaScraper) {
        window.mukanaScraper.forceScrape();
        return true;
    }
    return false;
}

// Utility function to sign out
function signOutMukanaUser() {
    if (window.mukanaScraper) {
        return window.mukanaScraper.signOut();
    }
    return false;
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        MukanaScraper, 
        autoStartScraper, 
        startMukanaScraper, 
        stopMukanaScraper,
        forceMukanaScrape,
        signOutMukanaUser
    };
}
