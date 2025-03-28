import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Tabs,
  Tab,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@material-ui/core';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CloudUpload as CloudUploadIcon,
  Assessment as AssessmentIcon,
  Storage as StorageIcon,
  CloudQueue as CloudQueueIcon,
  PowerSettingsNew as PowerIcon,
  AttachMoney as MoneyIcon,
} from '@material-ui/icons';
import { Alert } from '@material-ui/lab';
import { makeStyles } from '@material-ui/core/styles';
import { fetchMyResources } from '../redux/slices/resourceSlice';
import { fetchMyJobs } from '../redux/slices/jobSlice';
import { RESOURCE_TYPES, JOB_STATUS } from '../utils/constants';
import DataVisualization from '../components/Dashboard/DataVisualization';

const useStyles = makeStyles((theme) => ({
  root: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(6),
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(4),
  },
  tabPanel: {
    marginTop: theme.spacing(3),
  },
  welcomeCard: {
    marginBottom: theme.spacing(4),
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  },
  welcomeContent: {
    padding: theme.spacing(3),
  },
  statsContainer: {
    marginBottom: theme.spacing(4),
  },
  statsCard: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 500,
    marginBottom: theme.spacing(1),
  },
  statIcon: {
    float: 'right',
    fontSize: '3rem',
    opacity: 0.6,
  },
  card: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  cardContent: {
    flexGrow: 1,
  },
  resourceChip: {
    margin: theme.spacing(0.5),
  },
  jobStatus: {
    display: 'flex',
    alignItems: 'center',
    marginTop: theme.spacing(1),
  },
  statusChip: {
    marginLeft: 'auto',
  },
  progressBar: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  addButton: {
    marginLeft: theme.spacing(1),
  },
  emptyState: {
    textAlign: 'center',
    padding: theme.spacing(5),
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(5),
  },
  tokenBalance: {
    marginTop: theme.spacing(1),
    display: 'flex',
    alignItems: 'center',
  },
  tokenIcon: {
    marginRight: theme.spacing(1),
    color: theme.palette.secondary.main,
  },
  welcomeActions: {
    justifyContent: 'flex-start',
    paddingLeft: theme.spacing(2),
    paddingBottom: theme.spacing(2),
  },
}));

// Tab Panel Component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
}

const Dashboard = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { myResources, isLoading: resourcesLoading, error: resourcesError } = useSelector((state) => state.resources);
  const { myJobs, isLoading: jobsLoading, error: jobsError } = useSelector((state) => state.jobs);
  
  const [tabValue, setTabValue] = useState(0);
  const [dialog, setDialog] = useState({ open: false, type: '', id: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    dispatch(fetchMyResources());
    dispatch(fetchMyJobs());

    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');
      
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 模拟数据
        setDashboardData({
          resources: {
            active: 5,
            total: 12,
            utilizationRate: 68,
            earnings: 324.5
          },
          jobs: {
            active: 3,
            completed: 42,
            failed: 5,
            spending: 187.25
          },
          datasets: {
            shared: 7,
            total: 15,
            storage: 256, // GB
            dataPoints: 12500000
          },
          walletBalance: 645.75,
          recentJobs: [
            { id: 'job-123', name: 'Neural Network Training', status: 'completed', completion: 100, timestamp: '2023-03-26T15:30:00Z' },
            { id: 'job-124', name: 'Data Transformation Pipeline', status: 'active', completion: 67, timestamp: '2023-03-26T18:45:00Z' },
            { id: 'job-125', name: 'Genomic Sequence Analysis', status: 'active', completion: 34, timestamp: '2023-03-27T09:20:00Z' },
            { id: 'job-126', name: 'Climate Simulation Model', status: 'queued', completion: 0, timestamp: '2023-03-27T10:15:00Z' }
          ],
          recentTransactions: [
            { id: 'tx-789', type: 'Resource Payment', amount: -25.5, timestamp: '2023-03-26T14:22:00Z' },
            { id: 'tx-790', type: 'Resource Earnings', amount: 42.75, timestamp: '2023-03-26T10:45:00Z' },
            { id: 'tx-791', type: 'Dataset Access Fee', amount: -5.0, timestamp: '2023-03-25T16:30:00Z' }
          ],
          notifications: [
            { id: 'notif-45', message: 'Your job "Neural Network Training" has completed.', read: false, timestamp: '2023-03-26T15:32:00Z' },
            { id: 'notif-46', message: 'Your resource "GPU Cluster A" has been rented.', read: false, timestamp: '2023-03-26T12:15:00Z' },
            { id: 'notif-47', message: 'New payment of 42.75 CAL received.', read: true, timestamp: '2023-03-26T10:47:00Z' }
          ]
        });
      } catch (err) {
        setError('Failed to load dashboard data. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [dispatch, user, navigate]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleAddResource = () => {
    navigate('/resources/add');
  };

  const handleAddJob = () => {
    navigate('/jobs/add');
  };

  const handleEditResource = (resourceId) => {
    navigate(`/resources/edit/${resourceId}`);
  };

  const handleViewJob = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  const handleDeleteConfirm = (type, id) => {
    setDialog({ open: true, type, id });
  };

  const handleDeleteCancel = () => {
    setDialog({ open: false, type: '', id: null });
  };

  const handleDeleteConfirmed = () => {
    if (dialog.type === 'resource') {
      // Implementation of delete resource will go here
      console.log(`Delete resource ${dialog.id}`);
    } else if (dialog.type === 'job') {
      // Implementation of delete job will go here
      console.log(`Delete job ${dialog.id}`);
    }
    
    setDialog({ open: false, type: '', id: null });
  };

  const getJobStatusColor = (status) => {
    switch (status) {
      case JOB_STATUS.PENDING:
        return 'default';
      case JOB_STATUS.PROCESSING:
        return 'primary';
      case JOB_STATUS.COMPLETED:
        return 'success';
      case JOB_STATUS.FAILED:
        return 'error';
      case JOB_STATUS.CANCELLED:
        return 'warning';
      default:
        return 'default';
    }
  };

  const getJobProgress = (job) => {
    switch (job.status) {
      case JOB_STATUS.PENDING:
        return 0;
      case JOB_STATUS.PROCESSING:
        return job.progress || 50;
      case JOB_STATUS.COMPLETED:
        return 100;
      case JOB_STATUS.FAILED:
      case JOB_STATUS.CANCELLED:
        return job.progress || 0;
      default:
        return 0;
    }
  };

  const isLoading = resourcesLoading || jobsLoading;
  const hasError = resourcesError || jobsError;

  if (isLoading) {
    return (
      <div className={classes.loadingContainer}>
        <CircularProgress />
      </div>
    );
  }

  if (hasError) {
    return (
      <Container className={classes.root}>
        <Alert severity="error">
          {resourcesError || jobsError}
        </Alert>
      </Container>
    );
  }

  if (!dashboardData) {
    return (
      <Container className={classes.root}>
        <Alert severity="warning">No dashboard data available.</Alert>
      </Container>
    );
  }

  return (
    <Container className={classes.root}>
      <div className={classes.header}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
      </div>

      <Card className={classes.welcomeCard}>
        <CardContent className={classes.welcomeContent}>
          <Typography variant="h5" gutterBottom>
            Welcome back, {user?.name || 'User'}
          </Typography>
          <Typography variant="body1">
            Manage your computing resources, jobs, and data all in one place.
          </Typography>
          <div className={classes.tokenBalance}>
            <MoneyIcon className={classes.tokenIcon} />
            <Typography variant="body1">
              Balance: <strong>{user?.tokenBalance || '0'} CAL</strong>
            </Typography>
          </div>
        </CardContent>
        <CardActions className={classes.welcomeActions}>
          <Button 
            variant="contained" 
            color="secondary" 
            startIcon={<CloudUploadIcon />}
            onClick={() => navigate('/jobs/add')}
          >
            Submit New Job
          </Button>
          <Button 
            variant="outlined" 
            color="inherit" 
            startIcon={<AddIcon />}
            onClick={() => navigate('/resources/add')}
            style={{ marginLeft: 8 }}
          >
            Register Resource
          </Button>
        </CardActions>
      </Card>

      <Grid container spacing={3} className={classes.statsContainer}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper className={classes.statsCard}>
            <CardContent>
              <StorageIcon className={classes.statIcon} />
              <Typography variant="overline">My Resources</Typography>
              <Typography className={classes.statValue}>
                {myResources?.length || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Active computing resources
              </Typography>
            </CardContent>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper className={classes.statsCard}>
            <CardContent>
              <CloudQueueIcon className={classes.statIcon} />
              <Typography variant="overline">Active Jobs</Typography>
              <Typography className={classes.statValue}>
                {myJobs?.filter(job => job.status === JOB_STATUS.PROCESSING).length || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Currently processing
              </Typography>
            </CardContent>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper className={classes.statsCard}>
            <CardContent>
              <PowerIcon className={classes.statIcon} />
              <Typography variant="overline">Completed Jobs</Typography>
              <Typography className={classes.statValue}>
                {myJobs?.filter(job => job.status === JOB_STATUS.COMPLETED).length || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Successfully finished
              </Typography>
            </CardContent>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper className={classes.statsCard}>
            <CardContent>
              <AssessmentIcon className={classes.statIcon} />
              <Typography variant="overline">Earnings</Typography>
              <Typography className={classes.statValue}>
                {user?.earnings || '0'} CAL
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total earned from resources
              </Typography>
            </CardContent>
          </Paper>
        </Grid>
      </Grid>

      <Paper>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label="My Resources" />
          <Tab label="My Jobs" />
          <Tab label="Account" />
        </Tabs>

        {/* Resources Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddResource}
            >
              Add Resource
            </Button>
          </Box>

          {myResources?.length === 0 ? (
            <Paper className={classes.emptyState}>
              <Typography variant="h6" gutterBottom>
                No resources found
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                You haven't registered any computing resources yet.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddResource}
              >
                Register Your First Resource
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {myResources?.map((resource) => (
                <Grid item key={resource.id} xs={12} md={6}>
                  <Card className={classes.card}>
                    <CardContent className={classes.cardContent}>
                      <Typography variant="h6" component="h2">
                        {resource.name}
                      </Typography>
                      <Box mb={1}>
                        <Chip 
                          label={resource.type} 
                          color="primary" 
                          size="small" 
                          className={classes.resourceChip} 
                        />
                        <Chip 
                          label={resource.active ? 'Active' : 'Inactive'} 
                          color={resource.active ? 'primary' : 'default'} 
                          size="small" 
                          className={classes.resourceChip} 
                        />
                      </Box>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        {resource.description}
                      </Typography>
                      <Divider />
                      <List dense>
                        <ListItem>
                          <ListItemText primary="CPU Cores" secondary={resource.cpu} />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Memory" secondary={`${resource.memory} GB`} />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Storage" secondary={`${resource.storage} GB`} />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Price" secondary={`${resource.pricePerHour} CAL/hour`} />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Utilization" 
                            secondary={
                              <LinearProgress 
                                variant="determinate" 
                                value={resource.utilization || 0} 
                                className={classes.progressBar} 
                              />
                            } 
                          />
                          <ListItemSecondaryAction>
                            <Typography variant="body2">
                              {resource.utilization || 0}%
                            </Typography>
                          </ListItemSecondaryAction>
                        </ListItem>
                      </List>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        color="primary"
                        startIcon={<EditIcon />}
                        onClick={() => handleEditResource(resource.id)}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="small" 
                        color="secondary"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteConfirm('resource', resource.id)}
                      >
                        Delete
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* Jobs Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddJob}
            >
              Submit New Job
            </Button>
          </Box>

          {myJobs?.length === 0 ? (
            <Paper className={classes.emptyState}>
              <Typography variant="h6" gutterBottom>
                No jobs found
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                You haven't submitted any computing jobs yet.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddJob}
              >
                Submit Your First Job
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {myJobs?.map((job) => (
                <Grid item key={job.id} xs={12}>
                  <Card className={classes.card}>
                    <CardContent className={classes.cardContent}>
                      <Typography variant="h6" component="h2">
                        {job.name}
                      </Typography>
                      <div className={classes.jobStatus}>
                        <Typography variant="body2" color="textSecondary">
                          Submitted: {new Date(job.createdAt).toLocaleString()}
                        </Typography>
                        <Chip 
                          label={job.status}
                          color={getJobStatusColor(job.status)}
                          size="small"
                          className={classes.statusChip}
                        />
                      </div>
                      <LinearProgress 
                        variant="determinate" 
                        value={getJobProgress(job)} 
                        className={classes.progressBar} 
                      />
                      <Typography variant="body2" paragraph>
                        {job.description}
                      </Typography>
                      <Divider />
                      <List dense>
                        <ListItem>
                          <ListItemText primary="Resource Type" secondary={job.resourceType} />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="CPU Cores" secondary={job.cpuRequired} />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Memory Required" secondary={`${job.memoryRequired} GB`} />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Storage Required" secondary={`${job.storageRequired} GB`} />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Cost" secondary={`${job.cost || '0'} CAL`} />
                        </ListItem>
                      </List>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        color="primary"
                        onClick={() => handleViewJob(job.id)}
                      >
                        View Details
                      </Button>
                      {job.status === JOB_STATUS.PENDING && (
                        <Button 
                          size="small" 
                          color="secondary"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteConfirm('job', job.id)}
                        >
                          Cancel Job
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* Account Tab */}
        <TabPanel value={tabValue} index={2}>
          <Paper>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Information
              </Typography>
              <List>
                <ListItem>
                  <ListItemText primary="Name" secondary={user?.name} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Email" secondary={user?.email} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="CAL Token Balance" secondary={`${user?.tokenBalance || '0'} CAL`} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Total Earnings" secondary={`${user?.earnings || '0'} CAL`} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Account Created" secondary={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'} />
                </ListItem>
              </List>
              <Box mt={2} display="flex" justifyContent="flex-start">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/profile/edit')}
                >
                  Edit Profile
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  style={{ marginLeft: 8 }}
                  onClick={() => navigate('/wallet')}
                >
                  Manage Wallet
                </Button>
              </Box>
            </CardContent>
          </Paper>
        </TabPanel>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog
        open={dialog.open}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {dialog.type === 'resource' ? 'Delete Resource' : 'Cancel Job'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {dialog.type === 'resource'
              ? 'Are you sure you want to delete this resource? This action cannot be undone.'
              : 'Are you sure you want to cancel this job? This action cannot be undone.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            No, Keep It
          </Button>
          <Button onClick={handleDeleteConfirmed} color="secondary" autoFocus>
            Yes, {dialog.type === 'resource' ? 'Delete' : 'Cancel'}
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ mb: 4 }}>
        <DataVisualization />
      </Box>
    </Container>
  );
};

export default Dashboard; 