import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#538499', 
    },
    secondary: {
      main: '#333333', 
    },
    background: {
      default: '#f5f5f5', 
    },
    text: {
      primary: '#333333', 
      secondary: '#333333', 
    },
  },
  typography: {
    fontFamily: '"Poppins", sans-serif', 
    h1: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#ffffff', 
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 'bold',
      color: '#333333', 
    },
    body1: {
      fontSize: '1rem',
      color: '#333333', 
    },
    button: {
      fontWeight: 'bold',
      textTransform: 'none',
    },
  },
});

export default theme;