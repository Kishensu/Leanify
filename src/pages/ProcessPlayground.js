import React, { useState } from 'react';
import { Container, TextField, Button, Paper, Typography, Box } from '@mui/material';
import axios from 'axios';

const ProcessPlayground = () => {
  const [userQuery, setUserQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setUserQuery(e.target.value);
  };

  const handleSubmit = async () => {
    if (userQuery.trim() === '') return;

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5001/api/chat', { query: userQuery });
      setResponse(res.data.reply);
    } catch (error) {
      console.error('Error fetching AI response:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h2" gutterBottom>
          Process Playground
        </Typography>
        <Typography variant="body1" gutterBottom>
          Ask anything about your processes, and AI will reply based on the data stored in the system.
        </Typography>

        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
          <TextField
            label="Enter your query"
            variant="outlined"
            fullWidth
            multiline
            rows={4}
            value={userQuery}
            onChange={handleInputChange}
          />
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Fetching response...' : 'Submit'}
          </Button>

          {response && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" gutterBottom>
                AI Response:
              </Typography>
              <Paper elevation={3} sx={{ p: 3, backgroundColor: '#f4f4f4' }}>
                <Typography variant="body1">{response}</Typography>
              </Paper>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default ProcessPlayground;