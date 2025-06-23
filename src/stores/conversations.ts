import { writable } from "svelte/store";
import type { ConversationTitle } from "../api/types";
import { server } from "../config";

export const conversations = writable<ConversationTitle[]>([]);

(async () => conversations.set(await server.loadConversations()))();
