import axios from 'axios';
import { 
  getPendingSubmissions, 
  removeSubmission, 
  incrementSubmissionAttempt 
} from './offlineStorage';

// API endpoint for submissions
const API_URL = 'http://localhost:8000/api/submit/';
const MAX_RETRY_ATTEMPTS = 5;

/**
 * Attempts to send all pending submissions when online
 * @returns {Promise<{success: number, failed: number}>} - Count of successful and failed syncs
 */
export const syncPendingSubmissions = async () => {
  // Only proceed if we're online
  if (!navigator.onLine) {
    console.log('Cannot sync: Device is offline');
    return { success: 0, failed: 0 };
  }

  const submissions = getPendingSubmissions();
  if (submissions.length === 0) {
    return { success: 0, failed: 0 };
  }

  console.log(`Attempting to sync ${submissions.length} pending submissions`);
  
  let successCount = 0;
  let failedCount = 0;

  // Process each submission
  for (const submission of submissions) {
    try {
      // Skip submissions that have exceeded max retry attempts
      if (submission.attempts >= MAX_RETRY_ATTEMPTS) {
        console.warn(`Submission ${submission.id} exceeded max retry attempts. Consider it failed.`);
        failedCount++;
        continue;
      }

      // Try to send the submission
      const response = await axios.post(API_URL, submission.data);
      
      if (response.status === 201 || response.status === 200) {
        // If successful, remove from pending queue
        removeSubmission(submission.id);
        successCount++;
        console.log(`Successfully synced submission ${submission.id}`);
      } else {
        // If unsuccessful but got a response, increment attempt count
        incrementSubmissionAttempt(submission.id);
        failedCount++;
        console.warn(`Failed to sync submission ${submission.id}: Unexpected response`, response);
      }
    } catch (error) {
      // If there was an error (e.g., network error), increment attempt count
      incrementSubmissionAttempt(submission.id);
      failedCount++;
      console.error(`Error syncing submission ${submission.id}:`, error);
    }
  }

  return { success: successCount, failed: failedCount };
};

/**
 * Sets up event listeners to automatically sync when network connectivity returns
 */
export const initializeSyncManager = () => {
  // Sync when we come back online
  window.addEventListener('online', async () => {
    console.log('Device came online. Attempting to sync pending submissions...');
    await syncPendingSubmissions();
  });

  // Also sync when page is loaded/refreshed (if we're online)
  if (navigator.onLine) {
    // Slight delay to ensure app is fully loaded
    setTimeout(async () => {
      await syncPendingSubmissions();
    }, 3000);
  }
};