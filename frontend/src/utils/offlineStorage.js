// src/utils/offlineStorage.js
import localforage from 'localforage';

// Configure localForage
localforage.config({
  name: 'EdirConnect',
  storeName: 'edir_data',
});

// Save data to IndexedDB
export const saveData = async (key, data) => {
  try {
    await localforage.setItem(key, data);
    console.log(`Data saved locally: ${key}`);
  } catch (error) {
    console.error('Error saving data locally:', error);
  }
};

// Retrieve data from IndexedDB
export const getData = async (key) => {
  try {
    const data = await localforage.getItem(key);
    return data || null;
  } catch (error) {
    console.error('Error retrieving data locally:', error);
    return null;
  }
};

// Clear data from IndexedDB
export const clearData = async (key) => {
  try {
    await localforage.removeItem(key);
    console.log(`Data cleared: ${key}`);
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};

// Add a pending operation to the queue
export const addPendingOperation = async (operation) => {
  try {
    const pendingOperations = (await getData('pendingOperations')) || [];
    pendingOperations.push(operation);
    await saveData('pendingOperations', pendingOperations);
    console.log('Pending operation added:', operation);
  } catch (error) {
    console.error('Error adding pending operation:', error);
  }
};

// Retrieve all pending operations
export const getPendingOperations = async () => {
  try {
    const pendingOperations = (await getData('pendingOperations')) || [];
    return pendingOperations;
  } catch (error) {
    console.error('Error retrieving pending operations:', error);
    return [];
  }
};

// Clear all pending operations
export const clearPendingOperations = async () => {
  try {
    await clearData('pendingOperations');
    console.log('Pending operations cleared.');
  } catch (error) {
    console.error('Error clearing pending operations:', error);
  }
};