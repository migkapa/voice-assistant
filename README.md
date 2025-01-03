# Voice Assistant - Chrome Extension

A cool Chrome extension that lets you navigate the web and customize pages with your voice, thanks to OpenAI's latest voice models.

## Features

- 🎙️ Voice-controlled web navigation
- 📜 Smart page scrolling
- 🎨 Dynamic CSS customization
- 🔊 Real-time voice feedback
- ⚡ WebRTC-powered for low latency

## Prerequisites

- Node.js 18 or higher
- Chrome browser (version 88 or later)
- OpenAI API key with access to:
  - Voice models
  - WebRTC capabilities
  - Real-time audio streaming


## Important: OpenAI API Key Setup

This extension requires an OpenAI API key to function. After installation:
1. Right-click the extension icon in Chrome
2. Select "Options" from the menu
3. Enter your OpenAI API key in the provided field
4. Click "Save"

**Note**: Your API key is stored securely in Chrome's local storage and is never shared.

You can obtain an OpenAI API key from your [OpenAI account dashboard](https://platform.openai.com/api-keys). Make sure your account has sufficient credits for voice model usage.

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/voice-assistant.git
cd voice-assistant
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `dist` directory

5. **Configure your OpenAI API key** (required):
   - Right-click the extension icon in Chrome's toolbar
   - Select "Options" from the menu
   - Enter your OpenAI API key
   - Click "Save"
   - The extension icon should turn green when properly configured

**Note**: The extension will not function without a valid OpenAI API key. If you see any initialization errors, double-check your API key in the options page.

## Usage

### Voice Commands

The extension supports various voice commands for navigation and page customization:

#### Navigation Commands
- "Scroll to bottom"
- "Scroll to top"
- "Scroll down"
- "Scroll up"
- "Scroll halfway"

#### Style Commands
- "Make the background dark"
- "Increase font size"
- "Make text larger"
- "Add dark mode"
- "Make text more readable"

### Getting Started

1. Click the extension icon to open the popup
2. Click the microphone button to start voice recognition
3. Speak your command naturally
4. The extension will execute your command and provide voice feedback

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
voice-assistant/
├── src/
│   ├── tools/          # Navigation and styling tools
│   │   ├── navigation.ts  # Scrolling and navigation commands
│   │   ├── styles.ts     # CSS injection and styling tools
│   │   └── index.ts      # Tools configuration
│   ├── popup.tsx       # Extension popup UI
│   ├── options.tsx     # Options page for API key
│   ├── content.ts      # Content script with WebRTC
│   └── background.ts   # Service worker
├── public/             # Static assets
│   └── icons/         # Extension icons
└── dist/              # Built extension
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use Prettier for code formatting
- Add JSDoc comments for new functions
- Update tests for new features
- Keep the code modular and maintainable

## Security

- Never commit your OpenAI API key
- Use environment variables for sensitive data
- Follow Chrome Extension security best practices
- Report security issues through GitHub issues

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenAI for their voice models and WebRTC implementation
- Chrome Extensions API
- React and Vite for the development environment
- Contributors and the open-source community 