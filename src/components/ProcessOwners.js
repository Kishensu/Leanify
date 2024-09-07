import React from 'react';
import { Typography, List, ListItem, ListItemText, ListItemAvatar, Avatar, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

const CustomPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(3),
}));

const ProcessOwners = ({ data }) => {
  return (
    <CustomPaper elevation={3}>
      <Typography variant="h5" gutterBottom>
        Process Owners
      </Typography>
      <List>
        {data.map((owner, index) => (
          <ListItem key={index} alignItems="flex-start">
            <ListItemAvatar>
              <Avatar alt={owner.Owner} src={owner.avatar} />
            </ListItemAvatar>
            <ListItemText
              primary={owner.Step}
              secondary={owner.Owner}
            />
          </ListItem>
        ))}
      </List>
    </CustomPaper>
  );
};

export default ProcessOwners;

