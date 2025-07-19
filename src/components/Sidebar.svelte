<script lang="ts">
  import { server } from "../config";
  import type { ConversationTitle } from "../api/types";
  import { conversations } from "../stores/conversations";
  import {
    selectedConversation,
    setSelectedConversation,
  } from "../stores/selectedConversation";
  import Create from "./Create.svelte";
  import { InBrowserApi } from "../api/in-browser/InBrowserApi";
  import {
    exportConversations,
    importConversations,
  } from "../api/in-browser/persistence";
  import { editedConversationIndex } from "../stores/editedConversation";

  const isInBrowserApi = server instanceof InBrowserApi;

  const selectChat = async (e: MouseEvent, conv: ConversationTitle) => {
    e.stopPropagation();
    e.preventDefault();
    editedConversationIndex.set(-1);
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

  const exportToJson = async () => {
    const conversations = await exportConversations();

    const blob = new Blob([JSON.stringify(conversations, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-chat-completions-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importFromJson = async (e: Event) => {
    const fileInput = e.currentTarget as HTMLInputElement;
    const file = fileInput.files![0];
    if (!file) {
      console.error("No file selected");
      return;
    }

    try {
      const text = await file.text();
      const records = JSON.parse(text);
      const imported = await importConversations(
        records,
        $conversations.map((conv) => conv.name)
      );
      if (imported < records.length) {
        throw new Error("Not all conversations could be imported");
      }
      console.info("success!");
      conversations.set(await server.loadConversations());
    } catch (error) {
      console.error("Import failed:", error);
    }
  };
</script>

<Create />

<div
  class="uk-background-secondary uk-padding-small uk-width-1-6@m sidebar-container"
>
  <button
    class="uk-button uk-button-primary uk-button-small uk-width-1-1 uk-margin-bottom"
    on:click={showDialog}
  >
    New Chat
  </button>

  {#if isInBrowserApi}
    <div class="uk-flex">
      <button
        class="uk-button uk-button-primary uk-button-small uk-width-1-1 uk-margin-bottom uk-margin-small-right"
        on:click={exportToJson}
        title="Exports the conversations into a json file"
      >
        Export
      </button>
      <label
        for="import-button"
        class="uk-button uk-button-primary uk-button-small uk-width-1-1 uk-margin-bottom uk-margin-small-left"
        title="Imports an export file - new chats will be appended"
      >
        Import
        <input
          type="file"
          id="import-button"
          on:change={importFromJson}
          accept="application/json"
        />
      </label>
    </div>
  {/if}

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
