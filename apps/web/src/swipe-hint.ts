const HINT_KEY = "swipe-hint-seen";

type Storage = () => Pick<globalThis.Storage, "getItem" | "setItem">;

export const hintSeen = (storage: Storage = () => localStorage) => {
  try {
    return storage().getItem(HINT_KEY) !== null;
  } catch {
    return false;
  }
};

export const rememberHint = (storage: Storage = () => localStorage) => {
  try {
    storage().setItem(HINT_KEY, "1");
  } catch {
    // The hint shows again next time; nothing else depends on it.
  }
};
