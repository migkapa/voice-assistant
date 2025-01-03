import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

function Popup() {
  const [status, setStatus] = useState<'inactive' | 'active'>('inactive')
  const [lastCommand, setLastCommand] = useState<string>('None')

  const toggleVoice = () => {
    setStatus(status === 'inactive' ? 'active' : 'inactive')
    // TODO: Implement actual voice toggle logic
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

// Make sure the DOM is fully loaded before rendering
const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <Popup />
    </React.StrictMode>
  )
} 