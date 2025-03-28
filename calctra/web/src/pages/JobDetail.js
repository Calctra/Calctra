import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Paper, Button, Box, Chip, CircularProgress,
  Divider, Grid, IconButton, Snackbar, Alert, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, LinearProgress,
  Tab, Tabs, List, ListItem, ListItemText, ListItemIcon, Card, CardContent
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
  ArrowBack as ArrowBackIcon,
  DeleteOutline as DeleteIcon,
  Cancel as CancelIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  GetApp as DownloadIcon,
  Storage as StorageIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Code as CodeIcon,
  Memory as MemoryIcon,
  Description as DescriptionIcon,
  AttachMoney as MoneyIcon,
  Settings as SettingsIcon,
  ShowChart as ChartIcon,
  Terminal as TerminalIcon,
  CloudDownload as CloudDownloadIcon
} from '@mui/icons-material';
import { fetchJobById, cancelJob, deleteJob } from '../redux/slices/jobSlice';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
  },
  header: {
    marginBottom: theme.spacing(3),
    display: 'flex',
    alignItems: 'center',
  },
  backButton: {
    marginRight: theme.spacing(2),
  },
  paper: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
  },
  chip: {
    margin: theme.spacing(0.5),
  },
  statusChip: {
    marginLeft: theme.spacing(1),
  },
  divider: {
    margin: theme.spacing(2, 0),
  },
  actionButton: {
    margin: theme.spacing(1),
  },
  progressContainer: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  },
  icon: {
    marginRight: theme.spacing(1),
    color: theme.palette.text.secondary,
  },
  logsContainer: {
    backgroundColor: theme.palette.grey[900],
    color: theme.palette.common.white,
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    fontFamily: 'monospace',
    height: 300,
    overflow: 'auto',
    marginTop: theme.spacing(2),
  },
  tabPanel: {
    padding: theme.spacing(2, 0),
  },
  codeBlock: {
    backgroundColor: theme.palette.grey[100],
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    fontFamily: 'monospace',
    overflow: 'auto',
    marginTop: theme.spacing(2),
  },
  resourceDetail: {
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
  },
  metricsCard: {
    height: '100%',
  },
  metricValue: {
    fontWeight: 'bold',
    fontSize: '1.5rem',
    color: theme.palette.primary.main,
  },
  listItemIcon: {
    minWidth: 36,
  },
}));

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const getStatusColor = (status) => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'running':
      return 'primary';
    case 'pending':
      return 'default';
    case 'failed':
      return 'error';
    case 'cancelled':
      return 'warning';
    default:
      return 'default';
  }
};

const getJobProgress = (job) => {
  switch (job.status) {
    case 'completed':
      return 100;
    case 'running':
      return job.progress || 50; // Example progress
    case 'pending':
      return 0;
    case 'failed':
      return job.progress || 0;
    case 'cancelled':
      return job.progress || 0;
    default:
      return 0;
  }
};

const JobDetail = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { jobId } = useParams();
  
  const { currentJob, isLoading, error } = useSelector((state) => state.jobs);
  const { user } = useSelector((state) => state.auth);
  
  const [tabValue, setTabValue] = useState(0);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Mock logs for demonstration
  const [logs, setLogs] = useState([]);
  
  useEffect(() => {
    if (jobId) {
      dispatch(fetchJobById(jobId));
    }
  }, [dispatch, jobId]);
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  // Mock log generation for demonstration
  useEffect(() => {
    if (currentJob && currentJob.status === 'running') {
      const mockLogs = [
        `[${new Date().toISOString()}] Job ${currentJob.id} started`,
        `[${new Date().toISOString()}] Initializing resources...`,
        `[${new Date().toISOString()}] Loading data from source...`,
        `[${new Date().toISOString()}] Processing batch 1/10...`,
        `[${new Date().toISOString()}] Processing batch 2/10...`,
        `[${new Date().toISOString()}] Intermediate results saved to storage`,
        `[${new Date().toISOString()}] Processing batch 3/10...`,
      ];
      setLogs(mockLogs);
    } else if (currentJob && currentJob.status === 'completed') {
      const mockLogs = [
        `[${new Date().toISOString()}] Job ${currentJob.id} started`,
        `[${new Date().toISOString()}] Initializing resources...`,
        `[${new Date().toISOString()}] Loading data from source...`,
        `[${new Date().toISOString()}] Processing batch 1/10...`,
        `[${new Date().toISOString()}] Processing batch 10/10...`,
        `[${new Date().toISOString()}] All batches processed successfully`,
        `[${new Date().toISOString()}] Saving results to storage...`,
        `[${new Date().toISOString()}] Job completed successfully`,
      ];
      setLogs(mockLogs);
    }
  }, [currentJob]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleCancelConfirm = () => {
    if (currentJob) {
      dispatch(cancelJob(currentJob.id))
        .unwrap()
        .then(() => {
          setSnackbar({
            open: true,
            message: 'Job cancelled successfully',
            severity: 'success'
          });
        })
        .catch((error) => {
          setSnackbar({
            open: true,
            message: error || 'Failed to cancel job',
            severity: 'error'
          });
        });
    }
    setCancelDialogOpen(false);
  };
  
  const handleDeleteConfirm = () => {
    if (currentJob) {
      dispatch(deleteJob(currentJob.id))
        .unwrap()
        .then(() => {
          setSnackbar({
            open: true,
            message: 'Job deleted successfully',
            severity: 'success'
          });
          // Navigate back to jobs list after successful deletion
          setTimeout(() => {
            navigate('/jobs');
          }, 1500);
        })
        .catch((error) => {
          setSnackbar({
            open: true,
            message: error || 'Failed to delete job',
            severity: 'error'
          });
        });
    }
    setDeleteDialogOpen(false);
  };
  
  const handleDownloadResults = () => {
    setSnackbar({
      open: true,
      message: 'Results download feature coming soon',
      severity: 'info'
    });
  };
  
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };
  
  if (isLoading) {
    return (
      <Container className={classes.root}>
        <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className={classes.root}>
        <Alert severity="error">
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/jobs')}
          style={{ marginTop: 16 }}
        >
          Back to Jobs
        </Button>
      </Container>
    );
  }
  
  if (!currentJob) {
    return (
      <Container className={classes.root}>
        <Alert severity="info">
          Job not found or you don't have permission to view it.
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/jobs')}
          style={{ marginTop: 16 }}
        >
          Back to Jobs
        </Button>
      </Container>
    );
  }
  
  return (
    <Container className={classes.root}>
      <Box className={classes.header}>
        <IconButton 
          className={classes.backButton} 
          onClick={() => navigate('/jobs')}
          size="large"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          {currentJob.name}
          <Chip
            label={currentJob.status}
            color={getStatusColor(currentJob.status)}
            size="small"
            className={classes.statusChip}
          />
        </Typography>
      </Box>
      
      <Paper className={classes.paper}>
        <Box mb={2}>
          <Typography variant="h6" gutterBottom>
            Job Details
          </Typography>
          <Typography variant="body1" paragraph>
            {currentJob.description}
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box className={classes.infoRow}>
                <CalendarIcon className={classes.icon} />
                <Typography variant="body2">
                  Created: {new Date(currentJob.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
              
              <Box className={classes.infoRow}>
                <TimeIcon className={classes.icon} />
                <Typography variant="body2">
                  Estimated runtime: {currentJob.estimatedRuntime || '1'} hours
                </Typography>
              </Box>
              
              <Box className={classes.infoRow}>
                <MoneyIcon className={classes.icon} />
                <Typography variant="body2">
                  Estimated cost: {currentJob.estimatedCost || '5'} CAL
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box className={classes.infoRow}>
                <CodeIcon className={classes.icon} />
                <Typography variant="body2">
                  Job type: {currentJob.type === 'custom_code' ? 'Custom Code' : 'Data Processing'}
                </Typography>
              </Box>
              
              <Box className={classes.infoRow}>
                <MemoryIcon className={classes.icon} />
                <Typography variant="body2">
                  Resources: {currentJob.resources?.length || 0} computing resource(s)
                </Typography>
              </Box>
              
              <Box className={classes.infoRow}>
                <StorageIcon className={classes.icon} />
                <Typography variant="body2">
                  Datasets: {currentJob.datasets?.length || 0} dataset(s)
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          {currentJob.status === 'running' && (
            <Box className={classes.progressContainer}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2">Progress</Typography>
                <Typography variant="body2">{getJobProgress(currentJob)}%</Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={getJobProgress(currentJob)} 
                color="primary" 
              />
            </Box>
          )}
          
          {currentJob.resources && currentJob.resources.length > 0 && (
            <Box mt={3}>
              <Typography variant="subtitle2" gutterBottom>
                Resources:
              </Typography>
              {currentJob.resources.map((resource, index) => (
                <Box key={index} className={classes.resourceDetail}>
                  <Typography variant="subtitle2">
                    {resource.name || `Resource ${index + 1}`}
                  </Typography>
                  <Box display="flex" flexWrap="wrap" mt={1}>
                    <Chip
                      label={resource.type || 'CPU'}
                      size="small"
                      className={classes.chip}
                      color="primary"
                    />
                    <Chip
                      label={`${resource.cpu || 4} CPU Cores`}
                      size="small"
                      className={classes.chip}
                    />
                    <Chip
                      label={`${resource.memory || 8} GB RAM`}
                      size="small"
                      className={classes.chip}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
        
        <Divider className={classes.divider} />
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            {currentJob.status === 'completed' && (
              <Button
                variant="outlined"
                startIcon={<CloudDownloadIcon />}
                onClick={handleDownloadResults}
                className={classes.actionButton}
              >
                Download Results
              </Button>
            )}
          </Box>
          
          <Box>
            {currentJob.status === 'running' && (
              <Button
                variant="outlined"
                color="warning"
                startIcon={<CancelIcon />}
                onClick={() => setCancelDialogOpen(true)}
                className={classes.actionButton}
              >
                Cancel Job
              </Button>
            )}
            
            {['completed', 'failed', 'cancelled'].includes(currentJob.status) && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialogOpen(true)}
                className={classes.actionButton}
              >
                Delete Job
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
      
      <Paper className={classes.paper}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="job details tabs">
            <Tab label="Logs" icon={<TerminalIcon />} iconPosition="start" />
            <Tab label="Metrics" icon={<ChartIcon />} iconPosition="start" />
            <Tab label="Results" icon={<DescriptionIcon />} iconPosition="start" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0} className={classes.tabPanel}>
          <Typography variant="subtitle1" gutterBottom>
            Execution Logs
          </Typography>
          
          <Box className={classes.logsContainer}>
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <Typography variant="body2" key={index} style={{ marginBottom: 4 }}>
                  {log}
                </Typography>
              ))
            ) : (
              <Typography variant="body2">No logs available</Typography>
            )}
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1} className={classes.tabPanel}>
          <Typography variant="subtitle1" gutterBottom>
            Performance Metrics
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card className={classes.metricsCard}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    CPU Usage
                  </Typography>
                  <Typography className={classes.metricValue}>
                    {currentJob.status === 'running' ? '64%' : '0%'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card className={classes.metricsCard}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Memory Usage
                  </Typography>
                  <Typography className={classes.metricValue}>
                    {currentJob.status === 'running' ? '4.2 GB' : '0 GB'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card className={classes.metricsCard}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Runtime
                  </Typography>
                  <Typography className={classes.metricValue}>
                    {currentJob.runtime || '00:45:32'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card className={classes.metricsCard}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Cost Incurred
                  </Typography>
                  <Typography className={classes.metricValue}>
                    {currentJob.actualCost || '2.5'} CAL
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Box mt={4}>
            <Typography variant="subtitle2" gutterBottom>
              Metrics over time
            </Typography>
            <Box className={classes.codeBlock} display="flex" justifyContent="center" alignItems="center" height={200}>
              <Typography variant="body2" color="textSecondary">
                Detailed metrics visualization not available in this demo
              </Typography>
            </Box>
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2} className={classes.tabPanel}>
          <Typography variant="subtitle1" gutterBottom>
            Job Results
          </Typography>
          
          {currentJob.status === 'completed' ? (
            <>
              <List>
                <ListItem>
                  <ListItemIcon className={classes.listItemIcon}>
                    <DescriptionIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="results.csv"
                    secondary="Generated on completion - 2.4 MB"
                  />
                  <Button 
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadResults}
                    size="small"
                  >
                    Download
                  </Button>
                </ListItem>
                <ListItem>
                  <ListItemIcon className={classes.listItemIcon}>
                    <DescriptionIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="summary.json"
                    secondary="Summary statistics - 125 KB"
                  />
                  <Button 
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadResults}
                    size="small"
                  >
                    Download
                  </Button>
                </ListItem>
              </List>
              
              <Typography variant="subtitle2" gutterBottom mt={3}>
                Result Summary
              </Typography>
              <Box className={classes.codeBlock}>
                <code>
                  {`{\n  "status": "success",\n  "processedItems": 10000,\n  "executionTime": "00:45:32",\n  "outputFiles": 2,\n  "aggregatedMetrics": {\n    "accuracy": 0.94,\n    "precision": 0.91,\n    "recall": 0.89\n  }\n}`}
                </code>
              </Box>
            </>
          ) : (
            <Alert severity="info">
              Results will be available once the job completes successfully.
            </Alert>
          )}
        </TabPanel>
      </Paper>
      
      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
      >
        <DialogTitle>Cancel Job</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this job? Any progress will be lost and you'll still be charged for resources used so far.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>No, Continue Job</Button>
          <Button onClick={handleCancelConfirm} color="warning" variant="contained">
            Yes, Cancel Job
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Job</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this job and all associated data? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
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

export default JobDetail; 