import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

function Popup() {
  const [status, setStatus] = useState<'inactive' | 'active'>('inactive')
  const [lastCommand, setLastCommand] = useState<string>('None')

  const toggleVoice = () => {
    console.log('Toggle voice called, current status:', status)
    const newStatus = status === 'inactive' ? 'active' : 'inactive'
    setStatus(newStatus)
    console.log('New status will be:', newStatus)

    // Send message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0]
      console.log('Active tab:', activeTab)

      if (activeTab?.id) {
        const action = status === 'inactive' ? 'startListening' : 'stopListening'
        console.log('Sending message to content script:', action)

        chrome.tabs.sendMessage(activeTab.id, { action }, (response) => {
          console.log('Received response from content script:', response)
          
          if (chrome.runtime.lastError) {
            console.error('Chrome runtime error:', chrome.runtime.lastError)
            setLastCommand(`Error: ${chrome.runtime.lastError.message}`)
            return
          }

          if (response?.status === 'started') {
            console.log('Voice navigation started')
            setLastCommand('Listening started...')
          } else if (response?.status === 'stopped') {
            console.log('Voice navigation stopped')
            setLastCommand('Listening stopped.')
          } else {
            console.warn('Unexpected response:', response)
            setLastCommand('Unexpected response from content script')
          }
        })
      } else {
        console.error('No active tab found')
        setLastCommand('Error: No active tab found')
      }
    })
  }

  return (
    <div className="w-[300px] h-[250px] p-4 bg-white overflow-hidden">
      <h2 className="text-xl font-bold mb-4 text-center">Voice Navigation Assistant</h2>
      
      <div className={`flex items-center gap-2 mb-4 ${
        status === 'active' ? 'text-green-600' : 'text-gray-500'
      }`}>
        <div className={`w-3 h-3 rounded-full ${
          status === 'active' ? 'bg-green-600 animate-pulse' : 'bg-gray-500'
        }`} />
        <span>{status === 'active' ? 'Listening...' : 'Inactive'}</span>
      </div>

      <button
        onClick={toggleVoice}
        className={`w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-white transition-colors ${
          status === 'active'
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        <span role="img" aria-label="microphone">🎙️</span>
        {status === 'active' ? 'Stop Voice Navigation' : 'Start Voice Navigation'}
      </button>

      <div className="mt-4 p-2 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          Last command: <span className="font-medium">{lastCommand}</span>
        </p>
      </div>

      <div className="mt-4 text-center">
        <small className="text-gray-500">Powered by OpenAI Realtime API</small>
      </div>
    </div>
  )
}

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('root')
  if (root) {
    createRoot(root).render(
      <React.StrictMode>
        <Popup />
      </React.StrictMode>
    )
  }
}) 