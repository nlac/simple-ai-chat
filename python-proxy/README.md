# Simple python proxy server with persistence

A python middleware that acts as a proxy between the GUI and LM Studio, plus it persists the conversations to JSON files.

## Installing

```pip install flask flask-cors requests```

Make sure the the python-proxy/chats directory is writable.

## Basic start

```python server.py```

## Advanced start

```python server.py --debug --host localhost --port 8080 --lm-studio-url http://localhost:1234 --chats-dir ./chats```