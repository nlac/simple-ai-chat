import { writable } from "svelte/store";
import type { DbConversation } from "../api/types";
import { server } from "../config";

export const selectedConversation = writable<DbConversation | undefined>();

export const setSelectedConversation = async (id: unknown) => {
  selectedConversation.set(await server.loadConversation(id));
};
