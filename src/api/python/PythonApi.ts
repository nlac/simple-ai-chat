// client for the python proxy
import { BaseApi, type ApiConfig } from "../BaseApi";
import type { ConversationTitle, DbConversation } from "../types";

export type PythonApiConfig = ApiConfig & {
  proxyUrl: string;
};

/**
 * Using python proxy for talking to LM Studio and for persistence
 */
export class PythonApi extends BaseApi {
  protected config: PythonApiConfig;
  constructor(config: PythonApiConfig) {
    super();
    this.config = config;
  }

  private fetchProxy = async (
    method: "POST" | "PUT" | "GET" | "DELETE",
    path: string,
    body?: Record<string, unknown>,
    signal?: AbortSignal
  ) => {
    return fetch(`${this.config.proxyUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      mode: "cors",
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  };

  loadConversations = async () => {
    const response = await this.fetchProxy("GET", "/chats");
    return (await response.json()).chats as ConversationTitle[];
  };

  loadConversation = async (id: unknown) => {
    const response = await this.fetchProxy(
      "GET",
      `/chat?name=${encodeURIComponent(id as string)}`
    );
    return {
      id: id as string,
      name: id as string,
      ...(await response.json()).chat,
    } as DbConversation;
  };

  createConversation = async (name: string, model: string) => {
    await this.fetchProxy("POST", `/chat`, {
      name,
      model,
    });
    return name;
  };

  updateConversation = async (conversation: DbConversation) => {
    // TODO
    return Promise.resolve({} as DbConversation);
  };

  deleteConversation = async (id: unknown) => {
    return await this.fetchProxy(
      "DELETE",
      `/chat?name=${encodeURIComponent(id as string)}`
    );
  };

  sendPrompt = async (
    dbConversation: DbConversation,
    abortSignal: AbortSignal
  ) => {
    return await this.fetchProxy(
      "PUT",
      "/chat",
      {
        name: dbConversation.name,
        message: dbConversation.messages[dbConversation.messages.length - 1],
      },
      abortSignal
    );
  };
}
