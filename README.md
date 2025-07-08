# Parabol Peaker

A Chrome extension built with Plasmo framework that intercepts and logs WebSocket messages from Parabol's real-time communication system.

## Features

- **WebSocket Interception**: Automatically intercepts all WebSocket connections to `wss://action.parabol.co/`
- **Real-time Monitoring**: Displays intercepted messages in the extension popup with timestamps and message types
- **Message Filtering**: Only captures Parabol-specific WebSocket traffic
- **Non-intrusive**: Does not modify or interfere with the original WebSocket data flow
- **Clean Architecture**: Built with TypeScript following SOLID principles

## How It Works

### WebSocket Interception Strategy

The extension uses a multi-layered approach to intercept WebSocket messages:

1. **Content Script Injection**: The content script injects a `<script>` tag into the page context at `document_start`
2. **Constructor Override**: Overrides the `window.WebSocket` constructor to intercept all new WebSocket connections
3. **Method Interception**: Wraps the `send()` method and `addEventListener()` to capture outgoing and incoming messages
4. **Message Relay**: Uses `window.postMessage()` to communicate intercepted messages back to the content script
5. **Background Storage**: Messages are stored in the background script for persistence

### Key Components

- **`content.ts`**: Main content script that injects the WebSocket interceptor
- **`background.ts`**: Background script that stores and manages intercepted messages
- **`hooks/useBackgroundMessages.ts`**: React hook for communicating with background script
- **`popup.tsx`**: Extension popup UI that displays intercepted messages

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. Load the extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `build/chrome-mv3-dev` directory

## Usage

1. **Navigate to Parabol**: Open a Parabol planning poker session
2. **Open Extension**: Click the extension icon in your browser toolbar
3. **Monitor Messages**: The popup will display intercepted WebSocket messages in real-time
4. **View Details**: Each message shows:
   - Message type (incoming/outgoing)
   - Timestamp
   - WebSocket URL
   - Message data (formatted JSON when possible)

## Technical Details

### Message Structure

```typescript
interface WebSocketMessage {
  id: string // Unique identifier
  timestamp: number // Unix timestamp
  type: "incoming" | "outgoing"
  data: any // Message payload
  url: string // WebSocket URL
}
```

### Injection Strategy

The WebSocket interceptor is injected using a `<script>` tag to ensure it runs in the page context before Parabol's code initializes. This approach:

- Runs at `document_start` to catch early WebSocket connections
- Preserves all original WebSocket functionality
- Only intercepts connections to `action.parabol.co`
- Uses a message queue to prevent blocking

### Security Considerations

- **No Data Modification**: The extension only logs messages, never modifies them
- **Isolated Context**: Uses proper message passing between contexts
- **Memory Management**: Limits stored messages to prevent memory issues
- **Error Handling**: Comprehensive error handling throughout the codebase

## Development

### Available Scripts

- `npm run dev`: Start development server with hot reload
- `npm run build`: Build production extension
- `npm run package`: Create distributable package

### Architecture

The extension follows a clean architecture pattern:

```
content.ts (injection) → page context (interception) → content.ts (relay) → background.ts (storage) → popup.tsx (display)
```

### Customization

To intercept different WebSocket endpoints, modify the URL filter in `content.ts`:

```typescript
if (url.includes("action.parabol.co")) {
  // Interception logic
}
```

## Troubleshooting

### Common Issues

1. **No messages appearing**: Ensure you're on a Parabol planning poker page
2. **Extension not loading**: Check that the extension is properly loaded in Chrome
3. **Console errors**: Check the browser console for detailed error messages

### Debug Mode

Enable debug logging by opening the browser console and looking for messages prefixed with:

- `🔍` - WebSocket interception
- `📤` - Outgoing messages
- `📥` - Incoming messages
- `📊` - Message processing

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Disclaimer

This extension is for educational and development purposes. Always respect the terms of service of the websites you're monitoring.
