import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Box, Paper, Grid, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import { AddCircleOutline, RemoveCircleOutline } from '@mui/icons-material';

const CustomContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(3),
}));

const CustomPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(3),
}));


const fetchEmbeddings = async (text) => {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`, 
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: text,
    }),
  });
  const data = await response.json();
  return data.data[0].embedding;
};

const NewProcessForm = () => {
  const [formValues, setFormValues] = useState({
    processDescription: '',
    steps: [''],
    kpis: [''],
    cycleTime: '',
    processOwners: ''
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues({
      ...formValues,
      [name]: value,
    });
  };

  const handleStepChange = (index, event) => {
    const newSteps = formValues.steps.map((step, i) => (i === index ? event.target.value : step));
    setFormValues({
      ...formValues,
      steps: newSteps,
    });
  };

  const handleAddStep = () => {
    setFormValues({
      ...formValues,
      steps: [...formValues.steps, ''],
    });
  };

  const handleRemoveStep = (index) => {
    const newSteps = formValues.steps.filter((_, i) => i !== index);
    setFormValues({
      ...formValues,
      steps: newSteps,
    });
  };

  const handleKPIChange = (index, event) => {
    const newKPIs = formValues.kpis.map((kpi, i) => (i === index ? event.target.value : kpi));
    setFormValues({
      ...formValues,
      kpis: newKPIs,
    });
  };

  const handleAddKPI = () => {
    setFormValues({
      ...formValues,
      kpis: [...formValues.kpis, ''],
    });
  };

  const handleRemoveKPI = (index) => {
    const newKPIs = formValues.kpis.filter((_, i) => i !== index);
    setFormValues({
      ...formValues,
      kpis: newKPIs,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log('Form Submitted', formValues);

    const text = `
      Description: ${formValues.processDescription}
      Steps: ${formValues.steps.join(', ')}
      KPIs: ${formValues.kpis.join(', ')}
      Cycle Time: ${formValues.cycleTime}
      Owners: ${formValues.processOwners}
    `;

    // Fetch embeddings
    const embeddings = await fetchEmbeddings(text);

    // Store embeddings in backend
    const response = await fetch('http://localhost:5001/api/processes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: formValues.processDescription,
        steps: formValues.steps,
        kpis: formValues.kpis,
        cycleTime: formValues.cycleTime,
        owners: formValues.processOwners,
        embeddings: embeddings,
      }),
    });

    if (response.ok) {
      console.log('Process saved successfully');
      setFormValues({
        processDescription: '',
        steps: [''],
        kpis: [''],
        cycleTime: '',
        processOwners: ''
      });
    } else {
      console.log('Error saving process');
    }
  };

  return (
    <CustomContainer>
      <Typography variant="h2" gutterBottom>
        Add New Process
      </Typography>
      <CustomPaper elevation={3}>
        <form onSubmit={handleSubmit}>
          <Typography variant="h5" gutterBottom>
            Process Description
          </Typography>
          <TextField
            name="processDescription"
            label="Process Description"
            variant="outlined"
            fullWidth
            multiline
            rows={4}
            value={formValues.processDescription}
            onChange={handleChange}
            margin="normal"
          />
          
          <Typography variant="h5" gutterBottom>
            Process Steps
          </Typography>
          {formValues.steps.map((step, index) => (
            <Grid container spacing={2} key={index}>
              <Grid item xs={11}>
                <TextField
                  label={`Step ${index + 1}`}
                  variant="outlined"
                  fullWidth
                  multiline
                  rows={2}
                  value={step}
                  onChange={(event) => handleStepChange(index, event)}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={1} style={{ display: 'flex', alignItems: 'center' }}>
                <IconButton onClick={() => handleRemoveStep(index)} disabled={formValues.steps.length === 1}>
                  <RemoveCircleOutline />
                </IconButton>
              </Grid>
            </Grid>
          ))}
          <Button variant="contained" color="primary" onClick={handleAddStep} startIcon={<AddCircleOutline />}>
            Add Step
          </Button>

          <Typography variant="h5" gutterBottom style={{ marginTop: '20px' }}>
            Process KPIs
          </Typography>
          {formValues.kpis.map((kpi, index) => (
            <Grid container spacing={2} key={index}>
              <Grid item xs={11}>
                <TextField
                  label={`KPI ${index + 1}`}
                  variant="outlined"
                  fullWidth
                  multiline
                  rows={2}
                  value={kpi}
                  onChange={(event) => handleKPIChange(index, event)}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={1} style={{ display: 'flex', alignItems: 'center' }}>
                <IconButton onClick={() => handleRemoveKPI(index)} disabled={formValues.kpis.length === 1}>
                  <RemoveCircleOutline />
                </IconButton>
              </Grid>
            </Grid>
          ))}
          <Button variant="contained" color="primary" onClick={handleAddKPI} startIcon={<AddCircleOutline />}>
            Add KPI
          </Button>

          <Typography variant="h5" gutterBottom style={{ marginTop: '20px' }}>
            Process Cycle Time
          </Typography>
          <TextField
            name="cycleTime"
            label="Cycle Time"
            variant="outlined"
            fullWidth
            value={formValues.cycleTime}
            onChange={handleChange}
            margin="normal"
          />
          
          <Typography variant="h5" gutterBottom>
            Process Owners
          </Typography>
          <TextField
            name="processOwners"
            label="Process Owners"
            variant="outlined"
            fullWidth
            multiline
            rows={4}
            value={formValues.processOwners}
            onChange={handleChange}
            margin="normal"
          />
          <Box sx={{ mt: 3 }}>
            <Button type="submit" variant="contained" color="primary">
              Submit
            </Button>
          </Box>
        </form>
      </CustomPaper>
    </CustomContainer>
  );
};

export default NewProcessForm;