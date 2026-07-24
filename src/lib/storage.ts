/**
 * Centralized localStorage management for Nx Studio
 * Single namespace prefix for organized data storage
 */

const NAMESPACE = "nx-studio";

type StorageKey =
  | "projects"
  | "activeProject"
  | "workspace"
  | "project"
  | "builder"
  | "protocols"
  | "profile";

function getKey(key: StorageKey): string {
  return `${NAMESPACE}:${key}`;
}

/**
 * Get a value from localStorage with type safety
 */
export function getStoredValue<T>(key: StorageKey, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  
  try {
    const stored = localStorage.getItem(getKey(key));
    if (!stored) return defaultValue;
    return JSON.parse(stored) as T;
  } catch (e) {
    console.error(`[Storage] Failed to parse ${key}:`, e);
    return defaultValue;
  }
}

/**
 * Set a value in localStorage
 */
export function setStoredValue<T>(key: StorageKey, value: T): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(getKey(key), JSON.stringify(value));
  } catch (e) {
    console.error(`[Storage] Failed to save ${key}:`, e);
  }
}

/**
 * Remove a value from localStorage
 */
export function removeStoredValue(key: StorageKey): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getKey(key));
}

/**
 * Clear all Nx Studio data from localStorage
 */
export function clearAllStorage(): void {
  if (typeof window === "undefined") return;
  
  const keys: StorageKey[] = ["project", "builder", "protocols", "profile"];
  keys.forEach((key) => localStorage.removeItem(getKey(key)));
}

/**
 * Migrate old storage keys to new namespace
 * Call this once on app initialization
 */
export function migrateOldStorage(): void {
  if (typeof window === "undefined") return;
  
  const migrations: Record<string, StorageKey> = {
    "nx-studio-project": "project",
    "nx-studio-builder": "builder",
    "nx-studio-saved-protocols": "protocols",
    "nx-studio-profile": "profile",
  };
  
  Object.entries(migrations).forEach(([oldKey, newKey]) => {
    const oldValue = localStorage.getItem(oldKey);
    if (oldValue) {
      localStorage.setItem(getKey(newKey), oldValue);
      localStorage.removeItem(oldKey);
    }
  });
}
