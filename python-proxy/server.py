#!/usr/bin/env python3
"""
LM Studio Chat Proxy Server (Flask)
A persistence-capable proxy server between LM Studio and chat client apps.
"""

import json
import os
import requests
from datetime import datetime
from pathlib import Path
from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ChatProxyServer:
    def __init__(
        self, lm_studio_url: str = "http://localhost:1234", chats_dir: str = "./chats"
    ):
        self.lm_studio_url = lm_studio_url
        self.chats_dir = Path(chats_dir)
        self.chats_dir.mkdir(exist_ok=True)

    def get_chats(self):
        """GET /chats: Return all chat titles (json filenames)"""
        try:
            chat_files = []
            for file_path in self.chats_dir.glob("*.json"):
                with open(file_path, "r", encoding="utf-8") as f:
                    chat_data = json.load(f)
                    chat_files.append(
                        {
                            "id": file_path.stem,  # filename without .json extension
                            "name": file_path.stem,
                            "model": chat_data.get("model"),
                        }
                    )

            return jsonify(
                {
                    "status": "success",
                    "chats": sorted(chat_files, key=lambda item: item.get("id")),
                }
            )
        except Exception as e:
            logger.error(f"Error getting chats: {e}")
            return jsonify({"status": "error", "message": str(e)}), 500

    def get_chat(self):
        """GET /chat: Return particular chat content by filename"""
        chat_name = request.args.get("name")
        if not chat_name:
            return (
                jsonify(
                    {"status": "error", "message": "Chat name parameter is required"}
                ),
                400,
            )

        chat_file = self.chats_dir / f"{chat_name}.json"

        try:
            if not chat_file.exists():
                return (
                    jsonify(
                        {"status": "error", "message": f"Chat '{chat_name}' not found"}
                    ),
                    404,
                )

            with open(chat_file, "r", encoding="utf-8") as f:
                chat_data = json.load(f)

            return jsonify({"status": "success", "chat": chat_data})
        except Exception as e:
            logger.error(f"Error getting chat {chat_name}: {e}")
            return jsonify({"status": "error", "message": str(e)}), 500

    def delete_chat(self):
        """DELETE /chat: Delete a chat file by name"""
        chat_name = request.args.get("name")
        if not chat_name:
            return (
                jsonify(
                    {"status": "error", "message": "Chat name parameter is required"}
                ),
                400,
            )

        chat_file = self.chats_dir / f"{chat_name}.json"

        try:
            if not chat_file.exists():
                return (
                    jsonify(
                        {"status": "error", "message": f"Chat '{chat_name}' not found"}
                    ),
                    404,
                )

            chat_file.unlink()

            return jsonify(
                {"status": "success", "message": f"Chat '{chat_name}' deleted"}
            )
        except Exception as e:
            logger.error(f"Error deleting chat {chat_name}: {e}")
            return jsonify({"status": "error", "message": str(e)}), 500

    def create_chat(self):
        """POST /chat: Create and persist new empty chat"""
        try:
            data = request.get_json()
            print(data)
            if not data:
                return (
                    jsonify({"status": "error", "message": "JSON data is required"}),
                    400,
                )

            chat_name = data.get("name")
            model = data.get("model")

            if not chat_name:
                return (
                    jsonify({"status": "error", "message": "Chat name is required"}),
                    400,
                )

            if not model:
                return jsonify({"status": "error", "message": "Model is required"}), 400

            chat_file = self.chats_dir / f"{chat_name}.json"

            if chat_file.exists():
                return (
                    jsonify(
                        {
                            "status": "error",
                            "message": f"Chat '{chat_name}' already exists",
                        }
                    ),
                    409,
                )

            # Create initial chat structure following /v1/chat/completions format
            chat_data = {
                "model": model,
                "messages": [],
                "temperature": data.get("temperature", 0.7),
                "max_tokens": data.get("max_tokens", -1),
                # "stream": data.get("stream", True),
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
            }

            self._save_chat(chat_name, chat_data)

            return jsonify(
                {
                    "status": "success",
                    "message": f"Chat '{chat_name}' created",
                    "chat": chat_data,
                }
            )
        except Exception as e:
            logger.error(f"Error creating chat: {e}")
            return jsonify({"status": "error", "message": str(e)}), 500

    def update_chat(self):
        """PUT /chat: Add message and stream response from LM Studio"""
        try:
            data = request.get_json()
            if not data:
                return (
                    jsonify({"status": "error", "message": "JSON data is required"}),
                    400,
                )

            chat_name = data.get("name")
            message = data.get("message")

            if not chat_name or not message:
                return (
                    jsonify(
                        {
                            "status": "error",
                            "message": "Chat name and message are required",
                        }
                    ),
                    400,
                )

            chat_file = self.chats_dir / f"{chat_name}.json"

            if not chat_file.exists():
                return (
                    jsonify(
                        {"status": "error", "message": f"Chat '{chat_name}' not found"}
                    ),
                    404,
                )

            # Load existing chat
            with open(chat_file, "r", encoding="utf-8") as f:
                chat_data = json.load(f)

            # Add user message
            user_message = {
                "role": message.get("role", "user"),
                "content": message.get("content", ""),
            }
            chat_data["messages"].append(user_message)

            # Prepare request for LM Studio
            lm_request = {
                "model": chat_data.get("model"),
                "messages": chat_data["messages"],
                "temperature": chat_data.get("temperature"),
                "max_tokens": chat_data.get("max_tokens"),
                "stream": True,
            }

            def generate_stream():
                assistant_content = ""

                try:
                    response = requests.post(
                        f"{self.lm_studio_url}/v1/chat/completions",
                        json=lm_request,
                        headers={"Content-Type": "application/json"},
                        stream=True,
                    )

                    if response.status_code != 200:
                        yield f"data: {json.dumps({'error': f'LM Studio error: {response.text}'})}\n\n"
                        return

                    for line in response.iter_lines(decode_unicode=True):
                        if line.strip():
                            if line.startswith("data: "):
                                data_content = line[6:]  # Remove 'data: '

                                if data_content == "[DONE]":
                                    yield f"data: [DONE]\n\n"
                                    break

                                try:
                                    chunk_data = json.loads(data_content)
                                    if (
                                        "choices" in chunk_data
                                        and chunk_data["choices"]
                                    ):
                                        delta = chunk_data["choices"][0].get(
                                            "delta", {}
                                        )
                                        if "content" in delta:
                                            assistant_content += delta["content"]

                                    # Forward the chunk to client
                                    yield f"data: {data_content}\n\n"
                                except json.JSONDecodeError:
                                    continue

                    # Add assistant response to chat and save
                    if assistant_content:
                        assistant_message = {
                            "role": "assistant",
                            "content": assistant_content,
                        }
                        chat_data["messages"].append(assistant_message)
                        chat_data["updated_at"] = datetime.now().isoformat()
                        self._save_chat(chat_name, chat_data)

                except Exception as e:
                    logger.error(f"Error communicating with LM Studio: {e}")
                    yield f"data: {json.dumps({'error': str(e)})}\n\n"

            return Response(
                stream_with_context(generate_stream()),
                content_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "Access-Control-Allow-Origin": "*",
                },
            )

        except Exception as e:
            logger.error(f"Error updating chat: {e}")
            return jsonify({"status": "error", "message": str(e)}), 500

    def delete_message(self):
        """DELETE /chat/message: Delete a message by index"""
        try:
            data = request.get_json()
            if not data:
                return (
                    jsonify({"status": "error", "message": "JSON data is required"}),
                    400,
                )

            chat_name = data.get("name")
            message_index = data.get("index")

            if not chat_name or message_index is None:
                return (
                    jsonify(
                        {
                            "status": "error",
                            "message": "Chat name and message index are required",
                        }
                    ),
                    400,
                )

            chat_file = self.chats_dir / f"{chat_name}.json"

            if not chat_file.exists():
                return (
                    jsonify(
                        {"status": "error", "message": f"Chat '{chat_name}' not found"}
                    ),
                    404,
                )

            # Load existing chat
            with open(chat_file, "r", encoding="utf-8") as f:
                chat_data = json.load(f)

            if message_index < 0 or message_index >= len(chat_data["messages"]):
                return (
                    jsonify({"status": "error", "message": "Invalid message index"}),
                    400,
                )

            # Remove message
            removed_message = chat_data["messages"].pop(message_index)
            chat_data["updated_at"] = datetime.now().isoformat()

            # Save updated chat
            self._save_chat(chat_name, chat_data)

            return jsonify(
                {
                    "status": "success",
                    "message": f"Message at index {message_index} deleted",
                    "removed_message": removed_message,
                }
            )

        except Exception as e:
            logger.error(f"Error deleting message: {e}")
            return jsonify({"status": "error", "message": str(e)}), 500

    def _save_chat(self, chat_name: str, chat_data: dict):
        """Save chat data to file"""
        chat_file = self.chats_dir / f"{chat_name}.json"
        with open(chat_file, "w", encoding="utf-8") as f:
            json.dump(chat_data, f, indent=2, ensure_ascii=False)


def create_app(
    lm_studio_url: str = "http://localhost:1234", chats_dir: str = "./chats"
):
    """Create and configure the Flask application"""
    app = Flask(__name__)
    CORS(app)  # Enable CORS for all routes

    server = ChatProxyServer(lm_studio_url, chats_dir)

    # Routes
    app.add_url_rule("/chats", "get_chats", server.get_chats, methods=["GET"])
    app.add_url_rule("/chat", "get_chat", server.get_chat, methods=["GET"])
    app.add_url_rule("/chat", "delete_chat", server.delete_chat, methods=["DELETE"])
    app.add_url_rule("/chat", "create_chat", server.create_chat, methods=["POST"])
    app.add_url_rule("/chat", "update_chat", server.update_chat, methods=["PUT"])
    app.add_url_rule(
        "/chat/message", "delete_message", server.delete_message, methods=["DELETE"]
    )

    return app


def main():
    """Main function to run the server"""
    import argparse

    parser = argparse.ArgumentParser(description="LM Studio Chat Proxy Server (Flask)")
    parser.add_argument(
        "--host", default="localhost", help="Host to bind to (default: localhost)"
    )
    parser.add_argument(
        "--port", type=int, default=8080, help="Port to bind to (default: 8080)"
    )
    parser.add_argument(
        "--lm-studio-url",
        default="http://localhost:1234",
        help="LM Studio API URL (default: http://localhost:1234)",
    )
    parser.add_argument(
        "--chats-dir",
        default="./chats",
        help="Directory to store chat files (default: ./chats)",
    )
    parser.add_argument("--debug", action="store_true", help="Enable debug mode")

    args = parser.parse_args()

    app = create_app(args.lm_studio_url, args.chats_dir)

    logger.info(f"Starting Chat Proxy Server on {args.host}:{args.port}")
    logger.info(f"LM Studio URL: {args.lm_studio_url}")
    logger.info(f"Chats directory: {args.chats_dir}")

    app.run(host=args.host, port=args.port, debug=args.debug, threaded=True)


if __name__ == "__main__":
    main()
