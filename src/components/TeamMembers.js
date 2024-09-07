import React from 'react';
import { Grid, Avatar, Typography, Box, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const TeamMembers = ({ teamMembers }) => {
  return (
    <Box>
      <Grid container spacing={2} justifyContent="center">
        {teamMembers.map((member) => (
          <Grid item key={member.id}>
            <Box display="flex" flexDirection="column" alignItems="center">
              <Avatar alt={member.username} sx={{ width: 72, height: 72 }} />
              <Typography variant="body1" sx={{ fontWeight: 'bold', marginTop: 1 }}>
                {member.username}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {member.email}
              </Typography>
            </Box>
          </Grid>
        ))}
        <Grid item>
          <Button variant="contained" color="primary" sx={{ width: 72, height: 72 }}>
            <AddIcon />
          </Button>
          <Typography variant="body2" sx={{ marginTop: 1, textAlign: 'center' }}>
            Add Member
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TeamMembers;