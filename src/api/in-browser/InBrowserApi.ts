import { BaseApi } from "../BaseApi";
import type { DbConversation, GetModelsResponse } from "../types";

import {
  loadConversations,
  loadConversation,
  createConversation,
  deleteConversation,
  updateConversation,
} from "./persistence";

export type InBrowserApiConfig = {
  lmStudioUrl: string;
};

/**
 * Posting directly to LLM Studio's endpoints, persisting into browser's indexedDB
 */
export class InBrowserApi extends BaseApi {
  private config: InBrowserApiConfig;
  constructor(config: InBrowserApiConfig) {
    super();
    this.config = config;
  }

  loadConversations = loadConversations;

  loadConversation = loadConversation;

  createConversation = createConversation;

  updateConversation = updateConversation;

  deleteConversation = deleteConversation;

  sendPrompt = async (
    dbConversation: DbConversation,
    abortSignal: AbortSignal
  ) => {
    const conversation = { ...dbConversation };
    delete conversation.id;
    delete (conversation as any).name;

    return fetch(`${this.config.lmStudioUrl}/chat/completions`, {
      method: "POST",
      mode: "cors",
      body: JSON.stringify(conversation),
      headers: {
        "Content-Type": "application/json",
      },
      signal: abortSignal,
    });
  };

  getModels = async () => {
    const response: GetModelsResponse = await (
      await fetch(`${this.config.lmStudioUrl}/models`, {
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
      })
    ).json();
    return response.data.map((item) => item.id);
  };
}
