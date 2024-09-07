import React, { useState } from 'react';
import { List, ListItem, TextField, Button, IconButton, Typography, Box, Avatar } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import axios from 'axios';

const Discussions = ({ discussions, setDiscussions }) => {
  const [newDiscussion, setNewDiscussion] = useState('');
  const [editingIndex, setEditingIndex] = useState(-1);

  const baseURL = 'http://localhost:5001'; 

  const addDiscussion = async () => {
    if (newDiscussion.trim()) {
      try {
        const response = await axios.post(`${baseURL}/api/discussions`, { content: newDiscussion });
        setDiscussions([...discussions, response.data]);
        setNewDiscussion('');
      } catch (error) {
        console.error('Error adding discussion:', error);
      }
    }
  };

  const updateDiscussion = async (id) => {
    if (newDiscussion.trim()) {
      try {
        const response = await axios.put(`${baseURL}/api/discussions/${id}`, { content: newDiscussion });
        const updatedDiscussions = discussions.map((disc, index) =>
          index === editingIndex ? response.data : disc
        );
        setDiscussions(updatedDiscussions);
        setEditingIndex(-1);
        setNewDiscussion('');
      } catch (error) {
        console.error('Error updating discussion:', error);
      }
    }
  };

  const deleteDiscussion = async (id) => {
    try {
      await axios.delete(`${baseURL}/api/discussions/${id}`);
      setDiscussions(discussions.filter((disc) => disc.id !== id));
    } catch (error) {
      console.error('Error deleting discussion:', error);
    }
  };

  const handleEditClick = (index) => {
    setEditingIndex(index);
    setNewDiscussion(discussions[index].content); 
  };

  return (
    <Box sx={{ mt: 2 }}>
      <TextField
        label="Share your improvement ideas"
        value={newDiscussion}
        onChange={(e) => setNewDiscussion(e.target.value)}
        fullWidth
        variant="outlined"
        sx={{ mb: 2 }}
      />
      {editingIndex === -1 ? (
        <Button variant="contained" color="primary" onClick={addDiscussion} sx={{ mb: 2 }}>
          Add Discussion
        </Button>
      ) : (
        <Button variant="contained" color="secondary" onClick={() => updateDiscussion(discussions[editingIndex].id)} sx={{ mb: 2 }}>
          Update Discussion
        </Button>
      )}

      <List>
        {discussions.map((discussion, index) => (
          <ListItem
            key={discussion.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 2,
              backgroundColor: '#f9f9f9',
              borderRadius: '10px',
              mb: 2,
            }}
          >
            <Avatar alt={discussion.userName} src={`https://randomuser.me/api/portraits/lego/${discussion.user_id}.jpg`} />
            <Box sx={{ flexGrow: 1, ml: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {discussion.content}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {discussion.userName} - {discussion.userRole} &bull; {new Date(discussion.created_at).toLocaleString()}
              </Typography>
            </Box>
            <IconButton onClick={() => handleEditClick(index)}>
              <Edit />
            </IconButton>
            <IconButton onClick={() => deleteDiscussion(discussion.id)}>
              <Delete />
            </IconButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default Discussions;