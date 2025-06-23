export type Role = "system" | "assistant" | "user";

export type Message = {
  role: Role;
  content: string;
};

// POST body to send
// https://lmstudio.ai/docs/app/api/endpoints/openai
// https://platform.openai.com/docs/api-reference/chat/create
export type ConversationOptions = {
  temperature: number; // 0.8
  max_tokens: number; // -1
  top_k: number; // 40
  top_p: number; // 0.95
  repeat_penalty: number; // 1.1
};

export type DbConversation = ConversationOptions & {
  id?: number;
  name: string;
  model: string;
  stream: boolean;
  messages: Message[];
};

export type Model = {
  id: string;
  object: string;
  owned_by: string;
};

export type GetModelsResponse = {
  data: Model[];
  object: "list";
};

type ConversationChoice = {
  index: number;
  delta: {
    role: "assistant" | "user";
    content: string;
  };
};

export type PostConversationResponse = {
  id: string;
  choices: ConversationChoice[];
};

export type ConversationTitle = {
  id?: number | undefined;
  name: string;
  model: string;
};
