<script lang="ts">
  import { onDestroy } from "svelte";
  import { markdownToHtml } from "../helpers/markdown";
  import { selectedConversation } from "../stores/selectedConversation";
  import type { Role } from "../api/types";
  import { server } from "../config";
  import { modelsStatus } from "../stores/models";

  let prompt = "";
  let sendAs = "user";
  let tempAnswer = "";
  let promptInput: HTMLTextAreaElement;
  let messagesContainer: HTMLDivElement;
  let aborter: (() => void) | undefined;

  const autoScroll = () => {
    setTimeout(() => {
      messagesContainer.scrollTop = 9999999999;
    }, 100);
  };

  const autoStretchPromptContainer = () => {
    setTimeout(() => {
      promptInput.style.height = "auto";
      promptInput.style.height = promptInput.scrollHeight + "px";
    }, 100);
  };

  const resetPrompt = () => {
    prompt = "";
    sendAs = "user";
    tempAnswer = "thinking...";
    autoScroll();
    autoStretchPromptContainer();
  };

  const onEndStream = (reason?: unknown) => {
    console.info("LLM answering finished, error: ", reason);
    aborter = undefined;
    tempAnswer = "";
  };

  const sendPrompt = async (e: SubmitEvent | KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!$selectedConversation) {
      return;
    }

    // adding user prompt to the active conversation state, still without persistence
    $selectedConversation.messages.push({
      role: sendAs as Role,
      content: prompt,
    });
    selectedConversation.set($selectedConversation);

    resetPrompt();

    aborter = await server.sendPromptAndHandleStream(
      $selectedConversation,
      (chunk) => {
        // handling the stream
        tempAnswer = chunk;
        autoScroll();
      },
      () => {
        // all chunks arrived, final answer persisted
        selectedConversation.set($selectedConversation);
        onEndStream();
      },
      onEndStream
    );

    console.info("LLM answering started");
    return false;
  };

  const deleteMessage = async (e: MouseEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    if ($selectedConversation) {
      $selectedConversation.messages.splice(idx, 1);
      await server.updateConversation($selectedConversation);
      selectedConversation.set($selectedConversation);
      autoScroll();
    }
    return false;
  };

  // things to do on chat selection
  const unsubscribe = selectedConversation.subscribe((state) => {
    if (state) {
      setTimeout(() => {
        promptInput.focus();
        autoScroll();
      }, 100);
    }
  });

  onDestroy(unsubscribe);
</script>

<div class="uk-width-expand@m">
  {#if !$selectedConversation}
    <div class="uk-flex uk-flex-column uk-flex-center uk-flex-middle uk-height-1-1">
      {#if $modelsStatus === "loading"}
        <p>Loading model list...</p>
      {/if}
      {#if $modelsStatus === "loaded"}
        <p>Loaded. Select or create a conversation.</p>
      {/if}
      {#if $modelsStatus === "error"}
        <p class="uk-form-danger">
          Error loading models. Please make sure LM Studio server is running.
        </p>
      {/if}
    </div>
  {/if}
  {#if $selectedConversation}
    <div
      class="uk-card uk-card-small uk-card-default uk-height-1-1 uk-flex uk-flex-column"
    >
      <div
        class="uk-background-secondary uk-padding-small uk-padding-remove-bottom uk-padding-remove-top chat-with-title"
      >
        {$selectedConversation.name} ({$selectedConversation.model})
      </div>

      <div
        class="uk-card-body uk-overflow-auto uk-padding-remove-vertical uk-margin-small-top"
        style="flex: 1"
        bind:this={messagesContainer}
      >
        {#each $selectedConversation.messages as message, idx}
          <div
            class="uk-flex uk-flex-{message.role === 'assistant'
              ? 'left'
              : 'right'} uk-margin-small-bottom"
          >
            <div
              class="chat-message uk-box-shadow-small uk-padding-small chat-message-{message.role}"
            >
              <div class="chat-actions">
                <a href="about:blank" title="Edit" aria-label="Edit"
                  ><i class="fas fa-pen fa-xs"></i></a
                >
                <a
                  href="about:blank"
                  title="Delete"
                  aria-label="Delete"
                  class="uk-margin-small-left"
                  on:click={(e) => deleteMessage(e, idx)}
                  ><i class="fas fa-trash fa-xs"></i></a
                >
              </div>
              <section>
                {@html markdownToHtml(message.content)}
              </section>
            </div>
          </div>
        {/each}
        {#if tempAnswer}
          <div class="uk-flex uk-flex-left uk-margin-small-bottom">
            <div
              class="chat-message uk-box-shadow-small uk-padding-small chat-message-assistant"
            >
              <section>
                {@html markdownToHtml(tempAnswer)}
              </section>
            </div>
          </div>
        {/if}
      </div>

      <div class="uk-card-footer">
        <form
          class="uk-grid uk-grid-small uk-flex-middle"
          on:submit={(e) => sendPrompt(e)}
        >
          <div class="uk-width-expand@s">
            <textarea
              class="uk-textarea"
              placeholder="Type a message..."
              style="overflow: hidden; resize: none;"
              bind:value={prompt}
              bind:this={promptInput}
              on:input={autoStretchPromptContainer}
              on:keyup={(e) => {
                e.preventDefault();
                e.stopPropagation();
                autoStretchPromptContainer();
                if (e.key === "Enter") {
                  sendPrompt(e);
                }
                return false;
              }}
              tabindex="0"
            ></textarea>
          </div>

          <div class="uk-width-auto@s">
            <select class="uk-select" bind:value={sendAs}>
              <option value="user" selected>user</option>
              <option value="assistant">assistant</option>
              <option value="system">system</option>
            </select>
          </div>

          <div class="uk-width-auto@s">
            {#if !!aborter}
              <button
                class="uk-button uk-button-primary"
                type="button"
                on:click={() => aborter && aborter()}
              >
                Abort
              </button>
            {:else}
              <button class="uk-button uk-button-primary" type="submit">
                Send
              </button>
            {/if}
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>
