# Voice Assistant - Chrome Extension

A powerful Chrome extension that enables voice-controlled web navigation and page customization using OpenAI's latest voice models.

## Features

- 🎙️ Voice-controlled web navigation
- 📜 Smart page scrolling
- 🎨 Dynamic CSS customization
- 🔊 Real-time voice feedback
- ⚡ WebRTC-powered for low latency

## Prerequisites

- Node.js 18 or higher
- Chrome browser
- OpenAI API key

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

5. Configure the extension:
   - Click the extension icon in Chrome
   - Open the options page
   - Enter your OpenAI API key

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