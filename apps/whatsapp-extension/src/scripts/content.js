/**
 * InviCRM WhatsApp Content Script
 * Captures messages from web.whatsapp.com and sends to InviCRM API
 */

(function () {
  'use strict';

  // Configuration
  const CONFIG = {
    SYNC_INTERVAL: 30000, // 30 seconds
    BATCH_SIZE: 50,
    SELECTORS: {
      CHAT_LIST: '[aria-label="Chat list"], #pane-side',
      ACTIVE_CHAT: '[data-testid="conversation-panel-wrapper"], [class*="conversation"]',
      MESSAGE_IN: '.message-in',
      MESSAGE_OUT: '.message-out',
      CONTACT_NAME: '[data-testid="conversation-info-header-chat-title"], header span[title]',
      PHONE_NUMBER: '[data-testid="chat-subtitle"], header span[title] + span',
      MESSAGE_TEXT: '.copyable-text [class*="_ao3e"], .copyable-text span.selectable-text, .copyable-text',
      MESSAGE_TIME: '[data-pre-plain-text]',
    },
  };

  // State
  let state = {
    isConnected: false,
    apiUrl: null,
    authToken: null,
    lastSyncTime: null,
    capturedMessages: new Map(),
    currentChatId: null,
  };

  /**
   * Initialize the content script
   */
  async function init() {
    console.log('[InviCRM] WhatsApp connector initializing...');

    // Load configuration from storage
    const config = await chrome.storage.local.get([
      'apiUrl',
      'authToken',
      'isEnabled',
    ]);

    if (!config.isEnabled) {
      console.log('[InviCRM] Extension is disabled');
      return;
    }

    if (!config.apiUrl || !config.authToken) {
      console.log('[InviCRM] Not configured. Please set up in extension popup.');
      return;
    }

    state.apiUrl = config.apiUrl;
    state.authToken = config.authToken;
    state.isConnected = true;

    // Wait for WhatsApp to fully load
    await waitForElement(CONFIG.SELECTORS.CHAT_LIST);
    console.log('[InviCRM] WhatsApp loaded, starting message capture');

    // Start observers
    observeChatChanges();
    observeNewMessages();

    // Initial scan of visible messages
    scanVisibleMessages();

    // Periodic sync
    setInterval(syncMessages, CONFIG.SYNC_INTERVAL);
  }

  /**
   * Wait for an element to appear in the DOM
   */
  function waitForElement(selector, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver((mutations, obs) => {
        const el = document.querySelector(selector);
        if (el) {
          obs.disconnect();
          resolve(el);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * Observe when user switches to a different chat
   */
  function observeChatChanges() {
    const chatListArea = document.querySelector('#pane-side');
    if (!chatListArea) return;

    const observer = new MutationObserver(() => {
      const activeChat = document.querySelector(CONFIG.SELECTORS.ACTIVE_CHAT);
      if (activeChat) {
        const chatInfo = extractChatInfo();
        if (chatInfo && chatInfo.id !== state.currentChatId) {
          state.currentChatId = chatInfo.id;
          console.log('[InviCRM] Chat switched to:', chatInfo.name);
          scanVisibleMessages();
        }
      }
    });

    observer.observe(chatListArea, {
      childList: true,
      subtree: true,
      attributes: true,
    });
  }

  /**
   * Observe new messages in the current chat
   */
  function observeNewMessages() {
    const messagesContainer = document.querySelector(
      '[data-testid="conversation-panel-messages"]'
    );
    if (!messagesContainer) return;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const messages = node.querySelectorAll
              ? [
                  ...node.querySelectorAll(CONFIG.SELECTORS.MESSAGE_IN),
                  ...node.querySelectorAll(CONFIG.SELECTORS.MESSAGE_OUT),
                ]
              : [];
            if (
              node.matches?.(CONFIG.SELECTORS.MESSAGE_IN) ||
              node.matches?.(CONFIG.SELECTORS.MESSAGE_OUT)
            ) {
              messages.push(node);
            }
            messages.forEach(processMessage);
          }
        }
      }
    });

    observer.observe(messagesContainer, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Extract current chat information
   */
  function extractChatInfo() {
    // Try multiple selectors for the contact name
    let nameEl = document.querySelector('[data-testid="conversation-info-header-chat-title"]');
    if (!nameEl) {
      // Fallback: header with title attribute
      nameEl = document.querySelector('header span[title]');
    }
    if (!nameEl) {
      // Fallback: any span with dir="auto" in the header area
      nameEl = document.querySelector('#main header span[dir="auto"]');
    }

    if (!nameEl) {
      console.log('[InviCRM] Could not find contact name element');
      return null;
    }

    const name = nameEl.getAttribute('title') || nameEl.textContent?.trim() || 'Unknown';

    // Try to find phone number
    let phone = null;
    const phoneEl = document.querySelector('[data-testid="chat-subtitle"]');
    if (phoneEl) {
      phone = extractPhoneNumber(phoneEl.textContent);
    }
    if (!phone) {
      // Try extracting from name if it looks like a phone number
      phone = extractPhoneNumber(name);
    }

    console.log('[InviCRM] Extracted chat info:', { name, phone });

    return {
      id: phone || name,
      name,
      phone,
    };
  }

  /**
   * Extract phone number from text
   */
  function extractPhoneNumber(text) {
    if (!text) return null;

    // Remove common prefixes and formatting
    const cleaned = text.replace(/[\s\-\(\)]/g, '');

    // Match phone number patterns
    const phoneMatch = cleaned.match(/\+?[0-9]{8,15}/);
    return phoneMatch ? phoneMatch[0] : null;
  }

  /**
   * Scan all visible messages in current chat
   */
  function scanVisibleMessages() {
    const messages = document.querySelectorAll(
      `${CONFIG.SELECTORS.MESSAGE_IN}, ${CONFIG.SELECTORS.MESSAGE_OUT}`
    );
    messages.forEach(processMessage);
  }

  /**
   * Process a single message element
   */
  function processMessage(messageEl) {
    try {
      const isIncoming = messageEl.classList.contains('message-in');

      // Find text content - try multiple selectors
      let textEl = messageEl.querySelector('.copyable-text');
      let messageText = '';

      if (textEl) {
        // Get text from data attribute or inner text
        const preText = textEl.getAttribute('data-pre-plain-text');
        if (preText) {
          // Extract just the message, not the metadata
          messageText = textEl.textContent?.trim() || '';
        } else {
          messageText = textEl.textContent?.trim() || '';
        }
      }

      if (!messageText) return; // Skip non-text messages

      const messageId = generateMessageId(messageEl);
      if (state.capturedMessages.has(messageId)) return;

      const chatInfo = extractChatInfo();
      if (!chatInfo) return;

      // Extract timestamp from data-pre-plain-text like "[12:17 PM, 12/18/2025] Name:"
      let timestamp = new Date().toISOString();
      const copyableText = messageEl.querySelector('[data-pre-plain-text]');
      if (copyableText) {
        const preText = copyableText.getAttribute('data-pre-plain-text');
        timestamp = parsePrePlainText(preText) || timestamp;
      }

      const message = {
        id: messageId,
        chatId: chatInfo.id,
        chatName: chatInfo.name,
        phone: chatInfo.phone,
        text: messageText,
        timestamp: timestamp,
        direction: isIncoming ? 'incoming' : 'outgoing',
        capturedAt: new Date().toISOString(),
      };

      state.capturedMessages.set(messageId, message);
      console.log('[InviCRM] Captured message:', message.text.substring(0, 50));
    } catch (error) {
      console.error('[InviCRM] Error processing message:', error);
    }
  }

  /**
   * Generate a unique ID for a message
   */
  function generateMessageId(messageEl) {
    const dataId = messageEl.getAttribute('data-id');
    if (dataId) return dataId;

    // Fallback: hash of content + position
    const text = messageEl.textContent || '';
    const index = Array.from(messageEl.parentNode?.children || []).indexOf(
      messageEl
    );
    return `msg_${hashCode(text)}_${index}`;
  }

  /**
   * Simple hash function for strings
   */
  function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Parse data-pre-plain-text attribute like "[12:17 PM, 12/18/2025] Name:"
   */
  function parsePrePlainText(preText) {
    if (!preText) return null;

    // Match pattern: [time, date] or [time]
    const match = preText.match(/\[(\d{1,2}:\d{2}\s*(?:AM|PM)?),?\s*(\d{1,2}\/\d{1,2}\/\d{4})?\]/i);
    if (!match) return null;

    const timeStr = match[1];
    const dateStr = match[2];

    const now = new Date();

    // Parse time
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const meridiem = timeMatch[3];

      if (meridiem) {
        if (meridiem.toUpperCase() === 'PM' && hours !== 12) hours += 12;
        if (meridiem.toUpperCase() === 'AM' && hours === 12) hours = 0;
      }

      now.setHours(hours, minutes, 0, 0);
    }

    // Parse date if present (MM/DD/YYYY format)
    if (dateStr) {
      const dateParts = dateStr.split('/');
      if (dateParts.length === 3) {
        now.setMonth(parseInt(dateParts[0]) - 1);
        now.setDate(parseInt(dateParts[1]));
        now.setFullYear(parseInt(dateParts[2]));
      }
    }

    return now.toISOString();
  }

  /**
   * Parse WhatsApp timestamp to ISO string (legacy)
   */
  function parseTimestamp(timeText) {
    if (!timeText) return new Date().toISOString();

    // WhatsApp shows times like "10:30 AM" or "Yesterday" or "1/15/2026"
    const now = new Date();

    // Try parsing as time only (today)
    const timeMatch = timeText.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const meridiem = timeMatch[3];

      if (meridiem) {
        if (meridiem.toUpperCase() === 'PM' && hours !== 12) hours += 12;
        if (meridiem.toUpperCase() === 'AM' && hours === 12) hours = 0;
      }

      now.setHours(hours, minutes, 0, 0);
      return now.toISOString();
    }

    return now.toISOString();
  }

  /**
   * Sync captured messages to InviCRM API
   */
  async function syncMessages() {
    if (!state.isConnected || state.capturedMessages.size === 0) return;

    const messages = Array.from(state.capturedMessages.values()).filter(
      (m) => !m.synced
    );

    if (messages.length === 0) return;

    const batch = messages.slice(0, CONFIG.BATCH_SIZE);
    console.log(`[InviCRM] Syncing ${batch.length} messages...`);

    try {
      const response = await fetch(`${state.apiUrl}/api/v1/whatsapp/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${state.authToken}`,
        },
        body: JSON.stringify({ messages: batch }),
      });

      if (response.ok) {
        batch.forEach((m) => {
          const stored = state.capturedMessages.get(m.id);
          if (stored) stored.synced = true;
        });
        state.lastSyncTime = new Date().toISOString();
        console.log('[InviCRM] Sync successful');

        // Notify popup of sync status
        chrome.runtime.sendMessage({
          type: 'SYNC_STATUS',
          status: 'success',
          count: batch.length,
          lastSync: state.lastSyncTime,
        });
      } else {
        console.error('[InviCRM] Sync failed:', response.status);
      }
    } catch (error) {
      console.error('[InviCRM] Sync error:', error);
    }
  }

  /**
   * Listen for messages from popup/background
   */
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'GET_STATUS':
        sendResponse({
          isConnected: state.isConnected,
          messageCount: state.capturedMessages.size,
          lastSync: state.lastSyncTime,
          currentChat: state.currentChatId,
        });
        break;

      case 'CONFIG_UPDATED':
        state.apiUrl = message.apiUrl;
        state.authToken = message.authToken;
        state.isConnected = !!(message.apiUrl && message.authToken);
        break;

      case 'FORCE_SYNC':
        syncMessages().then(() => sendResponse({ success: true }));
        return true; // Keep channel open for async response
    }
  });

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
