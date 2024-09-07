import React, { useState } from 'react';
import { Container, Grid, Paper, Typography, MenuItem, Select, FormControl, InputLabel, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link } from 'react-router-dom';
import ProcessMetrics from '../components/ProcessMetrics';
import ProcessOwners from '../components/ProcessOwners';
import ProcessCycleTimeChart from '../components/ProcessCycleTimeChart';
import accountsPayableData from '../assets/data/apProcess.json';
import accountsReceivableData from '../assets/data/accountsReceivableProcess.json';

const CustomFormControl = styled(FormControl)(({ theme }) => ({
  minWidth: 200,
  marginBottom: theme.spacing(3),
}));

const CustomPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(3),
}));

const CustomContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(3),
}));

const ProcessDashboard = () => {
  const [selectedProcess, setSelectedProcess] = useState('Accounts Payable');
  const processData = selectedProcess === 'Accounts Payable' ? accountsPayableData : accountsReceivableData;
  const processDesc = processData["Process Description"].Description;

  return (
    <CustomContainer>
      <Typography variant="h2" gutterBottom>
        Process Dashboard
      </Typography>
      <CustomFormControl variant="outlined">
        <InputLabel id="process-select-label">Select Process</InputLabel>
        <Select
          labelId="process-select-label"
          id="process-select"
          value={selectedProcess}
          onChange={(e) => setSelectedProcess(e.target.value)}
          label="Select Process"
        >
          <MenuItem value="Accounts Payable">Accounts Payable</MenuItem>
          <MenuItem value="Accounts Receivable">Accounts Receivable</MenuItem>
        </Select>
      </CustomFormControl>
      <CustomPaper elevation={3}>
        <Typography variant="h5" gutterBottom>
          Process Description
        </Typography>
        <Typography variant="body1">
          {processDesc}
        </Typography>
      </CustomPaper>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <CustomPaper elevation={3} style={{ height: '100%' }}>
            <ProcessCycleTimeChart data={processData["Process Steps"]} />
          </CustomPaper>
        </Grid>
        <Grid item xs={12} md={6}>
          <CustomPaper elevation={3} style={{ height: '100%' }}>
            <ProcessOwners data={processData["Process Owners"]} />
          </CustomPaper>
        </Grid>
        <Grid item xs={12}>
          <CustomPaper elevation={3} style={{ marginTop: '30px'}}>
            <ProcessMetrics data={processData["Process KPIs"]} />
          </CustomPaper>
        </Grid>
      </Grid>
    </CustomContainer>
  );
};

export default ProcessDashboard;