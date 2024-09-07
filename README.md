Leanify - Process Improvement Platform

Leanify is a platform designed to promote a continuous improvement culture within organizations using Lean Six Sigma methodologies. With an interactive dashboard, repository, and AI-assisted chatbot for process queries, Leanify helps streamline processes and foster efficiency across teams.

Table of Contents

Features
Technologies Used
Architecture Overview
Data Flow Diagram
Installation
Usage
API Endpoints


Features

Process Dashboard: View detailed metrics, KPIs, and cycle time for different processes.
Process Repository: Access stored processes, steps, and owners.
Process Form: Submit new processes, including steps, KPIs, and cycle time.
AI-powered Process Chatbot: Ask queries related to processes stored in the database; the chatbot replies based on embeddings and contextual relevance.
Authentication System: Secure login and registration using JWT and bcrypt for password encryption.
Responsive Design: Fully responsive UI with separate mobile-friendly navigation.

Technologies Used

Frontend: React, Material-UI (for UI components), SCSS (for styling)
Backend: Node.js, Express, Passport.js (for authentication)
Database: SingleStore (for process data storage and embeddings)
AI Integration: OpenAI API (for embedding generation and chat completions)
Charts: Recharts (for visualizing process metrics)

Architecture Overview

Frontend: Built using React with Material-UI, the user interacts with various components such as the Process Dashboard, Process Repository, Process Form, and Chatbot.
Backend: An Express server handling user authentication, process submission, and AI-driven chatbot responses. It interfaces with SingleStore for storing and retrieving process data and embeddings.
Database: SingleStore is used to store process information (description, steps, KPIs) and embeddings for contextual query matching.
AI Integration: OpenAI’s APIs are used to generate text embeddings and provide chat responses based on user queries.

Installation

Prerequisites

Node.js
SingleStore (for database)
OpenAI API Key

Clone the Repository

Install Dependencies

Configure Environment Variables

Create a .env file in the root directory with the following variables:
PORT=5001
SINGLESTORE_HOST=your-single-store-host
SINGLESTORE_USER=your-username
SINGLESTORE_PASSWORD=your-password
SINGLESTORE_DATABASE=LeanifyDB
JWT_SECRET=your-jwt-secret
OPENAI_API_KEY=your-openai-api-key

Start the Server

Usage

Authentication: Register or login with an account.
Process Dashboard: View various processes, cycle times, and KPIs.
Submit Process: Use the form to add new processes, steps, owners, and KPIs.
AI Chatbot: Interact with the chatbot to get process-specific information using natural language queries.

API Endpoints

Authentication

POST /api/auth/register: Register a new user.
POST /api/auth/login: Login to the platform.

Processes

POST /api/processes: Submit a new process.
GET /api/processes: Fetch all processes.

Chat

POST /api/chat: Ask a query; the chatbot provides a response based on the process data.
