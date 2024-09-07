import React, { useState } from 'react';
import { Container, Typography, Paper, Stepper, Step, StepLabel, Button, Box, Card, CardContent, Grid, Modal, List, ListItem, ListItemText, ListItemIcon, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Quiz, FlashOn, CheckCircle, PlayCircleFilled, Assignment, ExpandMore } from '@mui/icons-material';

const CustomContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(3),
}));

const CustomPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(3),
}));

const ModuleCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  padding: theme.spacing(2),
}));

const StepButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginRight: theme.spacing(2),
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
  overflow: 'auto',
};

const trainingModules = [
  {
    title: 'Introduction to Lean Six Sigma',
    content: 'Lean Six Sigma is a methodology that relies on a collaborative team effort to improve performance by systematically removing waste and reducing variation.',
  },
  {
    title: 'Interactive Videos',
    items: [
      { text: 'What is Lean Six Sigma?', icon: <PlayCircleFilled /> },
      { text: 'The DMAIC Process', icon: <PlayCircleFilled /> },
    ],
  },
  {
    title: 'Quizzes',
    items: [
      { text: 'Lean Six Sigma Basics Quiz', icon: <Quiz /> },
      { text: 'Advanced Lean Six Sigma Quiz', icon: <Quiz /> },
    ],
  },
  {
    title: 'Case Studies',
    items: [
      { text: 'Case Study 1: Manufacturing Improvement', icon: <CheckCircle /> },
      { text: 'Case Study 2: Healthcare Process Improvement', icon: <CheckCircle /> },
    ],
  },
  {
    title: 'Additional Resources',
    items: [
      { text: 'Visit iSixSigma', link: 'https://www.isixsigma.com/' },
    ],
  },
];

const yellowBeltChapters = [
  'Chapter 1: Introduction to Six Sigma',
  'Chapter 2: Six Sigma History and Application',
  'Chapter 3: Other Process Improvement and Quality Methods',
  'Chapter 4: Lean Concepts',
  'Chapter 5: Basic Six Sigma Concepts',
  'Chapter 6: Approaching the Problem',
  'Chapter 7: Data Collection',
  'Chapter 8: Process Mapping',
  'Chapter 9: Descriptive Statistics',
  'Chapter 10: Measurement System Analysis',
  'Chapter 11: Hypothesis Testing',
  'Chapter 12: Control Charts',
  'Chapter 13: Continuous Improvement',
];

const greenBeltChapters = [
  'Chapter 1: Advanced Six Sigma Concepts',
  'Chapter 2: Project Selection and Definition',
  'Chapter 3: Measuring Process Performance',
  'Chapter 4: Data Collection and Analysis',
  'Chapter 5: Process Control and Improvement',
  'Chapter 6: Statistical Process Control',
  'Chapter 7: Design of Experiments',
  'Chapter 8: Control Plans',
];

const blackBeltChapters = [
  'Chapter 1: Black Belt Role and Responsibilities',
  'Chapter 2: Team Dynamics and Performance',
  'Chapter 3: Advanced Data Analysis Techniques',
  'Chapter 4: DMAIC Methodology',
  'Chapter 5: Lean Principles and Techniques',
  'Chapter 6: Six Sigma Tools and Methods',
  'Chapter 7: Project Management and Leadership',
  'Chapter 8: Change Management',
];

const masterBlackBeltChapters = [
  'Chapter 1: Master Black Belt Role and Responsibilities',
  'Chapter 2: Advanced Lean Six Sigma Techniques',
  'Chapter 3: Strategic Project Selection',
  'Chapter 4: Financial Benefits of Lean Six Sigma',
  'Chapter 5: Coaching and Mentoring',
  'Chapter 6: Organizational Change Management',
  'Chapter 7: Innovation and Continuous Improvement',
  'Chapter 8: Program Governance and Deployment',
];

const ProcessImprovementTraining = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [openQuiz, setOpenQuiz] = useState(false);
  const [openFlashcards, setOpenFlashcards] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [expandedYellowBelt, setExpandedYellowBelt] = useState(false);
  const [expandedGreenBelt, setExpandedGreenBelt] = useState(false);
  const [expandedBlackBelt, setExpandedBlackBelt] = useState(false);
  const [expandedMasterBlackBelt, setExpandedMasterBlackBelt] = useState(false);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleOpenQuiz = () => setOpenQuiz(true);
  const handleCloseQuiz = () => setOpenQuiz(false);

  const handleOpenFlashcards = () => setOpenFlashcards(true);
  const handleCloseFlashcards = () => setOpenFlashcards(false);

  const handleAccordionChange = () => {
    setExpanded(!expanded);
  };

  const handleAccordionChangeYellowBelt = () => {
    setExpandedYellowBelt(!expandedYellowBelt);
  };

  const handleAccordionChangeGreenBelt = () => {
    setExpandedGreenBelt(!expandedGreenBelt);
  };

  const handleAccordionChangeBlackBelt = () => {
    setExpandedBlackBelt(!expandedBlackBelt);
  };

  const handleAccordionChangeMasterBlackBelt = () => {
    setExpandedMasterBlackBelt(!expandedMasterBlackBelt);
  };

  return (
    <CustomContainer>
      <Typography variant="h2" gutterBottom>
        Process Improvement Training
      </Typography>
      
      {trainingModules.slice(0, 1).map((module, index) => (
        <ModuleCard key={index}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              {module.title}
            </Typography>
            {module.content && <Typography variant="body1">{module.content}</Typography>}
          </CardContent>
        </ModuleCard>
      ))}

      <Accordion expanded={expanded} onChange={handleAccordionChange}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h5">Lean Six Sigma Journey</Typography>
        </AccordionSummary>
        <AccordionDetails>           <Accordion expanded={expandedYellowBelt} onChange={handleAccordionChangeYellowBelt}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" gutterBottom>
                Lean Six Sigma Yellow Belt Training
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stepper activeStep={activeStep} orientation="vertical">
                {yellowBeltChapters.map((label, index) => (
                  <Step key={index}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button disabled={activeStep === 0} onClick={handleBack}>
                  Back
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  disabled={activeStep === yellowBeltChapters.length - 1}
                >
                  Next
                </Button>
              </Box>
              <Box sx={{ display: 'flex', mt: 2 }}>
                <StepButton
                  variant="contained"
                  color="secondary"
                  startIcon={<Quiz />}
                  onClick={handleOpenQuiz}
                >
                  Take Quiz
                </StepButton>
                <StepButton
                  variant="contained"
                  color="secondary"
                  startIcon={<FlashOn />}
                  onClick={handleOpenFlashcards}
                  sx={{ ml: 2 }}
                >
                  Review Flashcards
                </StepButton>
              </Box>
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expandedGreenBelt} onChange={handleAccordionChangeGreenBelt}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" gutterBottom>
                Lean Six Sigma Green Belt Training
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stepper activeStep={activeStep} orientation="vertical">
                {greenBeltChapters.map((label, index) => (
                  <Step key={index}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button disabled={activeStep === 0} onClick={handleBack}>
              Back
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
              disabled={activeStep === greenBeltChapters.length - 1}
            >
              Next
            </Button>
          </Box>
          <Box sx={{ display: 'flex', mt: 2 }}>
            <StepButton
              variant="contained"
              color="secondary"
              startIcon={<Quiz />}
              onClick={handleOpenQuiz}
            >
              Take Quiz
            </StepButton>
            <StepButton
              variant="contained"
              color="secondary"
              startIcon={<FlashOn />}
              onClick={handleOpenFlashcards}
              sx={{ ml: 2 }}
            >
              Review Flashcards
            </StepButton>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expandedBlackBelt} onChange={handleAccordionChangeBlackBelt}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6" gutterBottom>
            Lean Six Sigma Black Belt Training
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stepper activeStep={activeStep} orientation="vertical">
            {blackBeltChapters.map((label, index) => (
              <Step key={index}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button disabled={activeStep === 0} onClick={handleBack}>
              Back
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
              disabled={activeStep === blackBeltChapters.length - 1}
            >
              Next
            </Button>
          </Box>
          <Box sx={{ display: 'flex', mt: 2 }}>
            <StepButton
              variant="contained"
              color="secondary"
              startIcon={<Quiz />}
              onClick={handleOpenQuiz}
            >
              Take Quiz
            </StepButton>
            <StepButton
              variant="contained"
              color="secondary"
              startIcon={<FlashOn />}
              onClick={handleOpenFlashcards}
              sx={{ ml: 2 }}
            >
              Review Flashcards
            </StepButton>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expandedMasterBlackBelt} onChange={handleAccordionChangeMasterBlackBelt}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6" gutterBottom>
            Lean Six Sigma Master Black Belt Training
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stepper activeStep={activeStep} orientation="vertical">
            {masterBlackBeltChapters.map((label, index) => (
              <Step key={index}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button disabled={activeStep === 0} onClick={handleBack}>
              Back
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
              disabled={activeStep === masterBlackBeltChapters.length - 1}
            >
              Next
            </Button>
          </Box>
          <Box sx={{ display: 'flex', mt: 2 }}>
            <StepButton
              variant="contained"
              color="secondary"
              startIcon={<Quiz />}
              onClick={handleOpenQuiz}
            >
              Take Quiz
            </StepButton>
            <StepButton
              variant="contained"
              color="secondary"
              startIcon={<FlashOn />}
              onClick={handleOpenFlashcards}
              sx={{ ml: 2 }}
            >
              Review Flashcards
            </StepButton>
          </Box>
        </AccordionDetails>
      </Accordion>

      {trainingModules.slice(1).map((module, index) => (
        <ModuleCard key={index}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              {module.title}
            </Typography>
            {module.content && <Typography variant="body1">{module.content}</Typography>}
            {module.items && (
              <List>
                {module.items.map((item, idx) => (
                  <ListItem button key={idx}>
                    {item.link ? (
                      <Button
                        variant="contained"
                        color="primary"
                        href={item.link}
                        startIcon={<Assignment />}
                        sx={{ justifyContent: 'flex-start' }}
                      >
                        {item.text}
                      </Button>
                    ) : (
                      <>
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                      </>
                    )}
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </ModuleCard>
      ))}
    </AccordionDetails>
  </Accordion>

  <Modal open={openQuiz} onClose={handleCloseQuiz}>
    <Box sx={modalStyle}>
      <Typography variant="h6" gutterBottom>Quiz</Typography>

      <Button onClick={handleCloseQuiz}>Close</Button>
    </Box>
  </Modal>

  <Modal open={openFlashcards} onClose={handleCloseFlashcards}>
    <Box sx={modalStyle}>
      <Typography variant="h6" gutterBottom>Flashcards</Typography>

      <Button onClick={handleCloseFlashcards}>Close</Button>
    </Box>
  </Modal>
</CustomContainer>
  );
};

export default ProcessImprovementTraining;