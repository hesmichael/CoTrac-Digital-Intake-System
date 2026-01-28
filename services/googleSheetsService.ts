
import { FormSubmission, StoredSubmission } from '../types';

const DB_NAME = 'CoTracDB';
const STORE_NAME = 'submissions';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = (event: any) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const db = {
  getAll: async (): Promise<StoredSubmission[]> => {
    const idb = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = idb.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const results = request.result as StoredSubmission[];
        resolve(results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      };
      request.onerror = () => reject(request.error);
    });
  },

  save: async (submission: FormSubmission | StoredSubmission): Promise<StoredSubmission> => {
    const idb = await initDB();
    const newRecord: StoredSubmission = 'id' in submission ? submission : {
      ...submission,
      id: Math.random().toString(36).substr(2, 9),
      synced: false
    };
    return new Promise((resolve, reject) => {
      const transaction = idb.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(newRecord);
      request.onsuccess = () => resolve(newRecord);
      request.onerror = () => reject(request.error);
    });
  },

  update: async (id: string, updatedData: any): Promise<void> => {
    const idb = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = idb.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const record = getRequest.result;
        if (record) {
          record.data = { ...record.data, ...updatedData };
          record.synced = false; 
          const putRequest = store.put(record);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error("Record not found"));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  },

  markSynced: async (id: string) => {
    const idb = await initDB();
    const transaction = idb.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const data = getRequest.result;
      if (data) {
        data.synced = true;
        store.put(data);
      }
    };
  },

  /**
   * PURGE OLD RECORDS: Maintenance method now disabled for persistent storage.
   * Logic remains for manual invocation if needed, but returns 0 by default.
   */
  purgeOldRecords: async (): Promise<number> => {
    // Automatic purge is disabled as per business requirements for manual-only clearing.
    return 0;
  },

  clear: async () => {
    const idb = await initDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = idb.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.clear();
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
};

const SCRIPT_URLS = {
  profile: 'https://script.google.com/macros/s/AKfycbyoqO_Z0gBpym7Yx2AA7X9L88-7ME9TZ1kg0za7bVErPkYIt6xLWJF-KbufDfZjr7WT/exec',
  renewal: 'https://script.google.com/macros/s/AKfycbzPeag9jyedpa5BYlS37mxSpSsAMBDRXMey857xzvVmXpyeZ8pOkNmg92kWrPeB706u/exec', 
  service: 'https://script.google.com/macros/s/AKfycbz28BSk26oH2CcMvxe4LvCa9YMjhkDYtJCoE7f84HT5WCLHUT2w7EY2D4lgiwqVAdHo/exec'
};

export const submitToGoogleSheets = async (payload: FormSubmission, recordId?: string): Promise<boolean> => {
  try {
    const targetUrl = SCRIPT_URLS[payload.formType];
    if (!targetUrl) throw new Error(`Invalid form type: ${payload.formType}`);

    await fetch(targetUrl, {
      method: 'POST',
      mode: 'no-cors', 
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        ...payload,
        submittedAt: new Date().toLocaleString() 
      }),
    });

    if (recordId) {
      await db.markSynced(recordId);
    }
    return true;
  } catch (error) {
    console.error('Cloud synchronization failed:', error);
    return false;
  }
};

export const fetchFromGoogleSheets = async (formType: 'profile' | 'renewal' | 'service'): Promise<StoredSubmission[]> => {
  try {
    const targetUrl = SCRIPT_URLS[formType];
    const response = await fetch(targetUrl, { method: 'GET' });
    if (!response.ok) throw new Error('Network response was not ok');
    const cloudData = await response.json();
    
    return cloudData.map((item: any) => ({
      id: item.id || Math.random().toString(36).substr(2, 9),
      formType: formType,
      data: item.data || item,
      timestamp: item.timestamp || new Date().toISOString(),
      synced: true,
      signature: item.signature || ''
    }));
  } catch (error) {
    console.error(`Failed to fetch ${formType} records:`, error);
    return [];
  }
};
