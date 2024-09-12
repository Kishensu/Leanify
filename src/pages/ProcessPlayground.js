import React, { useState, useEffect, useRef } from 'react';
import { Container, TextField, Button, Paper, Typography, Box, CircularProgress, AppBar, Toolbar, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';

const CustomContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(3),
}));

const CustomPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(3),
}));

const ChatPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: '18px',
  boxShadow: theme.shadows[1],
  maxWidth: '75%',
  wordWrap: 'break-word',
}));

const ProcessPlayground = () => {
  const [userQuery, setUserQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]); 
  const chatContainerRef = useRef(null);

  const handleInputChange = (e) => {
    setUserQuery(e.target.value);
  };

  const handleSubmit = async () => {
    if (userQuery.trim() === '') return;

    setLoading(true);

    const userMessage = { type: 'user', text: userQuery };
    setChatHistory((prev) => [...prev, userMessage]);

    try {
      const res = await axios.post('http://localhost:5001/api/chat', { query: userQuery }, {
        headers: { 'Content-Type': 'application/json' },
      });

      const assistantMessage = {
        type: 'assistant',
        text: res.data.messages[0]?.text?.value || 'Message not available' 
      };

 
      setChatHistory((prev) => [...prev, assistantMessage]);


      setUserQuery('');
    } catch (error) {
      console.error('Error fetching AI response:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  return (
    <CustomContainer>
      <Typography variant="h2" gutterBottom>
        Process Playground
      </Typography>

      <AppBar position="static" sx={{ backgroundColor: 'rgb(83, 132, 153)' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Process Improvement AI Assistant
          </Typography>
        </Toolbar>
      </AppBar>


      <CustomPaper>
        <Box
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            height: '60vh',
            borderRadius: 2,
          }}
          ref={chatContainerRef}
        >

          {chatHistory.map((msg, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: msg.type === 'assistant' ? 'flex-start' : 'flex-end',
              }}
            >
              {msg.type === 'assistant' && (
                <Avatar sx={{ marginRight: 1 }}>AI</Avatar> 
              )}
              <ChatPaper
                sx={{
                  backgroundColor: msg.type === 'assistant' ? '#f0f0f0' : '#d1e7dd',
                  borderRadius: msg.type === 'assistant' ? '18px 18px 18px 0' : '18px 18px 0 18px',
                }}
              >
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </ChatPaper>
              {msg.type === 'user' && (
                <Avatar sx={{ marginLeft: 1 }}>U</Avatar> 
              )}
            </Box>
          ))}
        </Box>


        <Box sx={{ p: 2, borderTop: '1px solid #ddd', backgroundColor: '#fafafa' }}>
          <TextField
            label="Type your query"
            variant="outlined"
            fullWidth
            multiline
            rows={2}
            value={userQuery}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleSubmit}
            disabled={loading || !userQuery.trim()}
          >
            {loading ? <CircularProgress size={24} /> : 'Submit'}
          </Button>
        </Box>
      </CustomPaper>
    </CustomContainer>
  );
};

export default ProcessPlayground;