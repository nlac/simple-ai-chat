<script lang="ts">
  import Chat from "./components/Chat.svelte";
  import Sidebar from "./components/Sidebar.svelte";
</script>

<div class="uk-container-expand uk-height-viewport">
  <div class="uk-grid uk-grid-collapse uk-child-width-1-4@m chat-container">
    <Sidebar/>
    <Chat/>
  </div>
</div>
