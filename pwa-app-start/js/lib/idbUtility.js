const dbPromise = idb.open('pwa-example', 1, db => {
  if (!db.objectStoreNames.contains('users')) {
    db.createObjectStore('users', { keyPath: 'phone' });
  }
})

function writeData(st, data) {
  return dbPromise.then(db => {
    const tx = db.transaction(st, 'readwrite');
    const store = tx.objectStore(st);
    store.put(data);

    return tx.complete;
  })
}
function clearAllData(st) {
  return dbPromise.then(db => {
    const tx = db.transaction(st, 'readwrite');
    const store = tx.objectStore(st);
    store.clear();

    return tx.complete;
  })
}
function readData(st) {
  return dbPromise.then(db => {
    const tx = db.transaction(st, 'readonly');
    const store = tx.objectStore(st);
    return store.getAll();
  })
}
function deleteItem(st, id) {
  return dbPromise.then(db => {
    const tx = db.transaction(st, 'readwrite');
    const store = tx.objectStore(st);
    store.delete(id);

    return tx.complete;
  })
}