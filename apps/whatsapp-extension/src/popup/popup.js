/**
 * InviCRM WhatsApp Extension - Popup Script
 */

document.addEventListener('DOMContentLoaded', init);

async function init() {
  // Load saved configuration
  const config = await chrome.runtime.sendMessage({ type: 'GET_CONFIG' });

  // Populate form
  document.getElementById('apiUrl').value = config.apiUrl || '';
  document.getElementById('authToken').value = config.authToken || '';
  document.getElementById('enableToggle').checked = config.isEnabled || false;

  // Update status display
  updateStatus(config);

  // Get status from content script
  refreshStatus();

  // Set up event listeners
  document.getElementById('saveBtn').addEventListener('click', saveConfig);
  document.getElementById('syncBtn').addEventListener('click', forceSync);
  document.getElementById('enableToggle').addEventListener('change', toggleEnabled);
}

async function saveConfig() {
  const apiUrl = document.getElementById('apiUrl').value.trim();
  const authToken = document.getElementById('authToken').value.trim();
  const isEnabled = document.getElementById('enableToggle').checked;

  if (!apiUrl) {
    showMessage('Please enter an API URL', 'error');
    return;
  }

  if (!authToken) {
    showMessage('Please enter an auth token', 'error');
    return;
  }

  // Validate token with API
  showMessage('Validating...', 'success');
  const result = await chrome.runtime.sendMessage({
    type: 'VALIDATE_TOKEN',
    apiUrl,
    token: authToken,
  });

  if (!result.valid) {
    showMessage(`Invalid token: ${result.error}`, 'error');
    return;
  }

  // Save configuration
  await chrome.runtime.sendMessage({
    type: 'SAVE_CONFIG',
    apiUrl,
    authToken,
    isEnabled,
  });

  showMessage(`Connected as ${result.user.email}`, 'success');
  updateStatus({ isEnabled, isConnected: true });
}

async function toggleEnabled(event) {
  const isEnabled = event.target.checked;
  const config = await chrome.runtime.sendMessage({ type: 'GET_CONFIG' });

  await chrome.runtime.sendMessage({
    type: 'SAVE_CONFIG',
    apiUrl: config.apiUrl,
    authToken: config.authToken,
    isEnabled,
  });

  updateStatus({ ...config, isEnabled });
}

async function forceSync() {
  try {
    const tabs = await chrome.tabs.query({ url: 'https://web.whatsapp.com/*' });
    if (tabs.length === 0) {
      showMessage('Please open WhatsApp Web first', 'error');
      return;
    }

    showMessage('Syncing...', 'success');
    await chrome.tabs.sendMessage(tabs[0].id, { type: 'FORCE_SYNC' });
    showMessage('Sync complete', 'success');
    refreshStatus();
  } catch (error) {
    showMessage('Sync failed: ' + error.message, 'error');
  }
}

async function refreshStatus() {
  try {
    const tabs = await chrome.tabs.query({ url: 'https://web.whatsapp.com/*' });
    if (tabs.length === 0) {
      document.getElementById('currentChat').textContent = 'WhatsApp not open';
      return;
    }

    const status = await chrome.tabs.sendMessage(tabs[0].id, {
      type: 'GET_STATUS',
    });

    document.getElementById('messageCount').textContent =
      status.messageCount || 0;
    document.getElementById('lastSync').textContent = status.lastSync
      ? formatTime(status.lastSync)
      : 'Never';
    document.getElementById('currentChat').textContent =
      status.currentChat || 'None';
  } catch (error) {
    // Content script not ready
    document.getElementById('currentChat').textContent = 'Initializing...';
  }
}

function updateStatus(config) {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');

  if (!config.isEnabled) {
    statusDot.className = 'status-dot';
    statusText.textContent = 'Disabled';
  } else if (config.apiUrl && config.authToken) {
    statusDot.className = 'status-dot connected';
    statusText.textContent = 'Connected';
  } else {
    statusDot.className = 'status-dot error';
    statusText.textContent = 'Not configured';
  }
}

function showMessage(text, type) {
  const messageEl = document.getElementById('message');
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
  messageEl.classList.remove('hidden');

  if (type === 'success') {
    setTimeout(() => {
      messageEl.classList.add('hidden');
    }, 3000);
  }
}

function formatTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

  return date.toLocaleDateString();
}

// Listen for sync status updates from content script
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'SYNC_STATUS') {
    document.getElementById('lastSync').textContent = formatTime(
      message.lastSync
    );
    if (message.status === 'success') {
      showMessage(`Synced ${message.count} messages`, 'success');
    }
  }
});
