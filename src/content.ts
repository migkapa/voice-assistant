let isListening = false
let peerConnection: RTCPeerConnection | null = null
let dataChannel: RTCDataChannel | null = null

// Initialize WebRTC connection
async function initialize() {
  try {
    const result = await chrome.storage.sync.get(['openai_api_key'])
    if (!result.openai_api_key) {
      throw new Error('OpenAI API key not found')
    }

    // Create a peer connection
    peerConnection = new RTCPeerConnection()

    // Set up audio elements
    const audioEl = document.createElement('audio')
    audioEl.autoplay = true
    peerConnection.ontrack = (e) => {
      audioEl.srcObject = e.streams[0]
    }

    // Add local audio track for microphone input
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true
    })
    peerConnection.addTrack(mediaStream.getTracks()[0])

    // Set up data channel for sending and receiving events
    dataChannel = peerConnection.createDataChannel('oai-events')
    dataChannel.addEventListener('message', (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'transcription') {
        handleVoiceCommand(data.text)
      }
    })

    // Start the session using SDP
    const offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)

    const baseUrl = 'https://api.openai.com/v1/realtime'
    const model = 'gpt-4o-realtime-preview-2024-12-17'
    const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
      method: 'POST',
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${result.openai_api_key}`,
        'Content-Type': 'application/sdp'
      },
    })

    const sdpAnswer = await sdpResponse.text()
    await peerConnection.setRemoteDescription(new RTCSessionDescription({
      type: 'answer',
      sdp: sdpAnswer
    }))

    // Send initial configuration
    if (dataChannel) {
      const responseCreate = {
        type: 'response.create',
        response: {
          modalities: ['text'],
          instructions: 'Listen for voice commands and transcribe them',
        },
      }
      dataChannel.send(JSON.stringify(responseCreate))
    }

  } catch (error) {
    console.error('Initialization error:', error)
    isListening = false
  }
}

// Handle voice commands
function handleVoiceCommand(command: string) {
  console.log('Received command:', command)
  // Add command handling logic here
}

// Clean up WebRTC connection
function cleanup() {
  if (dataChannel) {
    dataChannel.close()
    dataChannel = null
  }
  if (peerConnection) {
    peerConnection.close()
    peerConnection = null
  }
  isListening = false
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'startListening' && !isListening) {
    isListening = true
    initialize()
    sendResponse({ status: 'started' })
  } else if (message.action === 'stopListening' && isListening) {
    cleanup()
    sendResponse({ status: 'stopped' })
  }
  return true
}) 