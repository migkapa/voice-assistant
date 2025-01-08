// Tool function descriptions
const injectCssDescription = `
Call this function to inject any CSS styles into the page. You can modify any element's appearance using standard CSS.
Examples:
- "Make the background dark" -> inject_css({ selector: "body", css: "background-color: #1a1a1a; color: #ffffff;" })
- "Increase text size" -> inject_css({ selector: "p, h1, h2, h3", css: "font-size: 1.2em;" })
- "Add custom styles" -> inject_css({ selector: ".my-class", css: "border: 2px solid red; padding: 10px;" })
`

// Tool definitions
export const styleTools = [
  {
    type: 'function',
    name: 'inject_css',
    description: injectCssDescription,
    parameters: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector to target elements (e.g., "body", ".class-name", "#id", "p, h1")',
        },
        css: {
          type: 'string',
          description: 'CSS rules to apply (e.g., "color: red; font-size: 16px;")',
        },
      },
      required: ['selector', 'css'],
    },
  },
]

// Tool implementations
export const styleActions = {
  inject_css: ({ selector, css }: { selector: string; css: string }) => {
    try {
      // Create a unique ID for this style
      const styleId = `injected-style-${Math.random().toString(36).substr(2, 9)}`
      
      // Remove any existing style with this ID
      const existingStyle = document.getElementById(styleId)
      if (existingStyle) {
        existingStyle.remove()
      }

      // Process the CSS to add !important to each property
      const processedCss = css
        .split(';')
        .filter(rule => rule.trim())
        .map(rule => {
          const trimmedRule = rule.trim()
          return trimmedRule.endsWith('!important') 
            ? trimmedRule 
            : `${trimmedRule} !important`
        })
        .join('; ')

      // Create and inject the style element
      const style = document.createElement('style')
      style.id = styleId

      // Process selectors to increase specificity without duplication
      const processedSelector = selector
        .split(',')
        .map(s => {
          const trimmed = s.trim()
          // If it's already a body selector, just add :not(#_)
          if (trimmed === 'body') {
            return 'body:not(#_)'
          }
          // For other selectors, add :not(#_) to increase specificity
          return `${trimmed}:not(#_)`
        })
        .join(', ')
      
      style.textContent = `${processedSelector} { ${processedCss} }`
      
      // Insert at the end of head to override other styles
      document.head.appendChild(style)

      console.log('Injected CSS:', {
        id: styleId,
        selector: processedSelector,
        css: processedCss
      })

      return `Applied CSS to "${selector}": ${processedCss}`
    } catch (error) {
      console.error('CSS injection error:', error)
      return `Error applying CSS: ${error}`
    }
  },
} 