import React, { useState } from 'react';
import { List, ListItem, ListItemText, ListItemIcon, IconButton, Drawer } from '@mui/material';
import { Link } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HomeIcon from '@mui/icons-material/Home';
import FormIcon from '@mui/icons-material/Description';
import ProcessIcon from '@mui/icons-material/Assessment';
import RepositoryIcon from '@mui/icons-material/Folder';
import TrainingIcon from '@mui/icons-material/School';
import PlaygroundIcon from '@mui/icons-material/SportsEsports';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import './Sidebar.scss';

const Sidebar = () => {
  const [open, setOpen] = useState(false);

  const toggleSidebar = () => {
    setOpen(!open);
  };

  return (
    <div>
      <IconButton
        className="menu-button"
        onClick={toggleSidebar}
        sx={{ display: { md: 'none' } }} 
      >
        <MenuIcon />
      </IconButton>
      <Drawer
        open={open}
        onClose={toggleSidebar}
        variant="temporary"
        className="sidebar"
        sx={{
          display: { xs: 'block', md: 'none' },
        }}
      >
        <div className="sidebar-content">
          <IconButton onClick={toggleSidebar} className="close-button">
            <CloseIcon />
          </IconButton>
          <List>
            <ListItem button component={Link} to="/home" onClick={toggleSidebar}>
              <ListItemIcon>
                <HomeIcon />
              </ListItemIcon>
              <ListItemText primary="Home" />
            </ListItem>
            <ListItem button component={Link} to="/process-dashboard" onClick={toggleSidebar}>
              <ListItemIcon>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
            <ListItem button component={Link} to="/process-repository" onClick={toggleSidebar}>
              <ListItemIcon>
                <RepositoryIcon />
              </ListItemIcon>
              <ListItemText primary="Process Repository" />
            </ListItem>
            <ListItem button component={Link} to="/process-form" onClick={toggleSidebar}>
              <ListItemIcon>
                <FormIcon />
              </ListItemIcon>
              <ListItemText primary="Process Form" />
            </ListItem>
            <ListItem button component={Link} to="/process-playground" onClick={toggleSidebar}>
              <ListItemIcon>
                <PlaygroundIcon />
              </ListItemIcon>
              <ListItemText primary="Process Playground" />
            </ListItem>
            <ListItem button component={Link} to="/process-improvement-training" onClick={toggleSidebar}>
              <ListItemIcon>
                <TrainingIcon />
              </ListItemIcon>
              <ListItemText primary="Training" />
            </ListItem>
          </List>
        </div>
      </Drawer>
      <div className="sidebar desktop-sidebar">
        <div className="sidebar-content">
          <List>
            <ListItem button component={Link} to="/home">
              <ListItemIcon>
                <HomeIcon />
              </ListItemIcon>
              <ListItemText primary="Home" />
            </ListItem>
            <ListItem button component={Link} to="/process-dashboard">
              <ListItemIcon>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
            <ListItem button component={Link} to="/process-repository">
              <ListItemIcon>
                <RepositoryIcon />
              </ListItemIcon>
              <ListItemText primary="Process Repository" />
            </ListItem>
            <ListItem button component={Link} to="/process-form">
              <ListItemIcon>
                <FormIcon />
              </ListItemIcon>
              <ListItemText primary="Process Form" />
            </ListItem>
            <ListItem button component={Link} to="/process-playground">
              <ListItemIcon>
                <PlaygroundIcon />
              </ListItemIcon>
              <ListItemText primary="Process Playground" />
            </ListItem>
            <ListItem button component={Link} to="/process-improvement-training">
              <ListItemIcon>
                <TrainingIcon />
              </ListItemIcon>
              <ListItemText primary="Training" />
            </ListItem>
          </List>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;