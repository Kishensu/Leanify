import React, { useState } from 'react';
import { List, ListItem, TextField, Button, Typography, IconButton, Checkbox } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import axios from 'axios';

const MyTasks = ({ tasks, setTasks }) => {
  const [newTask, setNewTask] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [editingIndex, setEditingIndex] = useState(-1);

  const baseURL = 'http://localhost:5001'; 


  const addTask = async () => {
    if (newTask.trim()) {
      try {
        const response = await axios.post(`${baseURL}/api/tasks`, { title: newTask, description: newTaskDescription });
        setTasks([...tasks, response.data]);
        setNewTask(''); 
        setNewTaskDescription('');
      } catch (error) {
        console.error('Error adding task:', error);
      }
    }
  };

 
  const updateTask = async (id) => {
    if (newTask.trim()) {
      try {
        const response = await axios.put(`${baseURL}/api/tasks/${id}`, { title: newTask, description: newTaskDescription });
        const updatedTasks = tasks.map((task, index) =>
          index === editingIndex ? response.data : task
        );
        setTasks(updatedTasks);
        setEditingIndex(-1); 
        setNewTask('');
        setNewTaskDescription('');
      } catch (error) {
        console.error('Error updating task:', error);
      }
    }
  };


  const deleteTask = async (id) => {
    try {
      await axios.delete(`${baseURL}/api/tasks/${id}`);
      setTasks(tasks.filter((task) => task.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  
  const handleEditClick = (index) => {
    setEditingIndex(index);
    setNewTask(tasks[index].title); 
    setNewTaskDescription(tasks[index].description); 
  };


  const toggleTaskCompletion = async (id, completed) => {
    try {
      const response = await axios.put(`${baseURL}/api/tasks/${id}`, { status: completed ? 'completed' : 'pending' });
      setTasks(tasks.map((task) => (task.id === id ? response.data : task)));
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  return (
    <div>

      <TextField
        label="Task Title"
        value={newTask}
        onChange={(e) => setNewTask(e.target.value)}
        fullWidth
        variant="outlined"
        margin="normal"
      />
      <TextField
        label="Task Description"
        value={newTaskDescription}
        onChange={(e) => setNewTaskDescription(e.target.value)}
        fullWidth
        variant="outlined"
        margin="normal"
      />
      {editingIndex === -1 ? (
        <Button variant="contained" color="primary" onClick={addTask} sx={{ mt: 2 }}>
          Add Task
        </Button>
      ) : (
        <Button variant="contained" color="secondary" onClick={() => updateTask(tasks[editingIndex].id)} sx={{ mt: 2 }}>
          Update Task
        </Button>
      )}


      <List>
        {tasks.map((task, index) => (
          <ListItem key={task.id}>
            <Checkbox
              checked={task.status === 'completed'}
              onChange={() => toggleTaskCompletion(task.id, task.status !== 'completed')}
            />
            <Typography variant="body1">{task.title}</Typography> 
            <Typography variant="body2" color="textSecondary">{task.description}</Typography> 
            <IconButton onClick={() => handleEditClick(index)}>
              <Edit />
            </IconButton>
            <IconButton onClick={() => deleteTask(task.id)}>
              <Delete />
            </IconButton>
          </ListItem>
        ))}
      </List>
    </div>
  );
};

export default MyTasks;