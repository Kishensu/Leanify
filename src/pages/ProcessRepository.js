import React, { useState, useEffect } from 'react';
import { Container, TextField, Typography, Paper, Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemText, ListItemIcon, Box, Modal, Stepper, Step, StepLabel, Card, CardContent, Divider, IconButton, InputAdornment, Avatar, Grid } from '@mui/material';
import { ExpandMore, Business, TrendingUp, Warning, AttachFile, Clear, Timeline } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import processesData from '../assets/data/processes.json';  

const CustomContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(3),
}));

const CustomPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(3),
}));

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  maxHeight: '80%',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  overflow: 'auto'
};

const highlightText = (text, highlight) => {
  if (!highlight) return text;
  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, index) => 
    part.toLowerCase() === highlight.toLowerCase() ? 
    <span key={index} style={{ backgroundColor: 'yellow' }}>{part}</span> : 
    part
  );
};

const ProcessRepository = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [processes, setProcesses] = useState({});
  const [filteredProcesses, setFilteredProcesses] = useState({});
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [noResults, setNoResults] = useState(false);

  useEffect(() => {

    setProcesses(processesData.departments);
    setFilteredProcesses(processesData.departments);
  }, []);

  const handleSearchChange = (event) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(term);

    if (term === '') {
      setFilteredProcesses(processes);
      setNoResults(false);
      return;
    }

    const filtered = {};
    let hasResults = false;

    for (const [department, departmentData] of Object.entries(processes)) {
      const filteredTeams = departmentData.teams.map(team => ({
        ...team,
        processes: team.processes.filter(process =>
          process.name.toLowerCase().includes(term) ||
          process.description.toLowerCase().includes(term) ||
          process.tools.join(', ').toLowerCase().includes(term) ||
          process.kpis.join(', ').toLowerCase().includes(term) ||
          process.risks.join(', ').toLowerCase().includes(term) ||
          process.relatedDocuments.join(', ').toLowerCase().includes(term)
        )
      }));

      const hasFilteredTeams = filteredTeams.some(team => team.processes.length > 0);
      if (hasFilteredTeams) {
        filtered[department] = {
          ...departmentData,
          teams: filteredTeams
        };
        hasResults = true;
      }
    }

    setFilteredProcesses(filtered);
    setNoResults(!hasResults);
  };

  const handleProcessClick = (process) => {
    setSelectedProcess(process);
  };

  const handleClose = () => {
    setSelectedProcess(null);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setFilteredProcesses(processes);
    setNoResults(false);
  };

  return (
    <CustomContainer>
      <Typography variant="h2" gutterBottom>
        Process Repository
      </Typography>
      <CustomPaper elevation={3}>
        <TextField
          label="Search Processes"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={handleClearSearch}>
                  <Clear />
                </IconButton>
              </InputAdornment>
            ),
          }}
          style={{ marginBottom: '20px' }}
        />
        {noResults && (
          <Typography variant="body1" color="textSecondary">
            No results found for "{searchTerm}".
          </Typography>
        )}
        {Object.entries(filteredProcesses).map(([department, departmentData]) => (
          <Accordion key={department}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h5">{department}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {departmentData.teams.map((team) => (
                <Box key={team.id} mb={3}>
                  <Typography variant="h6">{team.name}</Typography>
                  <List>
                    {team.processes.map((process) => (
                      <ListItem button key={process.id} onClick={() => handleProcessClick(process)}>
                        <ListItemIcon>
                          <Business />
                        </ListItemIcon>
                        <Box>
                          <ListItemText primary={highlightText(process.name, searchTerm)} secondary={highlightText(process.description, searchTerm)} />
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              ))}
            </AccordionDetails>
          </Accordion>
        ))}
      </CustomPaper>

      <Modal
        open={Boolean(selectedProcess)}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={modalStyle}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography id="modal-modal-title" variant="h5" gutterBottom>
                    {selectedProcess?.name}
                  </Typography>
                  <Typography id="modal-modal-description" variant="body1" color="textSecondary" gutterBottom>
                    {selectedProcess?.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} >
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Owner</Typography>
                  <Box display="flex" alignItems="center">
                    <Avatar alt={selectedProcess?.owner} src={`https://randomuser.me/api/portraits/lego/${selectedProcess?.id}.jpg`} />
                    <Box ml={2}>
                      <Typography variant="body1">{selectedProcess?.owner}</Typography>
                      <Typography variant="body2" color="textSecondary">{selectedProcess?.role}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Frequency</Typography>
                  <Typography variant="body1" gutterBottom>{selectedProcess?.frequency}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} >
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Tools/Software Used</Typography>
                  <Typography variant="body1" gutterBottom>{selectedProcess?.tools.join(', ')}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} >
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Key Performance Indicators (KPIs)</Typography>
                  <List>
                    {selectedProcess?.kpis.map((kpi, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <TrendingUp />
                        </ListItemIcon>
                        <ListItemText primary={kpi} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} >
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Risks</Typography>
                  <List>
                    {selectedProcess?.risks.map((risk, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Warning />
                        </ListItemIcon>
                        <ListItemText primary={risk} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} >
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Related Documents</Typography>
                  <List>
                    {selectedProcess?.relatedDocuments.map((doc, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <AttachFile />
                        </ListItemIcon>
                        <ListItemText primary={doc} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} >
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Process Duration</Typography>
                  <Typography variant="body1" gutterBottom>{selectedProcess?.duration}</Typography>
                </CardContent>
                </Card>
        </Grid>
        <Grid item xs={12} >
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Dependencies</Typography>
              <Typography variant="body1" gutterBottom>{selectedProcess?.dependencies}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} >
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Status</Typography>
              <Typography variant="body1" gutterBottom>{selectedProcess?.status}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} >
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Historical Data</Typography>
              <Typography variant="body1" gutterBottom>{selectedProcess?.historicalData}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Steps</Typography>
              <Stepper activeStep={-1} orientation="vertical">
                {selectedProcess?.steps.map((step, index) => (
                  <Step key={index}>
                    <StepLabel icon={<Timeline />}>{step}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  </Modal>
</CustomContainer>
);
};

export default ProcessRepository;