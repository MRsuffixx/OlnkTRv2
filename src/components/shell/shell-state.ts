const SIDEBAR_STATE_VERSION = 1;
const SIDEBAR_STORAGE_KEY = "olnk:ui:sidebar";
const SIDEBAR_CHANGE_EVENT = "olnk:sidebar-change";

export function serializeSidebarPreference(collapsed: boolean) {
  return JSON.stringify({ version: SIDEBAR_STATE_VERSION, collapsed });
}

export function parseSidebarPreference(value: string | null) {
  if (!value) return false;
  try {
    const parsed = JSON.parse(value) as { version?: unknown; collapsed?: unknown };
    return parsed.version === SIDEBAR_STATE_VERSION && parsed.collapsed === true;
  } catch {
    return false;
  }
}

export function getSidebarPreference() {
  return parseSidebarPreference(window.localStorage.getItem(SIDEBAR_STORAGE_KEY));
}

export function getServerSidebarPreference() {
  return false;
}

export function setSidebarPreference(collapsed: boolean) {
  window.localStorage.setItem(SIDEBAR_STORAGE_KEY, serializeSidebarPreference(collapsed));
  window.dispatchEvent(new Event(SIDEBAR_CHANGE_EVENT));
}

export function subscribeSidebarPreference(onChange: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key === SIDEBAR_STORAGE_KEY) onChange();
  }
  window.addEventListener("storage", onStorage);
  window.addEventListener(SIDEBAR_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(SIDEBAR_CHANGE_EVENT, onChange);
  };
}
