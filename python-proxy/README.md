# Simple python proxy server with persistence

A python middleware that acts as a proxy between the GUI and LM Studio, plus it persists the conversations to JSON files.

## Installing

```pip install flask flask-cors requests```

Make sure there's a directory ```./python-proxy/chats``` and it is writable.

## Basic start

```python server.py```

## Advanced start

```python server.py --debug --host localhost --port 8080 --lm-studio-url http://localhost:1234 --chats-dir ./chats```