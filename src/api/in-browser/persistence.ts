// https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB

import type {
  ConversationOptions,
  ConversationTitle,
  DbConversation,
} from "../types";

const DB_NAME = "ai-chat";
const DB_VERSION = 1;
const DB_STORE = "completions";

let db: IDBDatabase | undefined;
const openDb = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      db = undefined;
      console.error(
        `indexeddb store ${DB_NAME}-${DB_STORE} couldn't be created`
      );
      reject(request.error);
    };
    request.onsuccess = () => {
      db = request.result;
      console.info(`indexeddb store ${DB_NAME}-${DB_STORE} is ready`);
      resolve(db);
    };
    request.onupgradeneeded = (event) => {
      const db = (event?.target as any)?.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        const store = db.createObjectStore(DB_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("name", "name", { unique: true });
      }
    };
  });
};

// adjust it if needed
const newConversationRecord = (
  name: string,
  model: string,
  config: Partial<ConversationOptions>
) => {
  return {
    name,
    model,
    max_tokens: -1,
    temperature: 0.85,
    top_k: 40,
    top_p: 0.95,
    repeat_penalty: 1.1,
    stream: true,
    messages: [],
    ...config,
  } as DbConversation;
};

const indexedDbRequest = async <T>(
  writable: boolean,
  getRequest: (store: IDBObjectStore) => IDBRequest<T>,
  onSuccess?: (
    resolve: (value: T | PromiseLike<T>) => void,
    request: IDBRequest<T>
  ) => void,
  onError?: (reject: (reason?: any) => void) => void
) => {
  const db = await openDb();
  const store = db
    .transaction([DB_STORE], writable ? "readwrite" : "readwrite")
    .objectStore(DB_STORE);

  return new Promise<T>((resolve, reject) => {
    const request = getRequest(store);
    if (request) {
      request.onsuccess = () =>
        onSuccess ? onSuccess(resolve, request) : resolve(request.result);
      request.onerror = () =>
        onError ? onError(reject) : reject(request.error);
    } else {
      reject(new Error("indexeddb error: couldn't create request"));
    }
  });
};

export const createConversation = async (
  name: string,
  model: string,
  config: Partial<ConversationOptions>
) =>
  indexedDbRequest(true, (store) =>
    store.add(newConversationRecord(name, model, config))
  );

export const loadConversations = async () =>
  indexedDbRequest<ConversationTitle[]>(
    false,
    (store) => store.getAll(),
    (resolve, request) => {
      resolve(
        request.result.map((item) => ({
          id: item.id,
          name: item.name,
          model: item.model,
        }))
      );
    }
  );

export const loadConversation = async (id: unknown) =>
  indexedDbRequest<DbConversation>(false, (store) => store.get(id as number));

export const updateConversation = async (conversation: DbConversation) =>
  indexedDbRequest(true, (store) => store.put(conversation));

export const deleteConversation = async (id: unknown) =>
  indexedDbRequest(true, (store) => store.delete(id as number));

export const exportConversations = async () =>
  indexedDbRequest<DbConversation[]>(
    false,
    (store) => store.getAll(),
    (resolve, request) => {
      resolve(request.result);
    }
  );

export const importConversations = async (
  conversations: DbConversation[],
  existingConversationTitles: string[]
) => {
  const db = await openDb();
  const transaction = db.transaction([DB_STORE], "readwrite");
  const store = transaction.objectStore(DB_STORE);

  let imported = 0;
  let resolve: (value: number | PromiseLike<number>) => void;
  let reject: (reason?: any) => void;
  const result = new Promise<number>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  transaction.oncomplete = (e: Event) => {
    return resolve(imported);
  };

  for (const conv of conversations) {
    const clone = { ...conv };
    delete clone.id;

    while (existingConversationTitles.find((name) => name === clone.name)) {
      clone.name += "1";
    }

    const request = store.add(clone);

    request.onsuccess = () => {
      existingConversationTitles.push(clone.name);
      imported++;
    };
    request.onerror = () => {
      console.error("import error: ", transaction.error, "conversation:", conv);
    };
  }

  return result;
};
