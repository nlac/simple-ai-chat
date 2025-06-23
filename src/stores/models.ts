import { writable } from "svelte/store";
import { server } from "../config";

export const models = writable<string[]>([]);
export const modelsStatus = writable<"loading" | "loaded" | "error">();

(async () => {
  modelsStatus.set("loading");
  try {
    models.set(await server.getModels());
    modelsStatus.set("loaded");
  } catch (err) {
    console.info("lm studio error", err);
    modelsStatus.set("error");
  }
})();
