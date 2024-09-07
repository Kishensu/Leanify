import React from 'react';
import { Typography, Paper, Grid } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const ProcessMetrics = ({ data }) => {
  const metricData = data.map(kpi => ({
    name: kpi.KPI,
    Current: parseFloat(kpi["Current Value"]),
    Target: parseFloat(kpi["Target Value"])
  }));

  return (
    <div>
      <Typography variant="h5" gutterBottom>
        Process Metrics
      </Typography>
      <Grid container spacing={3}>
        {metricData.map((metric, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Paper elevation={3} style={{ padding: '20px' }}>
              <Typography variant="h6" gutterBottom>
                {metric.name}
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[metric]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Current" fill="#8884d8" />
                  <Bar dataKey="Target" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </div>
  );
};

export default ProcessMetrics;

