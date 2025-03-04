// Tool function descriptions
const scrollDescription = `
Call this function to scroll the webpage. You can scroll to specific positions or by increments.
`

const clickDescription = `
Call this function to click on visible elements on the page by their text content.
`

// Tool definitions
export const navigationTools = [
  {
    type: 'function',
    name: 'scroll_page',
    description: scrollDescription,
    parameters: {
      type: 'object',
      strict: true,
      properties: {
        direction: {
          type: 'string',
          enum: ['top', 'bottom', 'up', 'down'],
          description: 'Direction to scroll: top, bottom, up (by 300px), or down (by 300px)',
        },
        smooth: {
          type: 'boolean',
          description: 'Whether to use smooth scrolling',
          default: true,
        },
      },
      required: ['direction'],
    },
  },
  {
    type: 'function',
    name: 'click_element',
    description: clickDescription,
    parameters: {
      type: 'object',
      strict: true,
      properties: {
        text: {
          type: 'string',
          description: 'The text content of the element to click',
        },
      },
      required: ['text'],
    },
  },
]

// Tool implementations
export const navigationActions = {
  scroll_page: ({ direction, smooth = true }: { direction: string; smooth?: boolean }) => {
    const behavior = smooth ? 'smooth' : 'auto'
    
    try {
      switch (direction) {
        case 'top':
          window.scrollTo({ top: 0, behavior })
          break
        case 'bottom':
          window.scrollTo({ top: document.body.scrollHeight, behavior })
          break
        case 'up':
          window.scrollBy({ top: -300, behavior })
          break
        case 'down':
          window.scrollBy({ top: 300, behavior })
          break
        default:
          return `Error: Invalid scroll direction "${direction}"`
      }
      
      return `Scrolled page ${direction}`
    } catch (error) {
      return `Error scrolling: ${error}`
    }
  },

  click_element: ({ text }: { text: string }) => {
    try {
      // Find all elements that contain the text
      const elements = Array.from(document.querySelectorAll('a, button, [role="button"], input[type="submit"]'))
      const matchingElements = elements.filter(el => {
        const content = el.textContent?.toLowerCase() || ''
        return content.includes(text.toLowerCase())
      })

      if (matchingElements.length === 0) {
        return `No clickable elements found containing text "${text}"`
      }

      // Click the first matching element
      const element = matchingElements[0] as HTMLElement
      element.click()
      return `Clicked element containing "${text}"`
    } catch (error) {
      return `Error clicking: ${error}`
    }
  },
} 