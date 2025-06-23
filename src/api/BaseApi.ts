import type {
  ConversationOptions,
  ConversationTitle,
  DbConversation,
  PostConversationResponse,
} from "./types";

const streamer = async (
  reader: ReadableStreamDefaultReader<string>,
  chunkHandler: (chunk: string) => void,
  resolve: (finalAnswer: string) => Promise<void>,
  reject: (reason?: any) => void
) => {
  let appendedChunks = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        resolve(appendedChunks);
        break;
      }

      // value consists of lines like: "data: {\"id\": 123, \"choices\":...}"}, separated by random newlines
      // At the end, the last chunk ends with: "data: [DONE]"
      const arr = value.matchAll(/^data: (\{.+)/gm).toArray();
      const chunk = arr
        .map(
          (line) =>
            (JSON.parse(line[1]) as PostConversationResponse).choices[0].delta
              .content
        )
        .join("");

      appendedChunks += chunk;
      chunkHandler(appendedChunks);
    }
  } catch (err) {
    reject(err);
  } finally {
    reader.releaseLock();
  }
};

export abstract class BaseApi {
  constructor() {}

  abstract getModels(): Promise<string[]>;

  abstract loadConversations(): Promise<ConversationTitle[]>;

  abstract loadConversation(id: unknown): Promise<DbConversation>;

  abstract createConversation(name: string, model: string, config: Partial<ConversationOptions>): Promise<unknown>;

  abstract updateConversation(conversation: DbConversation): Promise<unknown>;

  abstract deleteConversation(id: unknown): Promise<unknown>;

  protected abstract sendPrompt(
    dbConversation: DbConversation,
    abortSignal: AbortSignal
  ): Promise<Response>;

  sendPromptAndHandleStream = async (
    dbConversation: DbConversation,
    chunkHandler: (chunk: string) => void,
    onSuccess: () => void,
    onError: (reason: unknown) => void
  ) => {
    const controller = new AbortController();

    const response = await this.sendPrompt(dbConversation, controller.signal);

    if (!response.body) {
      throw new Error("Streaming not supported");
    }

    const reader = response
      .body!.pipeThrough(new TextDecoderStream())
      .getReader();

    setTimeout(() =>
      streamer(
        reader,
        chunkHandler,
        async (finalAnswer: string) => {
          dbConversation.messages.push({
            role: "assistant",
            content: finalAnswer,
          });
          try {
            await this.updateConversation(dbConversation);
            onSuccess();
          } catch (err) {
            onError(err);
          }
        },
        onError
      )
    );

    return () => {
      controller.abort();
    };
  };
}
