import { Button } from '@mui/material';
import './SignupButton.scss'; 

const SignupButton = () => {
  return (
    <Button
      variant="contained"
      className="signup-button"
      disableElevation 
      sx={{
        backgroundColor: '#000000',
        color: '#ffffff',
        textTransform: 'none',
        borderRadius: '20px',
        fontWeight: 'bold',
        '&:hover': {
          backgroundColor: '#333333',
        },
      }}
    >
      Sign up
    </Button>
  );
};

export default SignupButton;