import { navigationTools, navigationActions } from './navigation'

// Define types for our tools system
type ToolFunction = (...args: any[]) => string
type ToolActions = { [key: string]: ToolFunction }

// Combine all tool definitions
export const allTools = [
  ...navigationTools,
  // Add more tool arrays here as we create them
]

// Combine all tool implementations
export const toolActions: ToolActions = {
  ...navigationActions,
  // Add more action objects here as we create them
}

// Session update message for the Realtime API
export const sessionUpdate = {
  type: 'session.update',
  session: {
    tools: allTools,
    tool_choice: 'auto',
  },
}

// Handle function calls from the model
export function handleFunctionCall(functionCall: { name: string; arguments: string }) {
  console.log('Handling function call:', functionCall)

  const action = toolActions[functionCall.name]
  if (!action) {
    console.error('Unknown function:', functionCall.name)
    console.log('Available functions:', Object.keys(toolActions))
    throw new Error(`Unknown function: ${functionCall.name}`)
  }

  try {
    console.log('Parsing arguments:', functionCall.arguments)
    const args = JSON.parse(functionCall.arguments)
    console.log('Parsed arguments:', args)

    console.log('Executing function:', functionCall.name)
    const result = action(args)
    console.log('Function result:', result)

    return result
  } catch (error) {
    console.error('Error executing function:', error)
    console.error('Function call details:', {
      name: functionCall.name,
      arguments: functionCall.arguments,
      availableFunctions: Object.keys(toolActions)
    })
    throw error
  }
}

// Helper function to create a response
export function createResponse(instructions: string) {
  return {
    type: 'response.create',
    response: {
      instructions,
    },
  }
} 