import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Paper, Button, TextField,
  Box, CircularProgress, Chip, Dialog, DialogActions,
  DialogContent, DialogContentText, DialogTitle,
  Snackbar, Alert, Card, CardContent, LinearProgress,
  Grid, IconButton, Menu, MenuItem, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tooltip
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Cancel as CancelIcon,
  PlayArrow as PlayArrowIcon,
  Code as CodeIcon,
  Storage as StorageIcon,
  Description as DescriptionIcon,
  MoreVert as MoreVertIcon,
  Settings as SettingsIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { fetchMyJobs, cancelJob, deleteJob } from '../redux/slices/jobSlice';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
  },
  pageHeader: {
    marginBottom: theme.spacing(3),
  },
  paper: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
  },
  tableContainer: {
    marginTop: theme.spacing(2),
  },
  statusChip: {
    minWidth: 80,
  },
  jobCard: {
    marginBottom: theme.spacing(2),
  },
  progressBar: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  codeSnippet: {
    backgroundColor: theme.palette.grey[100],
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    fontFamily: 'monospace',
    overflowX: 'auto',
    marginTop: theme.spacing(1),
  },
  formContainer: {
    marginTop: theme.spacing(2),
  },
  cardActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    paddingRight: theme.spacing(2),
    paddingBottom: theme.spacing(2),
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  },
  infoIcon: {
    marginRight: theme.spacing(1),
    color: theme.palette.text.secondary,
  },
  resourceChip: {
    margin: theme.spacing(0.5),
  },
  noWrap: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
}));

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

const JobManagement = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { jobs, isLoading, error } = useSelector((state) => state.jobs);
  const { user } = useSelector((state) => state.auth);
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuJob, setMenuJob] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  useEffect(() => {
    if (user) {
      dispatch(fetchMyJobs());
    } else {
      navigate('/login');
    }
  }, [dispatch, user, navigate]);

  const handleMenuOpen = (event, job) => {
    setAnchorEl(event.currentTarget);
    setMenuJob(job);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuJob(null);
  };

  const handleCreateJob = () => {
    // Navigate to job creation page
    navigate('/jobs/create');
    setCreateDialogOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (selectedJob) {
      dispatch(deleteJob(selectedJob.id))
        .unwrap()
        .then(() => {
          setSnackbar({
            open: true,
            message: 'Job deleted successfully!',
            severity: 'success'
          });
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
    setSelectedJob(null);
  };

  const handleCancelConfirm = () => {
    if (selectedJob) {
      dispatch(cancelJob(selectedJob.id))
        .unwrap()
        .then(() => {
          setSnackbar({
            open: true,
            message: 'Job cancelled successfully!',
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
    setSelectedJob(null);
  };

  const handleRefresh = () => {
    dispatch(fetchMyJobs());
  };

  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  const handleViewJobDetails = (jobId) => {
    navigate(`/jobs/${jobId}`);
    handleMenuClose();
  };

  const handleCancelJob = (job) => {
    setSelectedJob(job);
    setCancelDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteJob = (job) => {
    setSelectedJob(job);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const renderJobList = () => {
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (jobs.length === 0) {
      return (
        <Paper className={classes.paper}>
          <Typography variant="body1" align="center">
            No jobs found. Create a new job to get started!
          </Typography>
        </Paper>
      );
    }

    return (
      <TableContainer component={Paper} className={classes.tableContainer}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Job Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Resources</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Est. Cost</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell>{job.name}</TableCell>
                <TableCell>{job.type}</TableCell>
                <TableCell>
                  {job.resources?.map((resource, index) => (
                    <Chip 
                      key={index}
                      label={resource.name || `Resource ${index + 1}`}
                      size="small"
                      className={classes.resourceChip}
                    />
                  ))}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={job.status}
                    color={getStatusColor(job.status)}
                    size="small"
                    className={classes.statusChip}
                  />
                </TableCell>
                <TableCell>{new Date(job.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>{job.estimatedCost ? `${job.estimatedCost} CAL` : 'N/A'}</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={(event) => handleMenuOpen(event, job)}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Container className={classes.root}>
      <Box display="flex" justifyContent="space-between" alignItems="center" className={classes.pageHeader}>
        <Typography variant="h4">Job Management</Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={handleRefresh}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Job
          </Button>
        </Box>
      </Box>

      <Paper className={classes.paper}>
        <Typography variant="h6" gutterBottom>
          Compute Jobs
        </Typography>
        {renderJobList()}
      </Paper>

      {/* Job Details Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleViewJobDetails(menuJob?.id)}>
          <DescriptionIcon fontSize="small" style={{ marginRight: 8 }} />
          View Details
        </MenuItem>
        {menuJob?.status === 'running' && (
          <MenuItem onClick={() => handleCancelJob(menuJob)}>
            <CancelIcon fontSize="small" style={{ marginRight: 8 }} />
            Cancel Job
          </MenuItem>
        )}
        <MenuItem onClick={() => handleDeleteJob(menuJob)}>
          <DeleteIcon fontSize="small" style={{ marginRight: 8 }} />
          Delete Job
        </MenuItem>
      </Menu>

      {/* Create Job Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
      >
        <DialogTitle>Create New Job</DialogTitle>
        <DialogContent>
          <DialogContentText>
            What type of compute job would you like to create?
          </DialogContentText>
          <Box className={classes.formContainer}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card 
                  className={classes.jobCard} 
                  onClick={handleCreateJob}
                  sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={1}>
                      <CodeIcon fontSize="large" color="primary" />
                      <Typography variant="h6" sx={{ ml: 1 }}>
                        Custom Code
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      Upload and run your own code on computing resources.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card 
                  className={classes.jobCard}
                  onClick={handleCreateJob}
                  sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={1}>
                      <StorageIcon fontSize="large" color="primary" />
                      <Typography variant="h6" sx={{ ml: 1 }}>
                        Data Processing
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      Process datasets using predefined workflows.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
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
            Are you sure you want to delete the job "{selectedJob?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
      >
        <DialogTitle>Cancel Job</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel the job "{selectedJob?.name}"? Any in-progress computation will be stopped.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Back</Button>
          <Button onClick={handleCancelConfirm} color="warning" variant="contained">
            Cancel Job
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

export default JobManagement; 