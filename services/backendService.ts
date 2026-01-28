import { FormSubmission, StoredSubmission } from '../types';
import { db, submitToGoogleSheets } from './googleSheetsService';

/**
 * Professional Backend Interface
 * This coordinates local-first storage with the Google Sheets cloud provider.
 */

export const backendService = {
  // Save to device IndexedDB
  saveRecord: async (submission: FormSubmission): Promise<StoredSubmission> => {
    return await db.save(submission);
  },

  // Retrieve from device IndexedDB
  getLocalRecords: async (): Promise<StoredSubmission[]> => {
    return await db.getAll();
  },

  // Update an existing record
  updateRecord: async (id: string, data: any): Promise<void> => {
    await db.update(id, data);
  },

  // Sync a single record to Google Sheets
  syncToCloud: async (submission: StoredSubmission): Promise<boolean> => {
    try {
      // Create a clean payload for the Cloud
      const payload: FormSubmission = {
        formType: submission.formType,
        data: submission.data,
        timestamp: submission.timestamp,
        signature: submission.signature || '',
        photos: submission.photos
      };

      const success = await submitToGoogleSheets(payload, submission.id);
      return success;
    } catch (error) {
      console.error("Cloud Sync Error:", error);
      return false;
    }
  },

  // Purge local device storage
  clearLocalData: async () => {
    await db.clear();
  }
};