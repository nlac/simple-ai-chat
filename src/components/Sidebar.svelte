<script lang="ts">
  import { server } from "../config";
  import type { ConversationTitle } from "../api/types";
  import { conversations } from "../stores/conversations";
  import {
    selectedConversation,
    setSelectedConversation,
  } from "../stores/selectedConversation";
  import Create from "./Create.svelte";

  const selectChat = async (e: MouseEvent, conv: ConversationTitle) => {
    e.stopPropagation();
    e.preventDefault();
    await setSelectedConversation(conv.id as number);
    return false;
  };

  const deleteChat = async (e: MouseEvent, conv: ConversationTitle) => {
    e.stopPropagation();
    e.preventDefault();
    if ($selectedConversation?.id === conv.id) {
      selectedConversation.set(undefined);
    }
    await server.deleteConversation(conv.id);
    conversations.set(await server.loadConversations());
    return false;
  };

  const showDialog = () => {
    const createDialog = document.querySelector(
      "#create-conversation"
    ) as HTMLDialogElement;
    if (createDialog) {
      createDialog.showModal();
      createDialog.style.display = "block";
      createDialog.querySelector("input")!.focus();
    }
  };
</script>

<Create />

<div
  class="uk-background-secondary uk-padding-small uk-width-1-6@m sidebar-container"
>
  <button
    class="uk-button uk-button-primary uk-width-1-1 uk-margin-bottom"
    on:click={showDialog}
  >
    New Chat
  </button>

  <hr class="uk-padding-remove uk-margin-remove" />

  <ul class="uk-list uk-list-collapse uk-margin-small-top chat-history">
    {#each $conversations as conversation}
      <li class={$selectedConversation?.id === conversation.id ? "active" : ""}>
        <a href="about:blank" on:click={(e) => selectChat(e, conversation)}
          >{conversation.name} ({conversation.model})</a
        >
        <div class="chat-actions">
          <a
            href="about:blank"
            on:click={(e) => deleteChat(e, conversation)}
            title="Delete"
            aria-label="Delete"
            class="uk-margin-small-left"
          >
            <i class="fas fa-trash fa-xs"></i>
          </a>
        </div>
      </li>
    {/each}
  </ul>
</div>
