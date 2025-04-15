const STORAGE_KEY = 'questionnaire_pending_submissions';

/**
 * Saves a submission to local storage for later processing when online
 * @param {Object} submissionData - The questionnaire data and email to be submitted
 * @returns {number} - The ID of the newly saved submission
 */
export const saveOfflineSubmission = (submissionData) => {
  // Get existing submissions from storage
  const submissions = getPendingSubmissions();
  
  // Create a new submission object with unique ID and timestamp
  const newSubmission = {
    id: Date.now(), // Using timestamp as unique ID
    data: submissionData,
    timestamp: new Date().toISOString(),
    attempts: 0 // Track retry attempts
  };
  
  // Add to the list and save back to storage
  submissions.push(newSubmission);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
  
  return newSubmission.id;
};

/**
 * Retrieves all pending submissions that need to be sent
 * @returns {Array} - Array of pending submission objects
 */
export const getPendingSubmissions = () => {
  try {
    // Get data from localStorage or initialize empty array if none exists
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error retrieving pending submissions:', error);
    return [];
  }
};

/**
 * Removes a submission from the pending queue after successful submission
 * @param {number} submissionId - The ID of the submission to remove
 * @returns {boolean} - Success status
 */
export const removeSubmission = (submissionId) => {
  try {
    const submissions = getPendingSubmissions();
    const filteredSubmissions = submissions.filter(
      submission => submission.id !== submissionId
    );
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredSubmissions));
    return true;
  } catch (error) {
    console.error('Error removing submission:', error);
    return false;
  }
};

/**
 * Updates a submission's retry attempt count
 * @param {number} submissionId - The ID of the submission to update
 * @returns {boolean} - Success status
 */
export const incrementSubmissionAttempt = (submissionId) => {
  try {
    const submissions = getPendingSubmissions();
    const updatedSubmissions = submissions.map(submission => {
      if (submission.id === submissionId) {
        return {
          ...submission,
          attempts: submission.attempts + 1
        };
      }
      return submission;
    });
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSubmissions));
    return true;
  } catch (error) {
    console.error('Error updating submission attempt:', error);
    return false;
  }
};

/**
 * Checks if there are any pending submissions
 * @returns {boolean} - True if there are pending submissions
 */
export const hasPendingSubmissions = () => {
  return getPendingSubmissions().length > 0;
};