import { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  TextField, 
  CircularProgress, 
  Alert, 
  Card,
  CardContent
} from '@mui/material';
import axios from 'axios';
import { saveOfflineSubmission } from '../utils/offlineStorage';

// API endpoint - update this to match your Django backend URL
const API_URL = 'http://localhost:8000/api/submit/';

const QuestionnaireImporter = () => {
  // State management
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [data, setData] = useState(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ show: false, text: '', severity: 'info' });
  
  /**
   * Handles file selection and Excel parsing
   */
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFileName(selectedFile.name);
      setFile(selectedFile);
      
      // Create a FileReader to read the Excel file
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const binaryData = e.target.result;
          
          // Try parsing with more options for better compatibility
          const workbook = XLSX.read(binaryData, { 
            type: 'binary',
            cellDates: true,
            cellNF: false,
            cellText: true
          });
          
          // Get first worksheet
          const wsname = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[wsname];
          
          // Convert to JSON with headers
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '',
            blankrows: false
          });
          
          // Process the data using our improved function
          const formattedData = processExcelData(jsonData);
          
          setData(formattedData);
          showMessage('File imported successfully!', 'success');
        } catch (error) {
          console.error('Error processing Excel file:', error);
          showMessage('Error processing file. Is this a valid Excel questionnaire?', 'error');
        }
      };
      
      reader.onerror = () => {
        showMessage('Error reading file', 'error');
      };
      
      reader.readAsBinaryString(selectedFile);
    }
  };

  /**
   * Processes raw Excel data into a structured format with questions and answers
   */
  const processExcelData = (rawData) => {
    // Skip empty rows
    const nonEmptyRows = rawData.filter(row => {
      if (!Array.isArray(row)) return false;
      return row.some(cell => cell !== null && cell !== '');
    });
    
    if (nonEmptyRows.length === 0) {
      return [];
    }
    
    // For questionnaire format, identify which columns contain questions and answers
    let questionIndex = 0;  // Default to first column for questions
    let answerIndex = 1;    // Default to second column for answers
    
    // Check if we need to adjust column indices based on content
    if (nonEmptyRows.length > 0 && nonEmptyRows[0].length > 2) {
      // Examine the first few rows to detect question/answer columns
      for (let col = 0; col < nonEmptyRows[0].length; col++) {
        // If we find a column header that suggests questions, use it
        if (nonEmptyRows[0][col] && 
            typeof nonEmptyRows[0][col] === 'string' &&
            (nonEmptyRows[0][col].toLowerCase().includes('question') || 
             nonEmptyRows[0][col].toLowerCase().includes('pick pack ship'))) {
          questionIndex = col;
          // Assume answer is in the next column
          answerIndex = col + 1;
          break;
        }
      }
    }
    
    const formattedData = [];
    
    // Process as a questionnaire
    for (let i = 0; i < nonEmptyRows.length; i++) {
      const row = nonEmptyRows[i];
      
      // Skip if row doesn't have enough columns
      if (row.length <= questionIndex) continue;
      
      const question = row[questionIndex];
      // Check if this row has an answer column
      const answer = row.length > answerIndex ? row[answerIndex] : '';
      
      // Only add rows with valid questions
      if (question && typeof question === 'string' && question.trim()) {
        formattedData.push({
          question: question.trim(),
          answer: typeof answer === 'string' ? answer.trim() : answer
        });
      }
    }
    
    return formattedData;
  };
  
  /**
   * Displays a message to the user
   */
  const showMessage = (text, severity = 'info') => {
    setMessage({
      show: true,
      text,
      severity
    });
    
    // Auto-hide success and info messages after 5 seconds
    if (severity !== 'error') {
      setTimeout(() => {
        setMessage(prev => ({ ...prev, show: false }));
      }, 5000);
    }
  };
  
  /**
   * Handles form submission - sends data and file to API or stores for offline use
   */
  const handleSubmit = async () => {
    // Validate form
    if (!data) {
      showMessage('Please import a questionnaire file first', 'warning');
      return;
    }
    
    if (!email || !email.includes('@')) {
      showMessage('Please provide a valid email address', 'warning');
      return;
    }
    
    setLoading(true);
    
    try {
      if (navigator.onLine) {
        // Use FormData to handle file uploads - this is a special object 
        // designed for sending forms with files through HTTP requests
        const formData = new FormData();
        
        // Add the email and questionnaire data to the form
        formData.append('email', email);
        
        // Convert the JSON data to a string since FormData expects string or Blob values
        formData.append('questionnaire_data', JSON.stringify(data));
        
        // Append the original Excel file if available
        if (file) {
          formData.append('file', file);
        }
        
        // Send request with FormData - note the special headers needed for file uploads
        const response = await axios.post(API_URL, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        showMessage('Questionnaire submitted successfully!', 'success');
        clearForm();
      } else {
        // For offline mode, we can't effectively store binary files in localStorage
        // so we'll just save the parsed data and notify the user
        saveOfflineSubmission({
          email: email,
          questionnaire_data: data
        });
        
        showMessage('You are offline. Your submission data has been saved and will be sent when you reconnect. Note: The original Excel file will not be included when submitted offline.', 'info');
        clearForm();
      }
    } catch (error) {
      console.error('Submission error:', error);
      
      // If API request failed, still try to save offline (without the file)
      saveOfflineSubmission({
        email: email,
        questionnaire_data: data
      });
      
      showMessage(`Error submitting questionnaire. Your submission has been saved and will be retried automatically (without the Excel file).`, 'warning');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Clears the form after submission
   */
  const clearForm = () => {
    setFile(null);
    setFileName('');
    setData(null);
    setEmail('');
  };
  
  return (
    <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Questionnaire Submission
      </Typography>
      
      <Typography variant="body1" paragraph>
        Complete your Excel questionnaire, then upload it here to submit.
      </Typography>
      
      {/* File Upload */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          component="label"
          color="primary"
          fullWidth
          size="large"
          sx={{ py: 1.5 }}
        >
          Select Excel Questionnaire
          <input
            type="file"
            hidden
            accept=".xlsx, .xls"
            onChange={handleFileChange}
          />
        </Button>
        
        {fileName && (
          <Typography variant="body2" sx={{ mt: 1, fontWeight: 'medium' }}>
            Selected file: {fileName}
          </Typography>
        )}
      </Box>
      
      {/* Data Preview */}
      {data && (
        <>
          <Typography variant="h6" gutterBottom>
            Questionnaire Preview
          </Typography>
          
          <Card variant="outlined" sx={{ mb: 3, maxHeight: '300px', overflow: 'auto' }}>
            <CardContent>
              <pre style={{ margin: 0 }}>
                {JSON.stringify(data, null, 2)}
              </pre>
            </CardContent>
          </Card>
          
          {/* Email Input */}
          <TextField
            label="Your Email Address"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          
          {/* Submit Button */}
          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={handleSubmit}
            disabled={loading}
            fullWidth
            sx={{ py: 1.5 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Submit Questionnaire'}
          </Button>
        </>
      )}
      
      {/* Status Messages */}
      {message.show && (
        <Box sx={{ mt: 2 }}>
          <Alert severity={message.severity} onClose={() => setMessage(prev => ({ ...prev, show: false }))}>
            {message.text}
          </Alert>
        </Box>
      )}
    </Paper>
  );
};

export default QuestionnaireImporter;