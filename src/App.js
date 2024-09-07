import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import theme from './components/theme'; 
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import ProcessForm from './pages/ProcessForm';
import ProcessDashboard from './pages/ProcessDashboard';
import ProcessRepository from './pages/ProcessRepository';
import ProcessImprovementTraining from './pages/ProcessImprovementTraining';
import SidebarLayout from './components/SidebarLayout'; 

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/*" element={<SidebarLayout />} /> 
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;