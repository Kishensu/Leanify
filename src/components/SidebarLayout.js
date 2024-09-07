import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import HomePage from '../pages/HomePage';
import ProcessForm from '../pages/ProcessForm';
import ProcessDashboard from '../pages/ProcessDashboard';
import ProcessRepository from '../pages/ProcessRepository';
import ProcessImprovementTraining from '../pages/ProcessImprovementTraining';
import ProcessPlayground from '../pages/ProcessPlayground';
import Sidebar from './Sidebar';
import Header from './Header';

const SidebarLayout = () => {
  const location = useLocation(); 

  
  const hideSidebarRoutes = ['/'];

  return (
    <>
      <Header />
      <Box display="flex">
        
        {!hideSidebarRoutes.includes(location.pathname) && <Sidebar />}
        <Box component="main" sx={{ flexGrow: 1, padding: '20px', marginTop: '80px' }}>
          <Routes>
            <Route path="/home" element={<HomePage />} />
            <Route path="/process-form" element={<ProcessForm />} />
            <Route path="/process-dashboard" element={<ProcessDashboard />} />
            <Route path="/process-repository" element={<ProcessRepository />} />
            <Route path="/process-improvement-training" element={<ProcessImprovementTraining />} />
            <Route path="/process-playground" element={<ProcessPlayground />} />
          </Routes>
        </Box>
      </Box>
    </>
  );
};

export default SidebarLayout;