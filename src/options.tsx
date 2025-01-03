import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

function Options() {
  const [apiKey, setApiKey] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    // Load saved API key when component mounts
    chrome.storage.sync.get(['openai_api_key'], (result) => {
      if (result.openai_api_key) {
        setApiKey(result.openai_api_key)
      }
    })
  }, [])

  const saveApiKey = () => {
    chrome.storage.sync.set(
      {
        openai_api_key: apiKey,
      },
      () => {
        setStatus('API key saved successfully!')
        setTimeout(() => setStatus(''), 3000)
      }
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h2 className="text-2xl font-bold mb-8 text-center text-gray-900">
                  Voice Navigation Settings
                </h2>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="apiKey">
                    OpenAI API Key
                  </label>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="apiKey"
                    type="password"
                    placeholder="Enter your OpenAI API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    onClick={saveApiKey}
                  >
                    Save API Key
                  </button>
                  {status && (
                    <span className="text-green-600 text-sm ml-2">{status}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Make sure the DOM is fully loaded before rendering
const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <Options />
    </React.StrictMode>
  )
} 