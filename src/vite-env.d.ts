/// <reference types="svelte" />
/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_MIDDLEWARE: "local"|"python";
  readonly VITE_LM_STUDIO_URL: string;
  readonly VITE_PYTHON_PROXY_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}