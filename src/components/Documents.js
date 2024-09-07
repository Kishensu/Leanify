import React, { useState } from 'react';
import { Button, List, ListItem, IconButton, Typography } from '@mui/material';
import { Delete } from '@mui/icons-material';
import axios from 'axios';

const Documents = ({ documents, setDocuments }) => {
  const [newDocument, setNewDocument] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('document', file);

      try {
        const response = await axios.post('/api/documents', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setDocuments([...documents, response.data]);
        setNewDocument(null); 
      } catch (error) {
        console.error('Error uploading document:', error);
      }
    }
  };

  const deleteDocument = async (id) => {
    try {
      await axios.delete(`/api/documents/${id}`);
      setDocuments(documents.filter((doc) => doc._id !== id));
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  return (
    <div>
      <Button variant="contained" component="label" sx={{ mt: 2 }}>
        Upload Document
        <input type="file" hidden onChange={handleFileUpload} />
      </Button>

      <List>
        {documents.map((document) => (
          <ListItem key={document.id}>
            <Typography>{document.name}</Typography>
            <IconButton onClick={() => deleteDocument(document.id)}>
              <Delete />
            </IconButton>
          </ListItem>
        ))}
      </List>
    </div>
  );
};

export default Documents;