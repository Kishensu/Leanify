import React, { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, CircularProgress } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './LoginButton.scss'; 

const LoginButton = () => {
  const [open, setOpen] = useState(false); 
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState(''); 
  const [error, setError] = useState(null); 
  const [loading, setLoading] = useState(false); 
  const navigate = useNavigate(); 


  const handleClickOpen = () => {
    setOpen(true);
  };


  const handleClose = () => {
    setOpen(false);
    setError(null); 
  };


  const handleSubmit = async () => {
    setLoading(true); 
    try {
      const response = await axios.post('http://localhost:5001/api/auth/login', {
        email,
        password
      });

      
      const { token } = response.data;
      localStorage.setItem('token', token); 

      navigate('/home'); 
      setLoading(false); 
      handleClose(); 
    } catch (error) {
      setError('Invalid credentials. Please try again.');
      setLoading(false); 
    }
  };

  return (
    <>
      <Button
        variant="contained"
        className="login-button"
        onClick={handleClickOpen} 
        disableElevation 
        sx={{
          backgroundColor: '#fcd34d', 
          color: '#333333',
          textTransform: 'none',
          borderRadius: '20px',
          fontWeight: 'bold',
          '&:hover': {
            backgroundColor: '#fbbf24',
          },
        }}
      >
        Log in
      </Button>

 
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ style: { borderRadius: '20px', padding: '20px' } }}>
        <DialogTitle sx={{ fontSize: '1.8rem', fontWeight: '600', color: '#333333', padding: '10px 20px', textAlign: 'center' }}>
          Welcome back to Leanify!
        </DialogTitle>
        <DialogContent sx={{ padding: '30px', fontFamily: 'Poppins, sans-serif' }}>
          <TextField
            label="Email"
            fullWidth
            margin="dense"
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)} 
            required
            sx={{ marginBottom: '20px' }}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="dense"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)} 
            required
            sx={{ marginBottom: '20px' }}
          />
          {error && <p style={{ color: 'red', fontSize: '1rem', marginBottom: '20px' }}>{error}</p>}
        </DialogContent>
        <DialogActions sx={{ padding: '20px' }}>
          <Button onClick={handleClose} sx={{ color: '#999', fontSize: '1.1rem' }}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              backgroundColor: '#fcd34d',
              color: '#333333',
              padding: '12px 30px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              borderRadius: '25px',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#fbbf24',
              },
              minWidth: '140px', 
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Log in'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LoginButton;