import { sessionUpdate, handleFunctionCall, createResponse } from './tools'

let isListening = false
let peerConnection: RTCPeerConnection | null = null
let dataChannel: RTCDataChannel | null = null
let toolsRegistered = false

// Handle Realtime API events
function handleRealtimeEvent(event: any) {
  // Handle session creation - register tools
  if (event.type === 'session.created' && !toolsRegistered && dataChannel) {
    dataChannel.send(JSON.stringify(sessionUpdate))
    toolsRegistered = true
    return
  }

  // Handle completed function calls
  if (event.type === 'response.function_call_arguments.done') {
    try {
      const result = handleFunctionCall({
        name: event.name,
        arguments: event.arguments
      })
      
      // Send confirmation back to the model
      if (dataChannel && dataChannel.readyState === 'open') {
        dataChannel.send(JSON.stringify(createResponse(
          `Command executed: ${result}. What else would you like me to do?`
        )))
      }
    } catch (error: any) {
      console.error('Function execution error:', error.message || 'Unknown error')
      if (dataChannel && dataChannel.readyState === 'open') {
        dataChannel.send(JSON.stringify(createResponse(
          `Sorry, there was an error executing the command: ${error.message || 'Unknown error'}`
        )))
      }
    }
    return
  }

  // Handle response output (for backward compatibility)
  if (event.type === 'response.output' && event.output) {
    event.output.forEach((output: any) => {
      if (output.type === 'function_call') {
        try {
          const result = handleFunctionCall(output)
          
          // Send confirmation back to the model
          if (dataChannel && dataChannel.readyState === 'open') {
            dataChannel.send(JSON.stringify(createResponse(
              `Command executed: ${result}. What else would you like me to do?`
            )))
          }
        } catch (error: any) {
          console.error('Function execution error:', error.message || 'Unknown error')
          if (dataChannel && dataChannel.readyState === 'open') {
            dataChannel.send(JSON.stringify(createResponse(
              `Sorry, there was an error executing the command: ${error.message || 'Unknown error'}`
            )))
          }
        }
      }
    })
  }
}

// Initialize WebRTC connection
async function initialize() {
  try {
    const result = await chrome.storage.sync.get(['openai_api_key'])
    if (!result.openai_api_key) {
      throw new Error('OpenAI API key not found')
    }

    // Create a peer connection with STUN servers
    const pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:stun.l.google.com:19302'
        }
      ]
    })
    peerConnection = pc

    // Set up audio elements
    const audioEl = document.createElement('audio')
    audioEl.autoplay = true
    pc.ontrack = (e) => {
      audioEl.srcObject = e.streams[0]
    }

    // Add local audio track for microphone input
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    })
    mediaStream.getTracks().forEach(track => {
      pc.addTrack(track, mediaStream)
    })

    // Set up data channel for sending and receiving events
    dataChannel = pc.createDataChannel('oai-events', {
      ordered: true
    })

    // Handle data channel events
    dataChannel.onopen = () => {
      if (dataChannel) {
        // Set up initial instructions
        dataChannel.send(JSON.stringify(createResponse(`
          I am a voice navigation assistant. I can help you navigate web pages using voice commands.
          Available commands:
          - Scroll to top/bottom
          - Scroll up/down
          - Click on elements by their text
          I will execute your commands and provide feedback.
        `)))
      }
    }

    dataChannel.onmessage = (event) => {
      const data = JSON.parse(event.data)
      handleRealtimeEvent(data)
    }

    dataChannel.onerror = (error) => {
      console.error('Data channel error:', error)
    }

    // Start the session using SDP
    const offer = await pc.createOffer({
      offerToReceiveAudio: true
    })
    await pc.setLocalDescription(offer)

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

    if (!sdpResponse.ok) {
      throw new Error(`OpenAI API error: ${sdpResponse.status} ${sdpResponse.statusText}`)
    }

    const sdpAnswer = await sdpResponse.text()
    await pc.setRemoteDescription(new RTCSessionDescription({
      type: 'answer',
      sdp: sdpAnswer
    }))

  } catch (error) {
    console.error('Initialization error:', error)
    isListening = false
    cleanup() // Clean up on error
  }
}

// Clean up WebRTC connection
function cleanup() {
  toolsRegistered = false
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