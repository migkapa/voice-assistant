# Voice Assistant Chrome Extension

A powerful Chrome extension that enables voice-controlled web navigation and content interaction using OpenAI's Realtime API and WebRTC.

## Features

- 🎤 Voice-controlled navigation
- 📜 Smart page scrolling
- 🎨 Dynamic CSS customization
- 📖 Page content reading and summarization
- 🔊 Real-time voice feedback
- 🌐 WebRTC integration for low-latency communication

## Prerequisites

- Node.js 18 or higher
- Chrome browser
- OpenAI API key

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd voice-navigation-extension
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
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder from the project directory

## Important: OpenAI API Key Setup

1. Right-click the extension icon in Chrome
2. Select "Options" from the menu
3. Enter your OpenAI API key in the provided field
4. Click "Save"

Note: You can obtain an API key from [OpenAI's website](https://platform.openai.com/api-keys). Keep your API key secure and never share it publicly.

## Usage

### Voice Commands

- Navigation:
  - "Scroll to top" or "Scroll to bottom"
  - "Scroll up" or "Scroll down"

- Styling:
  - "Make background dark"
  - "Increase font size"
  - "Change text color to [color]"

- Content Reading:
  - "Read the page content" - Reads the full page content
  - "Summarize this page" - Provides a brief summary

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
voice-navigation-extension/
├── src/
│   ├── tools/
│   │   ├── navigation.ts    # Scrolling and navigation tools
│   │   ├── styles.ts        # CSS injection tools
│   │   ├── web.ts           # Content reading tools
│   │   └── index.ts         # Tools registration
│   ├── popup.tsx            # Extension popup UI
│   ├── content.ts           # Content script
│   └── options.tsx          # Options page
├── public/                  # Static assets
└── dist/                    # Built files
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

- The extension requires an OpenAI API key which is stored securely in Chrome's storage
- Voice data is processed using WebRTC for secure, real-time communication
- No data is stored permanently; all processing happens in real-time

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenAI for providing the Realtime API
- Chrome Extensions API
- WebRTC for real-time communication
- Turndown for HTML to Markdown conversion 