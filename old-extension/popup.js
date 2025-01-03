document.addEventListener('DOMContentLoaded', function() {
  const toggleButton = document.getElementById('toggleVoice');
  const statusIndicator = document.getElementById('status');
  const statusText = statusIndicator.querySelector('.status-text');
  const commandText = document.getElementById('commandText');
  let isActive = false;

  // Check if API key is set
  chrome.storage.sync.get('openaiApiKey', function(data) {
    if (!data.openaiApiKey) {
      updateStatus('error', 'Please set your OpenAI API key in the extension options');
      toggleButton.disabled = true;
      return;
    }
  });

  // Check current state when popup opens
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'getState' }, function(response) {
        if (chrome.runtime.lastError) {
          // Handle case where content script is not injected yet
          updateStatus('inactive', 'Click to start voice navigation');
          updateButtonState(false);
          return;
        }
        if (response && response.isListening) {
          isActive = true;
          updateStatus('active', 'Connected and listening...');
          updateButtonState(true);
        } else {
          updateStatus('inactive', 'Click to start voice navigation');
          updateButtonState(false);
        }
      });
    }
  });

  // Listen for status updates from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'status') {
      updateStatus(message.status, message.details);
      // Update button state based on status
      isActive = message.status === 'active';
      updateButtonState(isActive);
      
      // If there's an error, disable the button temporarily
      if (message.status === 'error') {
        toggleButton.disabled = true;
        setTimeout(() => {
          toggleButton.disabled = false;
          updateStatus('inactive', 'Click to start voice navigation');
        }, 3000);
      }
    } else if (message.type === 'command') {
      updateLastCommand(message.command);
    }
  });

  toggleButton.addEventListener('click', function() {
    if (toggleButton.disabled) return;
    
    isActive = !isActive;
    
    // Send message to background script
    chrome.runtime.sendMessage({
      type: isActive ? 'startVoice' : 'stopVoice'
    });

    // Update UI immediately to show we're trying to connect
    if (isActive) {
      updateStatus('pending', 'Connecting...');
      
      // Set a timeout to check status again after 5 seconds
      setTimeout(() => {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'getState' }, function(response) {
              if (chrome.runtime.lastError) {
                updateStatus('error', 'Failed to connect. Please try again.');
                isActive = false;
                updateButtonState(false);
                return;
              }
              if (response && response.isListening) {
                updateStatus('active', 'Connected and listening...');
                updateButtonState(true);
              } else {
                updateStatus('error', 'Connection failed. Please try again.');
                isActive = false;
                updateButtonState(false);
              }
            });
          }
        });
      }, 5000);
    } else {
      updateStatus('inactive', 'Stopped');
    }
    updateButtonState(isActive);
  });

  function updateStatus(status, details) {
    // Remove all status classes
    statusIndicator.classList.remove('active', 'inactive', 'pending', 'error');
    // Add the new status class
    statusIndicator.classList.add(status);
    
    // Update the status dot color in CSS
    if (status === 'pending') {
      statusIndicator.style.backgroundColor = '#ffd700'; // Yellow for pending
    } else if (status === 'error') {
      statusIndicator.style.backgroundColor = '#dc3545'; // Red for error
    }
    
    statusText.textContent = details || getDefaultStatusText(status);
  }

  function getDefaultStatusText(status) {
    switch (status) {
      case 'active':
        return 'Connected and listening...';
      case 'inactive':
        return 'Click to start voice navigation';
      case 'pending':
        return 'Connecting...';
      case 'error':
        return 'An error occurred';
      default:
        return 'Ready';
    }
  }

  function updateLastCommand(command) {
    commandText.textContent = command || 'None';
  }

  function updateButtonState(active) {
    toggleButton.textContent = active ? '🎤 Stop Voice Navigation' : '🎤 Start Voice Navigation';
    toggleButton.className = `primary-button ${active ? 'active' : ''}`;
  }
}); 