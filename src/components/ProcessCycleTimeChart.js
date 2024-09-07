import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Typography } from '@mui/material';

const ProcessCycleTimeChart = ({ data }) => {
  const chartData = data.map(step => ({
    step: step.Step,
    cycleTime: parseInt(step["Cycle Time"], 10)
  }));

  return (
    <div>
      <Typography variant="h5" gutterBottom>
        Process Cycle Time
      </Typography>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="step" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="cycleTime" stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProcessCycleTimeChart;

