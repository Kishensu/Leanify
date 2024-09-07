import { Container, Grid, Button } from '@mui/material';
import Header from '../components/Header';
import SignupButton from '../components/SignupButton'; 
import LoginButton from '../components/LoginButton'; 
import landingPageImage from '../assets/Images/Landing-page-image.png'; 
import './LandingPage.scss'; 

const LandingPage = () => {
  return (
    <div className="landing-page">
      <Header>
        <div className="button-group">
          <LoginButton />
          <SignupButton />
        </div>
      </Header>
      <Container className="landing-page-content">
        <Grid container spacing={4} alignItems="center" justifyContent="center">
          <Grid item xs={12} md={6} className="text-content" sx={{ 
              marginLeft: { xs: '100px', md: '0' },  
              textAlign: { xs: 'center', md: 'left' }  
            }}>
            <h1>Welcome to Leanify</h1>
            <p>
              Cultivating a culture of continuous improvement through Lean Six Sigma methodologies
            </p>
            <Button variant="contained" className="get-started-button">
              Discover Leanify
            </Button>
          </Grid>
          <Grid item xs={12} md={6} className="image-content">
            <img src={landingPageImage} alt="Landing Page Visual" />
          </Grid>
        </Grid>
      </Container>
    </div>
  );
};

export default LandingPage;