let isListening = false
let socket: WebSocket | null = null

// Initialize WebSocket connection
async function initialize() {
  try {
    const result = await chrome.storage.sync.get(['openai_api_key'])
    if (!result.openai_api_key) {
      throw new Error('OpenAI API key not found')
    }

    socket = new WebSocket('ws://localhost:5173')
    
    socket.onopen = () => {
      console.log('Connected to WebSocket server')
      socket.send(JSON.stringify({ type: 'initialize', token: result.openai_api_key }))
    }

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'transcription') {
        handleVoiceCommand(data.text)
      }
    }

    socket.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    socket.onclose = () => {
      console.log('Disconnected from WebSocket server')
      isListening = false
    }
  } catch (error) {
    console.error('Initialization error:', error)
  }
}

// Handle voice commands
function handleVoiceCommand(command: string) {
  console.log('Received command:', command)
  // Add command handling logic here
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startListening' && !isListening) {
    isListening = true
    initialize()
    sendResponse({ status: 'started' })
  } else if (message.action === 'stopListening' && isListening) {
    isListening = false
    socket?.close()
    sendResponse({ status: 'stopped' })
  }
  return true
}) 