import TurndownService from 'turndown'

// Tool function descriptions
const readDescription = `
Call this function to read and understand the content of the current webpage.
It will convert the page content to a markdown format and summarize it.
`

// Initialize Turndown service
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  hr: '---',
  bulletListMarker: '-'
})

// Configure Turndown rules
turndownService.addRule('removeAds', {
  filter: ['iframe', 'script', 'style', 'noscript', 'nav', 'footer'],
  replacement: () => ''
})

// Helper function to clean up the content
function cleanContent(element: Element): HTMLElement {
  // Remove unwanted elements
  const unwanted = [
    'iframe', 'script', 'style', 'noscript', 'nav', 'footer',
    '[aria-hidden="true"]', '[role="complementary"]',
    '.ad', '.ads', '.advertisement', '.social-share',
    'header', 'aside'
  ]
  
  const clone = element.cloneNode(true) as HTMLElement
  unwanted.forEach(selector => {
    clone.querySelectorAll(selector).forEach(el => el.remove())
  })
  
  return clone
}

// Helper function to extract main content
function getMainContent(): HTMLElement {
  // Try to find the main content area
  const selectors = [
    'main',
    'article',
    '[role="main"]',
    '.main-content',
    '.article-content',
    '#content',
    '.content'
  ]
  
  for (const selector of selectors) {
    const element = document.querySelector(selector)
    if (element) return element as HTMLElement
  }
  
  // Fallback to body if no main content area found
  return document.body
}

// Tool definitions
export const webTools = [
  {
    type: 'function',
    name: 'read_page',
    description: readDescription,
    parameters: {
      type: 'object',
      properties: {
        mode: {
          type: 'string',
          enum: ['full', 'summary'],
          description: 'Whether to read the full content or just a summary',
          default: 'summary'
        }
      }
    }
  }
]

// Get the data channel from the content script
declare global {
  interface Window {
    __VOICE_NAVIGATION_DATA_CHANNEL__?: RTCDataChannel
  }
}

// Tool implementations
export const webActions = {
  read_page: ({ mode = 'summary' }: { mode?: 'full' | 'summary' }) => {
    try {
      // Get main content
      const mainContent = getMainContent()
      
      // Clean the content
      const cleanedContent = cleanContent(mainContent)
      
      // Convert to markdown
      const markdown = turndownService.turndown(cleanedContent)
      
      // Get data channel from window
      const dataChannel = window.__VOICE_NAVIGATION_DATA_CHANNEL__
      
      // Create conversation item with the content
      if (dataChannel?.readyState === 'open') {
        // First, create a conversation item with the markdown content
        const createItem = {
          type: 'conversation.item.create',
          item: {
            type: 'message',
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: mode === 'full' ? markdown : 
                  `Please provide a brief summary of this page content: ${markdown}`
              }
            ]
          }
        }
        dataChannel.send(JSON.stringify(createItem))
        
        // Then, request a text response from the model
        const createResponse = {
          type: 'response.create',
          response: {
            modalities: ['text', 'voice'],
            instructions: mode === 'full' 
              ? 'Please read and explain the content of this page.'
              : 'Please provide a brief summary of the main points from this page.'
          }
        }
        dataChannel.send(JSON.stringify(createResponse))
        
        return 'Processing page content...'
      }
      
      return 'Error: WebRTC connection not available'
    } catch (error) {
      return `Error reading page: ${error}`
    }
  }
} 