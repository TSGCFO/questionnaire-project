import { useState, useEffect } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Header from './components/Header'
import QuestionnaireImporter from './components/QuestionnaireImporter'
import NetworkStatus from './components/NetworkStatus'
import { initializeSyncManager } from './utils/syncManager'

// Create a custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
	// Initialize sync manager when app loads
	useEffect(() => {
		initializeSyncManager();
	}, []);
	
	return (
		<ThemeProvider theme={theme}>
		  <CssBaseline />
		  <Box sx={{ 
			display: 'flex', 
			flexDirection: 'column', 
			minHeight: '100vh',
			bgcolor: '#f5f5f5'
		  }}>
			<Header />
			<Container component="main" sx={{ mt: 4, mb: 4, flex: 1 }}>
			  <NetworkStatus />
			  <QuestionnaireImporter />
			</Container>
			<Box 
			  component="footer" 
			  sx={{ 
				py: 3, 
				px: 2,
				mt: 'auto',
				backgroundColor: (theme) => theme.palette.grey[200]
			  }}
			>
			  <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
				<p>© {new Date().getFullYear()} TSG Fulfillment. All rights reserved.</p>
			  </Container>
			</Box>
		  </Box>
		</ThemeProvider>
	)
}

export default App