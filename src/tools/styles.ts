// Tool function descriptions
const injectCssDescription = `
Call this function to modify the page's appearance using CSS. You can change colors, sizes, layouts, etc.
`

// Tool definitions
export const styleTools = [
  {
    type: 'function',
    name: 'inject_css',
    description: injectCssDescription,
    parameters: {
      type: 'object',
      strict: true,
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector to target elements (e.g., "body", ".class-name", "#id")',
        },
        properties: {
          type: 'object',
          description: 'CSS properties to apply',
          properties: {
            backgroundColor: { type: 'string', description: 'Background color (e.g., "#fff", "red")' },
            color: { type: 'string', description: 'Text color' },
            fontSize: { type: 'string', description: 'Font size (e.g., "16px", "1.2em")' },
            padding: { type: 'string', description: 'Padding (e.g., "10px", "1em")' },
            margin: { type: 'string', description: 'Margin' },
            width: { type: 'string', description: 'Width' },
            height: { type: 'string', description: 'Height' },
            display: { type: 'string', description: 'Display property' },
            position: { type: 'string', description: 'Position property' },
            border: { type: 'string', description: 'Border property' },
            borderRadius: { type: 'string', description: 'Border radius' },
            boxShadow: { type: 'string', description: 'Box shadow' },
            opacity: { type: 'string', description: 'Opacity (0-1)' },
            transform: { type: 'string', description: 'Transform property' },
            transition: { type: 'string', description: 'Transition property' },
          },
          additionalProperties: true,
        },
        important: {
          type: 'boolean',
          description: 'Whether to add !important to all properties',
          default: false,
        },
      },
      required: ['selector', 'properties'],
    },
  },
]

// Tool implementations
export const styleActions = {
  inject_css: ({ selector, properties, important = false }: { 
    selector: string; 
    properties: Record<string, string>;
    important?: boolean;
  }) => {
    try {
      // Create a unique ID for this style
      const styleId = `injected-style-${Math.random().toString(36).substr(2, 9)}`
      
      // Remove any existing style with this ID
      const existingStyle = document.getElementById(styleId)
      if (existingStyle) {
        existingStyle.remove()
      }

      // Convert properties object to CSS string
      const cssProperties = Object.entries(properties)
        .map(([key, value]) => {
          // Convert camelCase to kebab-case
          const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
          return `${cssKey}: ${value}${important ? ' !important' : ''};`
        })
        .join(' ')

      // Create and inject the style element
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `${selector} { ${cssProperties} }`
      document.head.appendChild(style)

      return `Applied CSS to "${selector}": ${cssProperties}`
    } catch (error) {
      return `Error applying CSS: ${error}`
    }
  },
} 