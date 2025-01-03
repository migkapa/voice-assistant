// Keep track of active tabs
let activeTabId = null;
let isVoiceActive = false;

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Voice Navigation Assistant installed');
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'status' || message.type === 'command') {
    // Forward status updates to popup if it's open
    chrome.runtime.sendMessage(message);
  } else if (message.type === 'startVoice') {
    checkAndInjectContentScript();
  } else if (message.type === 'stopVoice') {
    removeContentScript();
  }
});

// Check if URL is injectable
function isInjectablePage(url) {
  return url && !url.startsWith('chrome://') && 
         !url.startsWith('chrome-extension://') && 
         !url.startsWith('chrome-search://');
}

// Get user-friendly message for non-injectable pages
function getNonInjectableMessage(url) {
  if (url.startsWith('chrome://')) {
    return 'Voice navigation is not available on Chrome settings pages. Please try on a regular website.';
  } else if (url.startsWith('chrome-extension://')) {
    return 'Voice navigation is not available on extension pages. Please try on a regular website.';
  } else {
    return 'Voice navigation is not available on this page. Please try on a regular website.';
  }
}

// Check current tab and inject content script if possible
async function checkAndInjectContentScript() {
  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      notifyUser('No active tab found');
      return;
    }

    if (!isInjectablePage(tab.url)) {
      const message = getNonInjectableMessage(tab.url);
      notifyUser(message);
      return;
    }

    await injectContentScript(tab);
  } catch (error) {
    console.error('Failed to check and inject content script:', error);
    notifyUser('Failed to initialize voice navigation');
  }
}

// Inject content script into tab
async function injectContentScript(tab) {
  try {
    activeTabId = tab.id;
    isVoiceActive = true;

    // Inject content script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });

    // Send message to initialize voice navigation
    chrome.tabs.sendMessage(tab.id, { action: 'startVoice' });
  } catch (error) {
    console.error('Failed to inject content script:', error);
    notifyUser('Failed to initialize voice navigation');
    activeTabId = null;
    isVoiceActive = false;
  }
}

// Helper function to notify user
function notifyUser(message) {
  chrome.runtime.sendMessage({
    type: 'status',
    status: 'inactive',
    details: message
  });
}

// Remove content script from active tab
async function removeContentScript() {
  if (!activeTabId) return;

  try {
    // Only send message if the tab is injectable
    const tab = await chrome.tabs.get(activeTabId);
    if (tab && isInjectablePage(tab.url)) {
      await chrome.tabs.sendMessage(activeTabId, { action: 'stopVoice' });
    }
    
    // Reset state
    activeTabId = null;
    isVoiceActive = false;
  } catch (error) {
    console.error('Failed to remove content script:', error);
  }
}

// Clean up when tab is closed or changed
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === activeTabId) {
    activeTabId = null;
    isVoiceActive = false;
  }
});

// Handle tab activation changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (isVoiceActive && activeTabId !== activeInfo.tabId) {
    try {
      // Stop voice in old tab
      await removeContentScript();
      
      // Check if new tab is injectable
      const tab = await chrome.tabs.get(activeInfo.tabId);
      if (isInjectablePage(tab.url)) {
        await injectContentScript(tab);
      } else {
        const message = getNonInjectableMessage(tab.url);
        notifyUser(message);
      }
    } catch (error) {
      console.error('Error handling tab change:', error);
      notifyUser('Failed to transfer voice navigation to new tab');
    }
  }
}); 