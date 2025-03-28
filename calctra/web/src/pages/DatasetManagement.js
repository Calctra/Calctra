import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Grid, Typography, Paper, Button, TextField, 
  Box, Tabs, Tab, CircularProgress, Divider, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, IconButton, Dialog, DialogActions, DialogContent, 
  DialogContentText, DialogTitle, FormControlLabel, Switch,
  Snackbar, Alert
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { 
  Add as AddIcon, 
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  MoreVert as MoreVertIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { fetchMyDatasets, fetchPublicDatasets, deleteDataset, updateDatasetPermissions } from '../redux/slices/dataSlice';

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
  uploadContainer: {
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    border: `2px dashed ${theme.palette.primary.light}`,
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(3),
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  uploadIcon: {
    fontSize: 48,
    marginBottom: theme.spacing(1),
    color: theme.palette.primary.main,
  },
  datasetCard: {
    padding: theme.spacing(2),
    height: '100%',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  datasetActions: {
    position: 'absolute',
    top: theme.spacing(1),
    right: theme.spacing(1),
  },
  datasetType: {
    position: 'absolute',
    top: theme.spacing(1),
    left: theme.spacing(1),
  },
  tagChip: {
    margin: theme.spacing(0.5),
  },
  tableContainer: {
    marginTop: theme.spacing(2),
  },
  fileInputHidden: {
    display: 'none',
  },
  tabPanel: {
    marginTop: theme.spacing(2),
  },
  tagContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    marginTop: theme.spacing(1),
  },
  formContainer: {
    marginTop: theme.spacing(2),
  },
  buttonProgress: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
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
      {value === index && (
        <Box p={3}>
          {children}
        </Box>
      )}
    </div>
  );
}

const DatasetManagement = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { myDatasets, publicDatasets, isLoading, error } = useSelector((state) => state.data);
  const { user } = useSelector((state) => state.auth);
  
  const [tabValue, setTabValue] = useState(0);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [uploadFormData, setUploadFormData] = useState({
    name: '',
    description: '',
    isPublic: false,
    tags: '',
    file: null,
  });
  const [fileSelected, setFileSelected] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  useEffect(() => {
    if (user) {
      dispatch(fetchMyDatasets());
      dispatch(fetchPublicDatasets());
    } else {
      navigate('/login');
    }
  }, [dispatch, user, navigate]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleFileChange = (event) => {
    if (event.target.files[0]) {
      setUploadFormData({
        ...uploadFormData,
        file: event.target.files[0]
      });
      setFileSelected(true);
    }
  };

  const handleUploadFormChange = (e) => {
    const { name, value, checked } = e.target;
    setUploadFormData({
      ...uploadFormData,
      [name]: name === 'isPublic' ? checked : value,
    });
  };

  const handleUploadSubmit = () => {
    // Upload logic would go here
    // You would dispatch uploadDataset action here
    setUploadDialogOpen(false);
    setSnackbar({
      open: true,
      message: 'Dataset upload functionality coming soon!',
      severity: 'info'
    });
    
    // Reset form
    setUploadFormData({
      name: '',
      description: '',
      isPublic: false,
      tags: '',
      file: null,
    });
    setFileSelected(false);
  };

  const handleDeleteConfirm = () => {
    if (selectedDataset) {
      dispatch(deleteDataset(selectedDataset.id))
        .unwrap()
        .then(() => {
          setSnackbar({
            open: true,
            message: 'Dataset deleted successfully!',
            severity: 'success'
          });
        })
        .catch((error) => {
          setSnackbar({
            open: true,
            message: error || 'Failed to delete dataset',
            severity: 'error'
          });
        });
    }
    setDeleteDialogOpen(false);
    setSelectedDataset(null);
  };

  const handleTogglePublic = (dataset) => {
    dispatch(updateDatasetPermissions({
      datasetId: dataset.id,
      permissions: { isPublic: !dataset.isPublic }
    }))
      .unwrap()
      .then(() => {
        setSnackbar({
          open: true,
          message: `Dataset is now ${!dataset.isPublic ? 'public' : 'private'}!`,
          severity: 'success'
        });
      })
      .catch((error) => {
        setSnackbar({
          open: true,
          message: error || 'Failed to update dataset permissions',
          severity: 'error'
        });
      });
  };

  const handleRefresh = () => {
    dispatch(fetchMyDatasets());
    dispatch(fetchPublicDatasets());
  };

  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  const renderDatasetsList = (datasets) => {
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (datasets.length === 0) {
      return (
        <Paper className={classes.paper}>
          <Typography variant="body1" align="center">
            No datasets found. {tabValue === 0 ? 'Upload a dataset to get started!' : ''}
          </Typography>
        </Paper>
      );
    }

    return (
      <TableContainer component={Paper} className={classes.tableContainer}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Size</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {datasets.map((dataset) => (
              <TableRow key={dataset.id}>
                <TableCell>{dataset.name}</TableCell>
                <TableCell>{dataset.description}</TableCell>
                <TableCell>
                  {dataset.isPublic ? (
                    <Chip icon={<PublicIcon />} label="Public" color="primary" size="small" />
                  ) : (
                    <Chip icon={<LockIcon />} label="Private" color="default" size="small" />
                  )}
                </TableCell>
                <TableCell>{new Date(dataset.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>{dataset.size ? `${(dataset.size / (1024 * 1024)).toFixed(2)} MB` : 'N/A'}</TableCell>
                <TableCell align="right">
                  {tabValue === 0 && (
                    <>
                      <IconButton
                        size="small"
                        onClick={() => handleTogglePublic(dataset)}
                        title={dataset.isPublic ? "Make Private" : "Make Public"}
                      >
                        {dataset.isPublic ? <LockIcon fontSize="small" /> : <PublicIcon fontSize="small" />}
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedDataset(dataset);
                          setDeleteDialogOpen(true);
                        }}
                        title="Delete Dataset"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                  <IconButton 
                    size="small"
                    onClick={() => navigate(`/datasets/${dataset.id}`)}
                    title="View Details"
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
        <Typography variant="h4">Dataset Management</Typography>
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
            onClick={() => setUploadDialogOpen(true)}
          >
            Upload Dataset
          </Button>
        </Box>
      </Box>

      <Paper className={classes.paper}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label="My Datasets" />
          <Tab label="Public Datasets" />
        </Tabs>

        <TabPanel value={tabValue} index={0} className={classes.tabPanel}>
          {renderDatasetsList(myDatasets)}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1} className={classes.tabPanel}>
          {renderDatasetsList(publicDatasets)}
        </TabPanel>
      </Paper>

      {/* Upload Dialog */}
      <Dialog 
        open={uploadDialogOpen} 
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload New Dataset</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Upload your dataset file along with some descriptive information. You can set permissions and add tags to help others find your dataset.
          </DialogContentText>
          
          <Box className={classes.formContainer}>
            <TextField
              margin="dense"
              name="name"
              label="Dataset Name"
              type="text"
              fullWidth
              variant="outlined"
              value={uploadFormData.name}
              onChange={handleUploadFormChange}
            />
            
            <TextField
              margin="dense"
              name="description"
              label="Description"
              type="text"
              fullWidth
              variant="outlined"
              multiline
              rows={3}
              value={uploadFormData.description}
              onChange={handleUploadFormChange}
            />
            
            <TextField
              margin="dense"
              name="tags"
              label="Tags (comma separated)"
              type="text"
              fullWidth
              variant="outlined"
              value={uploadFormData.tags}
              onChange={handleUploadFormChange}
              helperText="Example: physics, simulation, fluid-dynamics"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={uploadFormData.isPublic}
                  onChange={handleUploadFormChange}
                  name="isPublic"
                  color="primary"
                />
              }
              label="Make this dataset public"
            />
            
            <Box sx={{ mt: 2 }}>
              <input
                accept="*/*"
                className={classes.fileInputHidden}
                id="dataset-file-upload"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="dataset-file-upload">
                <Box className={classes.uploadContainer}>
                  <CloudUploadIcon className={classes.uploadIcon} />
                  <Typography variant="body1">
                    {fileSelected ? "File selected" : "Click to select a file or drag and drop"}
                  </Typography>
                  {fileSelected && (
                    <Typography variant="body2" color="textSecondary">
                      {uploadFormData.file?.name}
                    </Typography>
                  )}
                </Box>
              </label>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleUploadSubmit} 
            color="primary" 
            disabled={!fileSelected || !uploadFormData.name}
            variant="contained"
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Dataset</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the dataset "{selectedDataset?.name}"? This action cannot be undone.
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

export default DatasetManagement; 