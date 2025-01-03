// Check if script is already injected
if (window.voiceNavigationAssistant) {
  console.log('Voice Navigation Assistant already initialized');
} else {
  class VoiceNavigationAssistant {
    constructor() {
      this.peerConnection = null;
      this.dataChannel = null;
      this.audioElement = null;
      this.isListening = false;
      this.setupMessageListener();
    }

    setupMessageListener() {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'startVoice') {
          this.start();
        } else if (message.action === 'stopVoice') {
          this.stop();
        } else if (message.action === 'getState') {
          // Return the current state
          sendResponse({ isListening: this.isListening });
          return true; // Keep the message channel open for the response
        }
      });
    }

    async start() {
      if (this.isListening) return;
      
      try {
        await this.initialize();
        this.isListening = true;
        this.updateStatus('active', 'Connected and listening...');
      } catch (error) {
        console.error('Failed to start voice navigation:', error);
        this.updateStatus('inactive', 'Failed to start: ' + error.message);
      }
    }

    stop() {
      if (!this.isListening) return;
      
      if (this.peerConnection) {
        this.peerConnection.close();
        this.peerConnection = null;
      }
      if (this.dataChannel) {
        this.dataChannel.close();
        this.dataChannel = null;
      }
      this.isListening = false;
      this.updateStatus('inactive', 'Stopped');
    }

    // Helper to wait for data channel to be ready
    waitForDataChannel(dataChannel) {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Data channel connection timeout'));
        }, 10000); // 10 second timeout

        if (dataChannel.readyState === 'open') {
          clearTimeout(timeout);
          resolve();
        } else {
          dataChannel.onopen = () => {
            clearTimeout(timeout);
            resolve();
          };
          dataChannel.onerror = (error) => {
            clearTimeout(timeout);
            reject(error);
          };
        }
      });
    }

    // Helper to wait for ICE connection
    waitForICEConnection(peerConnection) {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('ICE connection timeout'));
        }, 10000); // 10 second timeout

        if (peerConnection.iceConnectionState === 'connected' || 
            peerConnection.iceConnectionState === 'completed') {
          clearTimeout(timeout);
          resolve();
        } else {
          peerConnection.oniceconnectionstatechange = () => {
            if (peerConnection.iceConnectionState === 'connected' || 
                peerConnection.iceConnectionState === 'completed') {
              clearTimeout(timeout);
              resolve();
            } else if (peerConnection.iceConnectionState === 'failed' || 
                       peerConnection.iceConnectionState === 'disconnected' ||
                       peerConnection.iceConnectionState === 'closed') {
              clearTimeout(timeout);
              reject(new Error(`ICE connection failed: ${peerConnection.iceConnectionState}`));
            }
          };
        }
      });
    }

    async initialize() {
      try {
        // Get API key from storage
        const { openaiApiKey } = await chrome.storage.sync.get('openaiApiKey');
        if (!openaiApiKey) {
          throw new Error('OpenAI API key not found. Please set it in the extension options.');
        }

        // Request microphone permission first
        let stream;
        try {
          // First check if we already have permission
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
          if (permissionStatus.state === 'denied') {
            throw new Error('Microphone permission is denied. Please enable it in your browser settings.');
          }

          stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            },
            video: false
          });
          console.log('Microphone access granted');
          
          // Get ephemeral token directly from OpenAI
          console.log('Requesting ephemeral token...');
          try {
            const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${openaiApiKey}`,
                "Content-Type": "application/json",
                "OpenAI-Beta": "realtime-2024-12-17"
              },
              body: JSON.stringify({
                model: "gpt-4o-realtime-preview-2024-12-17",
                voice: "verse"
              }),
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error('OpenAI API error:', response.status);
              console.error('Error details:', errorText);
              throw new Error(`OpenAI API error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('OpenAI response:', data); // Debug log
            
            // The token should be in client_secret.value as per documentation
            const ephemeralKey = data.client_secret?.value;
            if (!ephemeralKey) {
              console.error('Invalid token response:', data);
              throw new Error('No client secret found in OpenAI response');
            }
            
            console.log('Got ephemeral token successfully');

            // Create peer connection with STUN servers
            this.peerConnection = new RTCPeerConnection({
              iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
              ]
            });

            // Set up audio playback first
            this.audioElement = document.createElement('audio');
            this.audioElement.autoplay = true;
            this.peerConnection.ontrack = (event) => {
              this.audioElement.srcObject = event.streams[0];
            };

            // Add local audio track
            stream.getTracks().forEach(track => {
              this.peerConnection.addTrack(track, stream);
            });

            // Set up data channel before creating offer
            this.dataChannel = this.peerConnection.createDataChannel("oai-events", {
              ordered: true
            });
            
            // Set up data channel handlers
            this.setupDataChannelHandlers();

            // Create and send offer after data channel is set up
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);

            console.log('Sending SDP offer to OpenAI...');
            const sdpResponse = await fetch(
              `https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`,
              {
                method: "POST",
                body: offer.sdp,
                headers: {
                  Authorization: `Bearer ${ephemeralKey}`,
                  "Content-Type": "application/sdp"
                },
              }
            );

            if (!sdpResponse.ok) {
              const errorText = await sdpResponse.text();
              throw new Error(`OpenAI API error: ${sdpResponse.status} - ${errorText}`);
            }

            const answer = {
              type: "answer",
              sdp: await sdpResponse.text(),
            };
            await this.peerConnection.setRemoteDescription(answer);

            // Wait for data channel to be ready
            await this.waitForDataChannel(this.dataChannel);
            console.log('Data channel ready');

            // Send function definitions only after data channel is ready
            this.setupFunctionDefinitions();
            console.log('Function definitions sent');

            // Update status to connected
            this.updateStatus('active', 'Connected and listening...');

          } catch (serverError) {
            console.error('Server connection error:', serverError);
            throw new Error(serverError.message);
          }
        } catch (mediaError) {
          console.error('Microphone access error:', mediaError);
          this.updateStatus('inactive', mediaError.message || 'Microphone access denied');
          throw new Error(mediaError.message || 'Microphone access is required');
        }
      } catch (error) {
        console.error('Initialization error:', error);
        throw error;
      }
    }

    setupDataChannelHandlers() {
      this.dataChannel.onmessage = async (event) => {
        console.log('Received message:', event.data);
        try {
          const realtimeEvent = JSON.parse(event.data);
          console.log('Parsed event:', realtimeEvent);
          
          // Handle different event types
          switch (realtimeEvent.type) {
            case 'session.created':
              console.log('Session created, sending function definitions...');
              this.setupFunctionDefinitions();
              break;
              
            case 'response.done':
              if (realtimeEvent.response && realtimeEvent.response.output) {
                console.log('Processing response output:', realtimeEvent.response.output);
                realtimeEvent.response.output.forEach(async (output) => {
                  if (output.type === 'function_call') {
                    console.log('Received function call in output:', output);
                    await this.handleFunctionCall(output);
                  }
                });
              }
              break;
              
            case 'function_call':
              console.log('Received direct function call:', realtimeEvent);
              await this.handleFunctionCall(realtimeEvent);
              break;
              
            case 'text':
              console.log('Received text:', realtimeEvent.text);
              break;
              
            default:
              console.log('Unhandled event type:', realtimeEvent.type);
          }
        } catch (error) {
          console.error('Error handling message:', error);
        }
      };

      this.dataChannel.onerror = (error) => {
        console.error('Data channel error:', error);
        this.updateStatus('inactive', 'Connection error occurred');
      };

      this.dataChannel.onclose = () => {
        console.log('Data channel closed');
        this.stop();
      };

      this.dataChannel.onopen = () => {
        console.log('Data channel opened');
        // Send initial response to start the conversation
        this.sendResponseToModel("Hello! I'm ready to help you navigate this webpage. You can ask me to click buttons, scroll the page, or read content for you.");
      };
    }

    setupFunctionDefinitions() {
      const functionDefinitions = {
        type: "session.update",
        session: {
          tools: [
            {
              type: "function",
              name: "navigate",
              description: "Navigate the webpage using voice commands",
              parameters: {
                type: "object",
                strict: true,
                properties: {
                  action: {
                    type: "string",
                    enum: ["click", "scroll", "focus", "read"],
                    description: "The action to perform"
                  },
                  target: {
                    type: "string",
                    description: "The target element or direction (e.g., button text, link text, 'up', 'down')"
                  },
                  amount: {
                    type: "string",
                    enum: ["little", "medium", "lot", "full"],
                    description: "Amount for scrolling actions"
                  }
                },
                required: ["action", "target"]
              }
            }
          ],
          tool_choice: "auto"
        }
      };

      console.log('Sending function definitions:', functionDefinitions);
      this.dataChannel.send(JSON.stringify(functionDefinitions));
    }

    async handleFunctionCall(event) {
      console.log('Handling function call:', event);
      try {
        const functionCall = event.function_call || event;
        const name = functionCall.name;
        let args = {};
        
        try {
          args = typeof functionCall.arguments === 'string' 
            ? JSON.parse(functionCall.arguments)
            : functionCall.arguments;
        } catch (e) {
          console.error('Error parsing arguments:', e);
          throw new Error('Invalid function arguments');
        }

        console.log('Executing function:', name, 'with args:', args);
        
        if (name === 'navigate') {
          const { action, target, amount = 'medium' } = args;
          
          switch (action) {
            case 'click':
              await this.handleClick({ selector: target });
              break;
            case 'scroll':
              await this.handleScroll({ direction: target, amount });
              break;
            case 'focus':
              await this.handleFocus({ selector: target });
              break;
            case 'read':
              await this.handleRead({ selector: target });
              break;
            default:
              throw new Error(`Unknown action: ${action}`);
          }
        } else {
          throw new Error(`Unknown function: ${name}`);
        }

        this.sendResponseToModel(`Successfully executed ${name} with action ${args.action}`);
      } catch (error) {
        console.error(`Error handling function ${event.name}:`, error);
        this.sendErrorToModel(`Failed to execute ${event.name}: ${error.message}`);
      }
    }

    async handleFocus({ selector, elementType = 'any' }) {
      const element = this.findElement(selector, elementType);
      if (element) {
        element.focus();
        this.updateLastCommand(`Focused on ${elementType}: ${selector}`);
      } else {
        throw new Error(`Could not find ${elementType} element: ${selector}`);
      }
    }

    async handleScroll({ direction, amount = 'medium' }) {
      const scrollAmounts = {
        little: 100,
        medium: 300,
        lot: 800,
        full: document.documentElement.scrollHeight
      };
      
      const scrollAmount = scrollAmounts[amount];
      
      switch (direction) {
        case 'up':
          window.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
          break;
        case 'down':
          window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
          break;
        case 'top':
          window.scrollTo({ top: 0, behavior: 'smooth' });
          break;
        case 'bottom':
          window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
          break;
      }
      
      this.updateLastCommand(`Scrolled ${direction} by ${amount}`);
    }

    async handleClick({ selector, elementType = 'any' }) {
      const element = this.findElement(selector, elementType);
      if (element) {
        element.click();
        this.updateLastCommand(`Clicked ${elementType}: ${selector}`);
      } else {
        throw new Error(`Could not find clickable element: ${selector}`);
      }
    }

    async handleRead({ selector, type = 'any' }) {
      const element = this.findElement(selector, type);
      if (element) {
        const text = element.textContent.trim();
        this.sendTextToModel(text);
        this.updateLastCommand(`Reading content: ${selector}`);
      } else {
        throw new Error(`Could not find readable content: ${selector}`);
      }
    }

    findElement(selector, type = 'any') {
      // Try direct CSS selector first
      let element = document.querySelector(selector);
      
      // If not found, try finding by visible text
      if (!element) {
        const elements = Array.from(document.querySelectorAll('*'));
        element = elements.find(el => {
          const matchesType = type === 'any' || 
                            (type === 'input' && el.tagName === 'INPUT') ||
                            (type === 'button' && (el.tagName === 'BUTTON' || el.role === 'button')) ||
                            (type === 'link' && (el.tagName === 'A' || el.role === 'link')) ||
                            (type === 'heading' && /^H[1-6]$/.test(el.tagName)) ||
                            (type === 'paragraph' && el.tagName === 'P') ||
                            (type === 'list' && (el.tagName === 'UL' || el.tagName === 'OL'));
          
          return matchesType && el.textContent.toLowerCase().includes(selector.toLowerCase());
        });
      }
      
      return element;
    }

    sendResponseToModel(message) {
      const event = {
        type: "response.create",
        response: {
          instructions: message
        }
      };
      if (this.dataChannel && this.dataChannel.readyState === 'open') {
        console.log('Sending response to model:', event);
        this.dataChannel.send(JSON.stringify(event));
      } else {
        console.error('Data channel not ready for sending response');
      }
    }

    sendErrorToModel(error) {
      const event = {
        type: "response.create",
        response: {
          instructions: `Error: ${error}. Please try a different approach or provide more specific instructions.`
        }
      };
      if (this.dataChannel && this.dataChannel.readyState === 'open') {
        console.log('Sending error to model:', event);
        this.dataChannel.send(JSON.stringify(event));
      } else {
        console.error('Data channel not ready for sending error');
      }
    }

    sendTextToModel(text) {
      const event = {
        type: "response.create",
        response: {
          instructions: `Read and summarize this text: ${text}`
        }
      };
      this.dataChannel.send(JSON.stringify(event));
    }

    updateStatus(status, details) {
      chrome.runtime.sendMessage({
        type: 'status',
        status: status,
        details: details
      });
    }

    updateLastCommand(command) {
      chrome.runtime.sendMessage({
        type: 'command',
        command: command
      });
    }
  }

  // Initialize the assistant
  window.voiceNavigationAssistant = new VoiceNavigationAssistant();
} 