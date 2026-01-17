/**
 * InviCRM WhatsApp Extension - Background Service Worker
 * Handles extension lifecycle and API communication
 */

// Default configuration
const DEFAULT_CONFIG = {
  apiUrl: 'http://localhost:3000',
  isEnabled: false,
  authToken: null,
};

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[InviCRM] Extension installed:', details.reason);

  if (details.reason === 'install') {
    // Set default configuration
    await chrome.storage.local.set(DEFAULT_CONFIG);
  }
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[InviCRM] Background received message:', message.type);

  switch (message.type) {
    case 'SYNC_STATUS':
      // Forward sync status to popup if open
      chrome.runtime.sendMessage(message).catch(() => {
        // Popup not open, ignore
      });
      break;

    case 'VALIDATE_TOKEN':
      validateToken(message.apiUrl, message.token)
        .then((result) => sendResponse(result))
        .catch((error) =>
          sendResponse({ valid: false, error: error.message })
        );
      return true; // Keep channel open for async response

    case 'GET_CONFIG':
      chrome.storage.local.get(['apiUrl', 'authToken', 'isEnabled']).then(
        (config) => sendResponse(config)
      );
      return true;

    case 'SAVE_CONFIG':
      chrome.storage.local
        .set({
          apiUrl: message.apiUrl,
          authToken: message.authToken,
          isEnabled: message.isEnabled,
        })
        .then(() => {
          // Notify content scripts of config change
          notifyContentScripts({
            type: 'CONFIG_UPDATED',
            apiUrl: message.apiUrl,
            authToken: message.authToken,
          });
          sendResponse({ success: true });
        });
      return true;
  }
});

/**
 * Validate authentication token with API
 */
async function validateToken(apiUrl, token) {
  try {
    const response = await fetch(`${apiUrl}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const user = await response.json();
      return { valid: true, user };
    }

    return { valid: false, error: 'Invalid token' };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Send message to all WhatsApp tabs
 */
async function notifyContentScripts(message) {
  const tabs = await chrome.tabs.query({ url: 'https://web.whatsapp.com/*' });
  for (const tab of tabs) {
    chrome.tabs.sendMessage(tab.id, message).catch(() => {
      // Tab might not have content script loaded
    });
  }
}

// Keep service worker alive with periodic alarm
chrome.alarms.create('keepAlive', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepAlive') {
    console.log('[InviCRM] Service worker keepalive');
  }
});
