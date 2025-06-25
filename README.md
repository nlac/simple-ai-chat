# Simple AI Chat

A Svelte/TS SPA solution as a client for LM Studio' OpenAI-like endpoints, primarily for local experiments. By default it talks directly to LM Studio and persist the conversations to the browser's indexedDB storage.

For fun, a python proxy is provided that acts as a persistence-capable proxy to LM Studio, and the GUI can be simply configured for this mode, instead of the default browser-only mode.

## Installing, building

The build is managed by Vite, the standard commands are available.

```npm install```

```npm run build```

## Running

Prerequisite: 
LM Studio server must installed and running. It can be started either from its UI or by the command 

```lms server start --cors```

Then run the app by 

```npm run dev```

## Configuration

Create an environment file .env in the root like this, adjust the properties for your environment:

```
VITE_MIDDLEWARE=local # local|python
VITE_LM_STUDIO_URL=http://localhost:1234/v1
VITE_PYTHON_PROXY_URL=http://localhost:8080
```

## How to use the python proxy

- set VITE_MIDDLEWARE to "python"
- in the ./python_proxy directory, follow the README to prepare and start the proxy
- start the gui by npm run dev

## TODO

- import/export chats from IndexedDB