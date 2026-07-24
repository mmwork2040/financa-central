export const FLOATING_WA_STORAGE_KEY = "floating-wa-hidden";
export const FLOATING_WA_EVENT = "floating-wa-visibility-change";

export const isFloatingWAHidden = (): boolean => {
  try {
    return localStorage.getItem(FLOATING_WA_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};

export const setFloatingWAHidden = (hidden: boolean) => {
  try {
    if (hidden) localStorage.setItem(FLOATING_WA_STORAGE_KEY, "1");
    else localStorage.removeItem(FLOATING_WA_STORAGE_KEY);
    window.dispatchEvent(new Event(FLOATING_WA_EVENT));
  } catch {
    // ignore
  }
};
