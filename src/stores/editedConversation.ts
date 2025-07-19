import { writable } from "svelte/store";

export const editedConversationIndex = writable<number>(-1);
