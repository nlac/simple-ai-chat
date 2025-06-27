<script lang="ts">
  import type { ConversationOptions } from "../api/types";
  import { server } from "../config";
  import { conversations } from "../stores/conversations";
  import { models } from "../stores/models";
  import { setSelectedConversation } from "../stores/selectedConversation";

  const defaultConfig: Partial<ConversationOptions> = {
    max_tokens: -1,
    temperature: 0.7,
  };
  let selectedModel = "";
  let selectedName = "";
  let config = { ...defaultConfig };
  let errorMessage = "";
  let createDialog: HTMLDialogElement;

  const closeDialog = () => {
    createDialog.close();
  };
  const onDialogClosed = () => {
    createDialog.style.display = "none";
  };
  const callCreateConversation = async () => {
    if (!selectedName || !selectedModel) {
      errorMessage = "Name and model are mandatory";
      return;
    }
    if (selectedName.length > 80) {
      errorMessage = "Name is too long";
      return;
    }
    try {
      const id = await server.createConversation(
        selectedName,
        selectedModel,
        config
      );
      if (id) {
        conversations.set(await server.loadConversations());
        setSelectedConversation(id);
        selectedName = "";
        errorMessage = "";
        config = { ...defaultConfig };
        closeDialog();
      }
    } catch (err) {
      console.info(err);
      errorMessage = "Failed creating new chat - " + err;
    }
  };
</script>

<dialog
  id="create-conversation"
  class="uk-modal uk-open"
  on:close={onDialogClosed}
  bind:this={createDialog}
>
  <div class="uk-modal-dialog uk-modal-body" role="dialog" aria-modal="true">
    <h2 class="uk-modal-title">New chat</h2>
    <form class="uk-form-stacked">
      <div class="uk-margin">
        <label class="uk-form-label" for="form-stacked-text">Name</label>
        <input
          required
          class="uk-input {!selectedName ||
          $conversations.find((c) => c.name === selectedName)
            ? 'uk-form-danger'
            : ''}"
          type="text"
          placeholder="Type a unique conversation title"
          bind:value={selectedName}
          maxlength="80"
        />
      </div>

      <div class="uk-margin">
        <label class="uk-form-label" for="form-stacked-text">Model</label>
        <select
          required
          class="uk-select {!selectedModel ? 'uk-form-danger' : ''}"
          bind:value={selectedModel}
        >
          <option value="" disabled>Select a model</option>
          {#each $models as model}
            <option>{model}</option>
          {/each}
        </select>
      </div>

      <div class="uk-margin">
        <label class="uk-form-label" for="form-stacked-text">Max tokens</label>
        <input
          class="uk-input"
          type="number"
          min="-1"
          max="2000"
          step="1"
          placeholder="Max number of generated tokens"
          bind:value={config.max_tokens}
        />
      </div>
      <div class="uk-margin">
        <label class="uk-form-label" for="form-stacked-text">Temperature</label>
        <input
          class="uk-input"
          type="number"
          min="0"
          max="1"
          placeholder="Temperature"
          bind:value={config.temperature}
        />
      </div>

      {#if errorMessage}
        <p class="uk-form-danger">{errorMessage}</p>
      {/if}
      <p class="uk-text-right">
        <button
          class="uk-button uk-button-default uk-modal-close uk-margin-small-right"
          type="button"
          on:click={closeDialog}>Cancel</button
        >
        <button
          class="uk-button uk-button-primary"
          type="button"
          on:click={callCreateConversation}>Create</button
        >
      </p>
    </form>
  </div>
</dialog>
