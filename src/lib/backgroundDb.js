const DATABASE_NAME = 'searchall-preferences';
const DATABASE_VERSION = 1;
const STORE_NAME = 'assets';
const BACKGROUND_KEY = 'custom-background';
const PREFERENCES_KEY = 'user-preferences';

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function runTransaction(mode, action) {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = action(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

export function getBackground() {
  return runTransaction('readonly', (store) => store.get(BACKGROUND_KEY));
}

export function saveBackground(file) {
  return runTransaction('readwrite', (store) => store.put({
    blob: file,
    name: file.name,
    type: file.type,
    updatedAt: Date.now()
  }, BACKGROUND_KEY));
}

export function removeBackground() {
  return runTransaction('readwrite', (store) => store.delete(BACKGROUND_KEY));
}

export function getPreferencesBackup() {
  return runTransaction('readonly', (store) => store.get(PREFERENCES_KEY));
}

export function savePreferencesBackup(preferences) {
  return runTransaction('readwrite', (store) => store.put({
    preferences,
    savedAt: Number(preferences.savedAt) || Date.now()
  }, PREFERENCES_KEY));
}
