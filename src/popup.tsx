import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

function Popup() {
  const [status, setStatus] = useState<'inactive' | 'active'>('inactive')
  const [lastCommand, setLastCommand] = useState<string>('None')

  const toggleVoice = () => {
    const newStatus = status === 'inactive' ? 'active' : 'inactive'
    setStatus(newStatus)

    // Send message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0]
      if (activeTab?.id) {
        const action = newStatus === 'active' ? 'startListening' : 'stopListening'
        chrome.tabs.sendMessage(activeTab.id, { action }, (response) => {
          if (chrome.runtime.lastError) {
            setLastCommand(`Error: ${chrome.runtime.lastError.message}`)
            return
          }

          if (response?.status === 'started') {
            setLastCommand('Listening started...')
          } else if (response?.status === 'stopped') {
            setLastCommand('Listening stopped.')
          } else {
            setLastCommand('Unexpected response from content script')
          }
        })
      } else {
        setLastCommand('Error: No active tab found')
      }
    })
  }

  return (
    <div className="w-[300px] h-[250px] p-4 bg-white text-gray-800 shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-center text-gray-900">Voice Navigation</h2>
      
      <div className={`flex items-center gap-2 mb-4 ${
        status === 'active' ? 'text-green-600' : 'text-gray-500'
      }`}>
        <div className={`w-3 h-3 rounded-full ${
          status === 'active' ? 'bg-green-600 animate-pulse' : 'bg-gray-500'
        }`} />
        <span className="font-medium">{status === 'active' ? 'Listening...' : 'Inactive'}</span>
      </div>

      <button
        onClick={toggleVoice}
        className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-white font-medium transition-colors ${
          status === 'active'
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        <span role="img" aria-label="microphone">🎙️</span>
        {status === 'active' ? 'Stop Voice Navigation' : 'Start Voice Navigation'}
      </button>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg shadow-sm">
        <p className="text-sm text-gray-600">
          Last command: <span className="font-medium">{lastCommand}</span>
        </p>
      </div>

      <div className="mt-4 text-center">
        <small className="text-gray-500">Powered by OpenAI</small>
      </div>
    </div>
  )
}

// Wait for DOM to be ready
const init = () => {
  const root = document.getElementById('root')
  if (root) {
    console.log('Initializing popup...')
    createRoot(root).render(
      <React.StrictMode>
        <Popup />
      </React.StrictMode>
    )
  } else {
    console.error('Root element not found')
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
} 