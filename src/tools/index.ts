import { navigationTools, navigationActions } from './navigation'
import { styleTools, styleActions } from './styles'

// Define types for our tools system
type ToolFunction = (...args: any[]) => string
type ToolActions = { [key: string]: ToolFunction }

// Combine all tool definitions
export const allTools = [
  ...navigationTools,
  ...styleTools,
  // Add more tool arrays here as we create them
]

// Combine all tool implementations
export const toolActions: ToolActions = {
  ...navigationActions,
  ...styleActions,
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
  const action = toolActions[functionCall.name]
  if (!action) {
    throw new Error(`Unknown function: ${functionCall.name}`)
  }

  try {
    const args = JSON.parse(functionCall.arguments)
    return action(args)
  } catch (error) {
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