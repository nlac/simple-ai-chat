# LM Studio Chat Proxy Server

A lightweight Flask-based HTTP middleware that proxies requests to [LM Studio](https://lmstudio.ai) while providing persistent JSON-based conversation storage and streaming response handling. This server enables server-side state management for chat applications and adds resilience through file-based durability.

## Overview

The Chat Proxy Server acts as an intermediary between chat client applications (e.g., the Simple AI Chat frontend) and LM Studio's OpenAI-compatible API. It handles:

- **Bidirectional proxying**: Forwards client requests to LM Studio and streams responses back
- **Persistent storage**: Automatic JSON serialization of conversations to disk
- **Transactional safety**: Atomic message operations with automatic synchronization
- **Streaming support**: Native Server-Sent Events (SSE) implementation for real-time responses
- **CORS handling**: Pre-configured cross-origin resource sharing for browser clients

## Architecture

```
Client Application (Browser/API)
          ↓ HTTP/REST
    Flask Proxy Server
          ↓ HTTP/REST
    LM Studio API (OpenAI-compatible)
          
    ↓ Persistent Storage
    JSON File Storage (./chats/)
```

## Requirements

- **Python**: 3.7 or higher
- **Dependencies**:
  - Flask ≥2.0 (web framework)
  - Flask-CORS ≥3.0 (cross-origin support)
  - Requests ≥2.25 (HTTP client library)

## Installation

### Setup

```bash
pip install flask flask-cors requests
```

### Directory Structure

Ensure the chats storage directory exists and is writable:

```bash
mkdir -p ./chats
chmod 755 ./chats
```

This directory will store conversation JSON files. The server creates it automatically if missing.

## Usage

### Basic Start

```bash
python server.py
```

Starts the server on `localhost:8080` with default configuration.

### Advanced Start with Custom Configuration

```bash
python server.py \
  --host localhost \
  --port 8080 \
  --lm-studio-url http://localhost:1234 \
  --chats-dir ./chats \
  --debug
```

### Command-Line Arguments

| Argument | Short | Description | Default |
|----------|-------|-------------|---------|
| `--host` | | Bind address | `localhost` |
| `--port` | | Listen port | `8080` |
| `--lm-studio-url` | | LM Studio API base URL | `http://localhost:1234` |
| `--chats-dir` | | Chat storage directory | `./chats` |
| `--debug` | | Enable Flask debug mode | disabled |

### Environment Variables

Alternatively, configure via environment variables:

```bash
export FLASK_DEBUG=1
export LM_STUDIO_URL=http://localhost:1234
export CHATS_DIR=./chats
python server.py
```

## API Reference

### Chat Endpoints

All endpoints return JSON with the following standard response format:

```json
{
  "status": "success" | "error",
  "message": "Human-readable status",
  "data": {}
}
```

#### GET /chats

List all available conversations.

**Response:**
```json
{
  "status": "success",
  "chats": [
    {
      "id": "conversation-1",
      "name": "conversation-1",
      "model": "neural-chat:latest"
    }
  ]
}
```

#### GET /chat

Retrieve a specific conversation by name.

**Query Parameters:**
- `name` (required): Conversation filename without extension

**Response:**
```json
{
  "status": "success",
  "chat": {
    "model": "neural-chat:latest",
    "messages": [
      {"role": "user", "content": "Hello"},
      {"role": "assistant", "content": "Hi there!"}
    ],
    "temperature": 0.7,
    "max_tokens": -1,
    "created_at": "2025-01-15T10:30:00.123456",
    "updated_at": "2025-01-15T10:31:00.654321"
  }
}
```

#### POST /chat

Create a new empty conversation.

**Request Body:**
```json
{
  "name": "my-conversation",
  "model": "neural-chat:latest",
  "temperature": 0.7,
  "max_tokens": -1
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Chat 'my-conversation' created",
  "chat": {
    "model": "neural-chat:latest",
    "messages": [],
    "temperature": 0.7,
    "max_tokens": -1,
    "created_at": "2025-01-15T10:30:00.123456",
    "updated_at": "2025-01-15T10:30:00.123456"
  }
}
```

#### PUT /chat

Add a user message and stream the assistant's response from LM Studio.

**Request Body:**
```json
{
  "name": "my-conversation",
  "message": {
    "role": "user",
    "content": "What is machine learning?"
  }
}
```

**Response Stream:**
Server-Sent Events format. Each chunk follows the pattern:
```
data: {"id": "...", "choices": [{"delta": {"content": "streaming text"}}]}

data: [DONE]
```

After streaming completes, the conversation is automatically persisted with the assistant's complete response.

#### DELETE /chat

Delete an entire conversation.

**Query Parameters:**
- `name` (required): Conversation filename without extension

**Response:**
```json
{
  "status": "success",
  "message": "Chat 'my-conversation' deleted"
}
```

#### DELETE /chat/message

Remove a specific message from a conversation by index.

**Request Body:**
```json
{
  "name": "my-conversation",
  "index": 0
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Message at index 0 deleted",
  "removed_message": {
    "role": "user",
    "content": "Hello"
  }
}
```

## Storage Format

Conversations are stored as JSON files in the configured chats directory. File naming follows the pattern: `{conversation_name}.json`

**Example file structure:**
```json
{
  "model": "neural-chat:latest",
  "messages": [
    {
      "role": "user",
      "content": "What is Python?"
    },
    {
      "role": "assistant",
      "content": "Python is a high-level programming language..."
    }
  ],
  "temperature": 0.7,
  "max_tokens": -1,
  "created_at": "2025-01-15T10:30:00.123456",
  "updated_at": "2025-01-15T10:31:00.654321"
}
```

## Integration with Simple AI Chat

To use this proxy with the Simple AI Chat frontend:

1. Ensure the proxy is running:
   ```bash
   python server.py
   ```

2. Configure the frontend with environment variables:
   ```env
   VITE_MIDDLEWARE=python
   VITE_PYTHON_PROXY_URL=http://localhost:8080
   ```

3. Start the frontend development server:
   ```bash
   npm run dev
   ```

## Error Handling

The server implements comprehensive error handling with appropriate HTTP status codes:

| Status | Condition |
|--------|-----------|
| 200 | Successful request |
| 400 | Missing or invalid request parameters |
| 404 | Chat not found |
| 409 | Conflict (e.g., chat already exists) |
| 500 | Server error (LM Studio unavailable, file I/O error, etc.) |

**Error Response Format:**
```json
{
  "status": "error",
  "message": "Descriptive error message"
}
```

## Logging

The server uses Python's standard logging module. Enable verbose output with:

```bash
python server.py --debug
```

Example log output:
```
INFO:__main__:Starting Chat Proxy Server on localhost:8080
INFO:__main__:LM Studio URL: http://localhost:1234
INFO:__main__:Chats directory: ./chats
```

## Performance Considerations

- **Streaming**: Large responses stream progressively to avoid memory overhead
- **File I/O**: Conversations are written to disk only after complete assistant responses
- **CORS**: Enabled globally for simplicity; consider restricting in production
- **Threading**: Flask is configured with `threaded=True` to handle concurrent requests


## Troubleshooting

### LM Studio Connection Failed
Verify LM Studio is running and accessible:
```bash
curl http://localhost:1234/v1/models
```

### Permission Denied on Chats Directory
Ensure the directory is writable:
```bash
chmod 755 ./chats
```

### Port Already in Use
Change the port:
```bash
python server.py --port 9000
```

## License

See LICENSE file for licensing information.