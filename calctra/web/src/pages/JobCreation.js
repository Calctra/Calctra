import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Paper, TextField, Button, Box, Grid, MenuItem,
  FormControl, InputLabel, Select, Chip, Checkbox, ListItemText,
  OutlinedInput, FormHelperText, Divider, Stepper, Step, StepLabel,
  Snackbar, Alert, IconButton, Card, CardContent
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
  Code as CodeIcon,
  Storage as StorageIcon,
  Settings as SettingsIcon,
  Timer as TimerIcon,
  Add as AddIcon,
  CloudUpload as CloudUploadIcon,
  AttachMoney as MoneyIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { createJob } from '../redux/slices/jobSlice';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
  },
  paper: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
  },
  formControl: {
    marginBottom: theme.spacing(2),
    width: '100%',
  },
  selectChip: {
    margin: theme.spacing(0.5),
  },
  divider: {
    margin: theme.spacing(2, 0),
  },
  stepContent: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: theme.spacing(3),
  },
  codeEditor: {
    fontFamily: 'monospace',
    width: '100%',
    minHeight: '200px',
    padding: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.grey[50],
  },
  resourceCard: {
    marginBottom: theme.spacing(2),
    cursor: 'pointer',
    '&:hover': {
      boxShadow: theme.shadows[4],
    },
  },
  selectedResourceCard: {
    borderColor: theme.palette.primary.main,
    borderWidth: 2,
    borderStyle: 'solid',
  },
  datasetCard: {
    marginBottom: theme.spacing(2),
    cursor: 'pointer',
    '&:hover': {
      boxShadow: theme.shadows[4],
    },
  },
  selectedDatasetCard: {
    borderColor: theme.palette.primary.main,
    borderWidth: 2,
    borderStyle: 'solid',
  },
  summaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(1),
  },
  uploadButton: {
    margin: theme.spacing(1, 0),
  },
  resourceChips: {
    display: 'flex',
    flexWrap: 'wrap',
    '& > *': {
      margin: theme.spacing(0.5),
    },
  },
}));

const steps = ['Basic Information', 'Select Resources', 'Configure Job', 'Summary'];

const JobCreation = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { isLoading, isSuccess, isError, error } = useSelector((state) => state.jobs);
  const { user } = useSelector((state) => state.auth);
  const { resources } = useSelector((state) => state.resources);
  const { datasets } = useSelector((state) => state.data || { datasets: [] });
  
  const [activeStep, setActiveStep] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Form state
  const [jobData, setJobData] = useState({
    name: '',
    description: '',
    type: 'data_processing', // or custom_code
    selectedResources: [],
    selectedDatasets: [],
    customCode: '',
    parameters: {},
    estimatedRuntime: 1,
    estimatedCost: 0,
    priority: 'normal', // or high, low
  });
  
  // Form validation
  const [errors, setErrors] = useState({});
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  useEffect(() => {
    if (isSuccess) {
      setSnackbar({
        open: true,
        message: 'Job created successfully!',
        severity: 'success'
      });
      
      // Reset form and redirect after success
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    }
    
    if (isError) {
      setSnackbar({
        open: true,
        message: error || 'Failed to create job',
        severity: 'error'
      });
    }
  }, [isSuccess, isError, error, navigate]);
  
  // Calculate estimated cost based on selected resources and runtime
  useEffect(() => {
    if (jobData.selectedResources.length > 0 && jobData.estimatedRuntime) {
      let totalCost = 0;
      jobData.selectedResources.forEach(resourceId => {
        const resource = resources.find(r => r.id === resourceId);
        if (resource) {
          // Simple cost calculation based on resource specs and time
          const hourlyRate = resource.pricePerHour || 1; // Default to 1 CAL if not specified
          totalCost += hourlyRate * jobData.estimatedRuntime;
        }
      });
      
      setJobData(prev => ({
        ...prev,
        estimatedCost: totalCost.toFixed(2)
      }));
    }
  }, [jobData.selectedResources, jobData.estimatedRuntime, resources]);
  
  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0: // Basic Information
        if (!jobData.name.trim()) {
          newErrors.name = 'Job name is required';
        }
        if (!jobData.description.trim()) {
          newErrors.description = 'Job description is required';
        }
        if (!jobData.type) {
          newErrors.type = 'Job type is required';
        }
        break;
        
      case 1: // Select Resources
        if (jobData.selectedResources.length === 0) {
          newErrors.selectedResources = 'At least one computing resource is required';
        }
        break;
        
      case 2: // Configure Job
        if (jobData.type === 'custom_code' && !jobData.customCode.trim()) {
          newErrors.customCode = 'Custom code is required for this job type';
        }
        if (jobData.selectedDatasets.length === 0) {
          newErrors.selectedDatasets = 'At least one dataset is required';
        }
        if (!jobData.estimatedRuntime || jobData.estimatedRuntime <= 0) {
          newErrors.estimatedRuntime = 'Estimated runtime must be greater than 0';
        }
        break;
        
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };
  
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setJobData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is updated
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  const handleResourceSelect = (resourceId) => {
    setJobData(prev => {
      const selectedResources = prev.selectedResources.includes(resourceId)
        ? prev.selectedResources.filter(id => id !== resourceId)
        : [...prev.selectedResources, resourceId];
      
      return {
        ...prev,
        selectedResources
      };
    });
    
    // Clear resource selection error if any
    if (errors.selectedResources) {
      setErrors(prev => ({
        ...prev,
        selectedResources: undefined
      }));
    }
  };
  
  const handleDatasetSelect = (datasetId) => {
    setJobData(prev => {
      const selectedDatasets = prev.selectedDatasets.includes(datasetId)
        ? prev.selectedDatasets.filter(id => id !== datasetId)
        : [...prev.selectedDatasets, datasetId];
      
      return {
        ...prev,
        selectedDatasets
      };
    });
    
    // Clear dataset selection error if any
    if (errors.selectedDatasets) {
      setErrors(prev => ({
        ...prev,
        selectedDatasets: undefined
      }));
    }
  };
  
  const handleSubmit = () => {
    // Prepare the data for submission
    const jobFormData = {
      name: jobData.name,
      description: jobData.description,
      type: jobData.type,
      resources: jobData.selectedResources,
      datasets: jobData.selectedDatasets,
      code: jobData.type === 'custom_code' ? jobData.customCode : undefined,
      parameters: jobData.parameters,
      estimatedRuntime: Number(jobData.estimatedRuntime),
      estimatedCost: Number(jobData.estimatedCost),
      priority: jobData.priority,
    };
    
    dispatch(createJob(jobFormData));
  };
  
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };
  
  // Render step content
  const getStepContent = (step) => {
    switch (step) {
      case 0: // Basic Information
        return (
          <Box className={classes.stepContent}>
            <Typography variant="h6" gutterBottom>
              Basic Job Information
            </Typography>
            
            <FormControl className={classes.formControl} error={!!errors.name}>
              <TextField 
                label="Job Name"
                name="name"
                value={jobData.name}
                onChange={handleInputChange}
                fullWidth
                required
                error={!!errors.name}
                helperText={errors.name}
              />
            </FormControl>
            
            <FormControl className={classes.formControl} error={!!errors.description}>
              <TextField 
                label="Job Description"
                name="description"
                value={jobData.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
                required
                error={!!errors.description}
                helperText={errors.description}
              />
            </FormControl>
            
            <FormControl className={classes.formControl} error={!!errors.type}>
              <InputLabel id="job-type-label">Job Type</InputLabel>
              <Select
                labelId="job-type-label"
                name="type"
                value={jobData.type}
                onChange={handleInputChange}
                fullWidth
                required
              >
                <MenuItem value="data_processing">Data Processing</MenuItem>
                <MenuItem value="custom_code">Custom Code Execution</MenuItem>
              </Select>
              {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
            </FormControl>
            
            <FormControl className={classes.formControl}>
              <InputLabel id="priority-label">Priority</InputLabel>
              <Select
                labelId="priority-label"
                name="priority"
                value={jobData.priority}
                onChange={handleInputChange}
                fullWidth
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
              <FormHelperText>Higher priority may incur additional costs</FormHelperText>
            </FormControl>
          </Box>
        );
        
      case 1: // Select Resources
        return (
          <Box className={classes.stepContent}>
            <Typography variant="h6" gutterBottom>
              Select Computing Resources
            </Typography>
            
            {errors.selectedResources && (
              <Alert severity="error" style={{ marginBottom: 16 }}>
                {errors.selectedResources}
              </Alert>
            )}
            
            <Grid container spacing={2}>
              {resources && resources.length > 0 ? (
                resources.map((resource) => (
                  <Grid item xs={12} sm={6} md={4} key={resource.id}>
                    <Card 
                      className={`${classes.resourceCard} ${jobData.selectedResources.includes(resource.id) ? classes.selectedResourceCard : ''}`}
                      onClick={() => handleResourceSelect(resource.id)}
                    >
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="h6">{resource.name}</Typography>
                          {jobData.selectedResources.includes(resource.id) && (
                            <CheckIcon color="primary" />
                          )}
                        </Box>
                        
                        <Box className={classes.resourceChips}>
                          <Chip 
                            label={resource.type || 'CPU'} 
                            size="small" 
                            color="primary"
                          />
                          <Chip 
                            label={`${resource.cpu || 4} CPU Cores`} 
                            size="small" 
                          />
                          <Chip 
                            label={`${resource.memory || 8} GB RAM`} 
                            size="small" 
                          />
                        </Box>
                        
                        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                          <Typography variant="body2" color="textSecondary">
                            Provider: {resource.provider || 'Anonymous'}
                          </Typography>
                          <Typography variant="subtitle1" color="primary">
                            {resource.pricePerHour || 1} CAL/hr
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Alert severity="info">
                    No computing resources available. Please try again later.
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Box>
        );
        
      case 2: // Configure Job
        return (
          <Box className={classes.stepContent}>
            <Typography variant="h6" gutterBottom>
              Configure Your Job
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Select Datasets
                </Typography>
                
                {errors.selectedDatasets && (
                  <Alert severity="error" style={{ marginBottom: 16 }}>
                    {errors.selectedDatasets}
                  </Alert>
                )}
                
                {datasets && datasets.length > 0 ? (
                  datasets.map((dataset) => (
                    <Card 
                      key={dataset.id}
                      className={`${classes.datasetCard} ${jobData.selectedDatasets.includes(dataset.id) ? classes.selectedDatasetCard : ''}`}
                      onClick={() => handleDatasetSelect(dataset.id)}
                    >
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle1">{dataset.name}</Typography>
                          {jobData.selectedDatasets.includes(dataset.id) && (
                            <CheckIcon color="primary" />
                          )}
                        </Box>
                        <Typography variant="body2" color="textSecondary">
                          {dataset.description}
                        </Typography>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                          <Typography variant="body2">
                            Size: {dataset.size || '10MB'}
                          </Typography>
                          <Typography variant="body2">
                            Format: {dataset.format || 'CSV'}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Alert severity="info">
                    No datasets available. Please upload a dataset first.
                  </Alert>
                )}
                
                <Button
                  variant="outlined"
                  startIcon={<CloudUploadIcon />}
                  className={classes.uploadButton}
                  onClick={() => navigate('/datasets/new')}
                >
                  Upload New Dataset
                </Button>
              </Grid>
              
              <Grid item xs={12} md={6}>
                {jobData.type === 'custom_code' && (
                  <>
                    <Typography variant="subtitle1" gutterBottom>
                      Custom Code
                    </Typography>
                    
                    {errors.customCode && (
                      <Alert severity="error" style={{ marginBottom: 16 }}>
                        {errors.customCode}
                      </Alert>
                    )}
                    
                    <TextField
                      name="customCode"
                      value={jobData.customCode}
                      onChange={handleInputChange}
                      multiline
                      rows={10}
                      fullWidth
                      className={classes.codeEditor}
                      placeholder="# Enter your Python code here\n\nimport numpy as np\nimport pandas as pd\n\ndef process_data(input_data):\n    # Your data processing logic here\n    return processed_data"
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <Box position="absolute" top={8} right={8}>
                            <CodeIcon color="action" />
                          </Box>
                        ),
                      }}
                    />
                    
                    <FormHelperText>
                      Supported languages: Python, R, Julia
                    </FormHelperText>
                  </>
                )}
                
                <Box mt={3}>
                  <Typography variant="subtitle1" gutterBottom>
                    Runtime Settings
                  </Typography>
                  
                  <FormControl className={classes.formControl} error={!!errors.estimatedRuntime}>
                    <TextField
                      label="Estimated Runtime (hours)"
                      name="estimatedRuntime"
                      type="number"
                      value={jobData.estimatedRuntime}
                      onChange={handleInputChange}
                      InputProps={{
                        startAdornment: (
                          <TimerIcon color="action" style={{ marginRight: 8 }} />
                        ),
                        inputProps: { min: 0.1, step: 0.1 }
                      }}
                      fullWidth
                      required
                      error={!!errors.estimatedRuntime}
                      helperText={errors.estimatedRuntime}
                    />
                  </FormControl>
                  
                  {jobData.estimatedCost > 0 && (
                    <Box display="flex" alignItems="center" mt={2}>
                      <MoneyIcon color="primary" style={{ marginRight: 8 }} />
                      <Typography variant="subtitle1">
                        Estimated Cost: {jobData.estimatedCost} CAL
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        );
        
      case 3: // Summary
        return (
          <Box className={classes.stepContent}>
            <Typography variant="h6" gutterBottom>
              Job Summary
            </Typography>
            
            <Paper className={classes.paper}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Basic Information
                  </Typography>
                  
                  <Box className={classes.summaryItem}>
                    <Typography variant="body2" color="textSecondary">
                      Job Name:
                    </Typography>
                    <Typography variant="body1">
                      {jobData.name}
                    </Typography>
                  </Box>
                  
                  <Box className={classes.summaryItem}>
                    <Typography variant="body2" color="textSecondary">
                      Job Type:
                    </Typography>
                    <Typography variant="body1">
                      {jobData.type === 'data_processing' ? 'Data Processing' : 'Custom Code Execution'}
                    </Typography>
                  </Box>
                  
                  <Box className={classes.summaryItem}>
                    <Typography variant="body2" color="textSecondary">
                      Priority:
                    </Typography>
                    <Typography variant="body1" style={{ textTransform: 'capitalize' }}>
                      {jobData.priority}
                    </Typography>
                  </Box>
                  
                  <Box mb={2}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Description:
                    </Typography>
                    <Typography variant="body1">
                      {jobData.description}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Resources & Runtime
                  </Typography>
                  
                  <Box className={classes.summaryItem}>
                    <Typography variant="body2" color="textSecondary">
                      Selected Resources:
                    </Typography>
                    <Typography variant="body1">
                      {jobData.selectedResources.length} resource(s)
                    </Typography>
                  </Box>
                  
                  <Box className={classes.summaryItem}>
                    <Typography variant="body2" color="textSecondary">
                      Selected Datasets:
                    </Typography>
                    <Typography variant="body1">
                      {jobData.selectedDatasets.length} dataset(s)
                    </Typography>
                  </Box>
                  
                  <Box className={classes.summaryItem}>
                    <Typography variant="body2" color="textSecondary">
                      Estimated Runtime:
                    </Typography>
                    <Typography variant="body1">
                      {jobData.estimatedRuntime} hours
                    </Typography>
                  </Box>
                  
                  <Box className={classes.summaryItem}>
                    <Typography variant="body2" color="textSecondary">
                      Estimated Cost:
                    </Typography>
                    <Typography variant="body1" color="primary">
                      {jobData.estimatedCost} CAL
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              
              <Divider className={classes.divider} />
              
              <Box display="flex" justifyContent="center" alignItems="center">
                <Typography variant="body2" color="textSecondary">
                  By submitting this job, you agree to pay the estimated cost in CAL tokens. 
                  Actual costs may vary based on the actual runtime of your job.
                </Typography>
              </Box>
            </Paper>
          </Box>
        );
        
      default:
        return 'Unknown step';
    }
  };
  
  return (
    <Container className={classes.root}>
      <Typography variant="h4" component="h1" gutterBottom>
        Create New Job
      </Typography>
      
      <Paper className={classes.paper}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {getStepContent(activeStep)}
        
        <Box className={classes.buttonContainer}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
          
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? 'Submitting...' : 'Submit Job'}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleNext}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default JobCreation; 