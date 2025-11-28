# Simple AI Chat

A lightweight, full-stack example application demonstrating how to build a minimal but functional chat interface that integrates with a local large language model (LLM) backend. This project showcases modern web development practices including reactive UI patterns, streaming response handling, and optional serverside persistence.

## Overview

Simple AI Chat provides a production-grade reference implementation for interacting with [LM Studio](https://lmstudio.ai) through two distinct architectural patterns:

1. **Browser-only mode** (default): Direct browser-to-LM Studio communication with client-side IndexedDB persistence
2. **Python proxy mode**: Lightweight Flask middleware enabling server-side JSON persistence and enhanced reliability

## Features

- **Dual-architecture support**: Choose between direct browser communication or server-proxied requests
- **Real-time streaming**: Native Streams API integration for progressive response rendering
- **Conversation management**: Create, edit, delete, and organize multiple conversations
- **Data persistence**: IndexedDB (browser) or JSON file storage (via proxy)
- **Import/export**: Full conversation serialization for backup and migration
- **Model selection**: Runtime model switching with automatic capability detection
- **Responsive design**: Mobile-friendly UI built with UIkit framework

## Technology Stack

### Frontend
- **Runtime**: [Svelte 5](https://svelte.dev/) with [TypeScript](https://typescriptlang.org)
- **Build tooling**: [Vite](https://vite.dev) with HMR support
- **UI framework**: [UIkit 3](https://getuikit.com) (CSS component library)
- **Icons**: [Font Awesome 6](https://fontawesome.com)
- **HTML sanitization**: DOMPurify for secure markdown rendering

### Backend (Optional)
- **Runtime**: Python 3.7+
- **Framework**: Flask with CORS support
- **HTTP client**: Requests library
- **Storage**: JSON file-based persistence

## Architecture

### Browser Mode (In-Browser API)
```
Browser UI (Svelte) → Direct HTTP → LM Studio API
                    ↓
              IndexedDB Storage
```

### Proxy Mode (Python API)
```
Browser UI (Svelte) → Flask Proxy → LM Studio API
                    ↓
              JSON File Storage
```

## Installation

### Prerequisites
- **Node.js** 16+ and npm/yarn
- **LM Studio** installed and accessible
- **Python 3.7+** (only required for proxy mode)

### Setup

```bash
npm install
```

### Optional: Python Proxy Setup
```bash
cd python-proxy
pip install flask flask-cors requests
```

Ensure the `./python-proxy/chats` directory exists and is writable.

## Configuration

Configure the application via environment variables in a `.env` file at the project root:

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_MIDDLEWARE` | Middleware backend: `local` or `python` | `local` |
| `VITE_LM_STUDIO_URL` | LM Studio API endpoint (OpenAI-compatible) | `http://localhost:1234/v1` |
| `VITE_PYTHON_PROXY_URL` | Python proxy server endpoint | `http://localhost:8080` |

**Example `.env`:**
```env
VITE_MIDDLEWARE=local
VITE_LM_STUDIO_URL=http://localhost:1234/v1
VITE_PYTHON_PROXY_URL=http://localhost:8080
```

## Usage

### Starting LM Studio
```bash
lms server start --cors
```

Or launch from the LM Studio desktop application.

### Running in Browser Mode (Default)
```bash
npm run dev
```

The application will open at `http://localhost:5173` with hot module replacement enabled.

### Running in Proxy Mode
1. Start the Python proxy server:
   ```bash
   cd python-proxy
   python server.py
   ```

2. Set environment variable:
   ```env
   VITE_MIDDLEWARE=python
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Production Build
```bash
npm run build
```

Outputs optimized artifacts to `./dist/`.

### Type Checking
```bash
npm run check
```

Validates Svelte components and TypeScript configurations.

## API Reference

### Browser Mode (InBrowserApi)
- Direct OpenAI-compatible API calls to LM Studio
- Streaming support via Fetch Streams API
- In-memory conversation management with IndexedDB persistence

### Proxy Mode (PythonApi)
See [python-proxy/README.md](./python-proxy/README.md) for detailed endpoint documentation.

## Project Structure

```
src/
├── api/                          # API layer abstraction
│   ├── BaseApi.ts               # Abstract base with streaming logic
│   ├── types.ts                 # Shared TypeScript interfaces
│   ├── in-browser/
│   │   ├── InBrowserApi.ts      # Direct LM Studio integration
│   │   └── persistence.ts       # IndexedDB storage layer
│   └── python/
│       └── PythonApi.ts         # Proxy server integration
├── components/                   # Svelte components
│   ├── Chat.svelte              # Message rendering & interaction
│   ├── Create.svelte            # New conversation dialog
│   └── Sidebar.svelte           # Navigation & conversation list
├── stores/                       # Svelte stores (reactive state)
│   ├── conversations.ts
│   ├── editedConversation.ts
│   ├── models.ts
│   └── selectedConversation.ts
├── helpers/                      # Utility functions
│   └── markdown.ts              # Markdown rendering with DOMPurify
├── config.ts                    # Environment-based configuration
├── App.svelte                   # Root component
├── main.ts                      # Application entry point
└── app.css                      # Global styles
```

## Development

### Debugging
Enable browser DevTools (F12) to inspect network requests and IndexedDB storage. For proxy mode, enable Flask debug logging:

```bash
python python-proxy/server.py --debug
```

### Type Safety
TypeScript configuration extends `@tsconfig/svelte` for full type support in Svelte components.

## Screenshots

<img src="./sac1.jpg" alt="Chat interface" width="75%" />
<img src="./sac2.jpg" alt="Conversation list" width="75%" />
<img src="./sac3.jpg" alt="Model selection" width="75%" />

## License

See LICENSE file for licensing information.
