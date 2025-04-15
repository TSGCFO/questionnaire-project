import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

const Header = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Box 
          component="img"
          sx={{ height: 40, mr: 2 }}
          alt="TSG Logo"
          src="/vite.svg" // Replace with your company logo
        />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          TSG Questionnaire Submission
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Header;