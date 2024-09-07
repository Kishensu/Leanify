import React, { useEffect, useState } from 'react';
import { Container, Grid, Card, CardContent, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import TeamMembers from '../components/TeamMembers';
import Discussions from '../components/Discussions';
import MyTasks from '../components/MyTasks';
import Documents from '../components/Documents';
import TeamOverview from '../components/TeamOverview';
import axios from 'axios';

const CustomContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(3),
  minHeight: '100vh',
}));

const HomePage = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token'); 
        const config = {
          headers: {
            Authorization: token ? `Bearer ${token}` : '', 
          },
        };
  
        const baseURL = 'http://localhost:5001'; 
        const response = await axios.get(`${baseURL}/api/home`, config); 
  
        
        const { teamMembers, discussions, tasks, documents } = response.data;
  
        setTeamMembers(teamMembers);
        setDiscussions(discussions);
        setTasks(tasks);
        setDocuments(documents);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
  
    fetchData();
  }, []);

  return (
    <CustomContainer>
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
            <Typography variant="h2" gutterBottom>
                Team Members
              </Typography>
              <TeamMembers teamMembers={teamMembers} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h2" gutterBottom>
                Discussions
              </Typography>
              <Discussions discussions={discussions} setDiscussions={setDiscussions} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h2" gutterBottom>
                My Tasks
              </Typography>
              <MyTasks tasks={tasks} setTasks={setTasks} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h2" gutterBottom>
                Documents
              </Typography>
              <Documents documents={documents} setDocuments={setDocuments} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </CustomContainer>
  );
};

export default HomePage;