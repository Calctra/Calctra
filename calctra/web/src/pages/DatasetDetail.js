import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Paper, Button, Box, Chip, CircularProgress,
  Divider, Grid, IconButton, Snackbar, Alert, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, TextField,
  Tab, Tabs, List, ListItem, ListItemText, ListItemIcon, Switch,
  FormControlLabel
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
  Public as PublicIcon,
  Lock as LockIcon,
  ArrowBack as ArrowBackIcon,
  DeleteOutline as DeleteIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Storage as StorageIcon,
  CalendarToday as CalendarIcon,
  Memory as MemoryIcon,
  People as PeopleIcon,
  Code as CodeIcon,
  FileCopy as FileIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { fetchDatasetById, updateDatasetPermissions, deleteDataset } from '../redux/slices/dataSlice';

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
  metadataItem: {
    marginBottom: theme.spacing(2),
  },
  chip: {
    margin: theme.spacing(0.5),
  },
  typeChip: {
    marginLeft: theme.spacing(1),
  },
  divider: {
    margin: theme.spacing(2, 0),
  },
  actionButton: {
    margin: theme.spacing(1),
  },
  infoBox: {
    backgroundColor: theme.palette.info.light,
    color: theme.palette.info.contrastText,
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(3),
  },
  codeBlock: {
    backgroundColor: theme.palette.grey[100],
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    fontFamily: 'monospace',
    overflow: 'auto',
    marginTop: theme.spacing(2),
  },
  tabPanel: {
    padding: theme.spacing(2, 0),
  },
  dataPreviewContainer: {
    maxHeight: 400,
    overflow: 'auto',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    marginTop: theme.spacing(2),
  },
  previewPlaceholder: {
    height: 200,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.palette.grey[100],
    borderRadius: theme.shape.borderRadius,
  },
  iconWithText: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  },
  icon: {
    marginRight: theme.spacing(1),
    color: theme.palette.text.secondary,
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
      {value === index && (
        <Box>{children}</Box>
      )}
    </div>
  );
}

const DatasetDetail = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { datasetId } = useParams();
  
  const { currentDataset, isLoading, error } = useSelector((state) => state.data);
  const { user } = useSelector((state) => state.auth);
  
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [encryptDialogOpen, setEncryptDialogOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [encryptionKey, setEncryptionKey] = useState('');
  
  // Check if user is the owner of the dataset
  const isOwner = user && currentDataset && user.id === currentDataset.userId;
  
  useEffect(() => {
    if (datasetId) {
      dispatch(fetchDatasetById(datasetId));
    }
  }, [dispatch, datasetId]);
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleTogglePublic = () => {
    if (currentDataset) {
      dispatch(updateDatasetPermissions({
        datasetId: currentDataset.id,
        permissions: { isPublic: !currentDataset.isPublic }
      }))
        .unwrap()
        .then(() => {
          setSnackbar({
            open: true,
            message: `Dataset is now ${!currentDataset.isPublic ? 'public' : 'private'}`,
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
    }
  };
  
  const handleDeleteConfirm = () => {
    if (currentDataset) {
      dispatch(deleteDataset(currentDataset.id))
        .unwrap()
        .then(() => {
          setSnackbar({
            open: true,
            message: 'Dataset deleted successfully',
            severity: 'success'
          });
          // Navigate back to dataset list after successful deletion
          setTimeout(() => {
            navigate('/datasets');
          }, 1500);
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
  };
  
  const handleShareSubmit = () => {
    if (!shareEmail.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter a valid email address',
        severity: 'error'
      });
      return;
    }
    
    // Mock share functionality
    setSnackbar({
      open: true,
      message: `Share functionality coming soon`,
      severity: 'info'
    });
    setShareDialogOpen(false);
    setShareEmail('');
  };
  
  const handleEncryptSubmit = () => {
    if (!encryptionKey.trim() || encryptionKey.length < 8) {
      setSnackbar({
        open: true,
        message: 'Please enter a strong encryption key (at least 8 characters)',
        severity: 'error'
      });
      return;
    }
    
    // Mock encryption functionality
    setSnackbar({
      open: true,
      message: `Encryption functionality coming soon`,
      severity: 'info'
    });
    setEncryptDialogOpen(false);
    setEncryptionKey('');
  };
  
  const handleDownload = () => {
    // Mock download functionality
    setSnackbar({
      open: true,
      message: `Download functionality coming soon`,
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
          onClick={() => navigate('/datasets')}
          style={{ marginTop: 16 }}
        >
          Back to Datasets
        </Button>
      </Container>
    );
  }
  
  if (!currentDataset) {
    return (
      <Container className={classes.root}>
        <Alert severity="info">
          Dataset not found or you don't have permission to view it.
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/datasets')}
          style={{ marginTop: 16 }}
        >
          Back to Datasets
        </Button>
      </Container>
    );
  }
  
  // Format tags if available
  const tags = currentDataset.tags 
    ? (typeof currentDataset.tags === 'string' 
        ? JSON.parse(currentDataset.tags) 
        : currentDataset.tags)
    : [];
  
  return (
    <Container className={classes.root}>
      <Box className={classes.header}>
        <IconButton 
          className={classes.backButton} 
          onClick={() => navigate('/datasets')}
          size="large"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          {currentDataset.name}
          {currentDataset.isPublic ? (
            <Chip 
              icon={<PublicIcon />} 
              label="Public" 
              color="primary" 
              size="small" 
              className={classes.typeChip} 
            />
          ) : (
            <Chip 
              icon={<LockIcon />} 
              label="Private" 
              size="small" 
              className={classes.typeChip} 
            />
          )}
        </Typography>
      </Box>
      
      <Paper className={classes.paper}>
        <Box mb={2}>
          <Typography variant="h6" gutterBottom>
            Dataset Details
          </Typography>
          <Typography variant="body1" paragraph>
            {currentDataset.description}
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box className={classes.iconWithText}>
                <CalendarIcon className={classes.icon} />
                <Typography variant="body2">
                  Created: {new Date(currentDataset.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
              
              <Box className={classes.iconWithText}>
                <FileIcon className={classes.icon} />
                <Typography variant="body2">
                  Size: {currentDataset.size 
                    ? `${(currentDataset.size / (1024 * 1024)).toFixed(2)} MB` 
                    : 'N/A'}
                </Typography>
              </Box>
              
              <Box className={classes.iconWithText}>
                <PeopleIcon className={classes.icon} />
                <Typography variant="body2">
                  Owner: {currentDataset.userName || 'Unknown'}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box className={classes.iconWithText}>
                <SecurityIcon className={classes.icon} />
                <Typography variant="body2">
                  Encryption: {currentDataset.encrypted ? 'Encrypted' : 'Not encrypted'}
                </Typography>
              </Box>
              
              <Box className={classes.iconWithText}>
                <StorageIcon className={classes.icon} />
                <Typography variant="body2">
                  Format: {currentDataset.format || 'Unknown'}
                </Typography>
              </Box>
              
              <Box className={classes.iconWithText}>
                <MemoryIcon className={classes.icon} />
                <Typography variant="body2">
                  Processing Status: {currentDataset.status || 'Ready'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          {tags.length > 0 && (
            <Box mt={2}>
              <Typography variant="subtitle2" gutterBottom>
                Tags:
              </Typography>
              {tags.map((tag, index) => (
                <Chip 
                  key={index} 
                  label={tag} 
                  size="small" 
                  className={classes.chip} 
                />
              ))}
            </Box>
          )}
        </Box>
        
        <Divider className={classes.divider} />
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              className={classes.actionButton}
            >
              Download
            </Button>
            
            {isOwner && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<ShareIcon />}
                  onClick={() => setShareDialogOpen(true)}
                  className={classes.actionButton}
                >
                  Share
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={currentDataset.isPublic ? <LockIcon /> : <PublicIcon />}
                  onClick={handleTogglePublic}
                  className={classes.actionButton}
                >
                  {currentDataset.isPublic ? 'Make Private' : 'Make Public'}
                </Button>
              </>
            )}
          </Box>
          
          {isOwner && (
            <Box>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<SecurityIcon />}
                onClick={() => setEncryptDialogOpen(true)}
                className={classes.actionButton}
                disabled={currentDataset.encrypted}
              >
                Encrypt
              </Button>
              
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialogOpen(true)}
                className={classes.actionButton}
              >
                Delete
              </Button>
            </Box>
          )}
        </Box>
      </Paper>
      
      <Paper className={classes.paper}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="dataset tabs">
            <Tab label="Preview" />
            <Tab label="Usage" />
            <Tab label="Access History" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0} className={classes.tabPanel}>
          <Typography variant="subtitle1" gutterBottom>
            Data Preview
          </Typography>
          
          {/* Mock data preview - in a real app, this would display actual data */}
          <Box className={classes.previewPlaceholder}>
            <Typography variant="body2" color="textSecondary">
              Data preview not available in this demo
            </Typography>
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1} className={classes.tabPanel}>
          <Typography variant="subtitle1" gutterBottom>
            Usage Examples
          </Typography>
          
          <Typography variant="subtitle2" gutterBottom>
            Access this dataset in your compute job:
          </Typography>
          
          <Box className={classes.codeBlock}>
            <code>
              {`// Example in Python\n`}
              {`import calctra\n\n`}
              {`# Load the dataset\n`}
              {`dataset = calctra.load_dataset("${currentDataset.id}")\n\n`}
              {`# Process data\n`}
              {`results = your_function(dataset)\n\n`}
              {`# Save results\n`}
              {`calctra.save_results(results)`}
            </code>
          </Box>
          
          <Box className={classes.infoBox} mt={3}>
            <Typography variant="subtitle2">
              Processing with Homomorphic Encryption
            </Typography>
            <Typography variant="body2">
              This dataset can be processed using privacy-preserving computation techniques.
              Use the encrypt feature to protect your data while allowing computations on the encrypted data.
            </Typography>
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2} className={classes.tabPanel}>
          <Typography variant="subtitle1" gutterBottom>
            Access History
          </Typography>
          
          <List>
            {/* Mock access history - in a real app, this would show actual access logs */}
            <ListItem>
              <ListItemIcon className={classes.listItemIcon}>
                <CodeIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Job #123456 accessed this dataset" 
                secondary="2023-05-15 14:30"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon className={classes.listItemIcon}>
                <CodeIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Job #123123 accessed this dataset" 
                secondary="2023-05-10 09:15"
              />
            </ListItem>
            <Divider component="li" />
            <ListItem>
              <ListItemIcon className={classes.listItemIcon}>
                <PeopleIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Access granted to user@example.com" 
                secondary="2023-05-05 11:20"
              />
            </ListItem>
          </List>
        </TabPanel>
      </Paper>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Dataset</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the dataset "{currentDataset.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Share Dialog */}
      <Dialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
      >
        <DialogTitle>Share Dataset</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter the email address of the user you want to share this dataset with.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={shareEmail}
            onChange={(e) => setShareEmail(e.target.value)}
          />
          <FormControlLabel
            control={
              <Switch 
                checked={false}
                name="readOnly"
                color="primary"
              />
            }
            label="Read-only access"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleShareSubmit} color="primary" variant="contained">
            Share
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Encrypt Dialog */}
      <Dialog
        open={encryptDialogOpen}
        onClose={() => setEncryptDialogOpen(false)}
      >
        <DialogTitle>Encrypt Dataset</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Encrypt your dataset with homomorphic encryption to enable privacy-preserving computation.
            Enter a strong encryption key that you'll need to access the data later.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Encryption Key"
            type="password"
            fullWidth
            variant="outlined"
            value={encryptionKey}
            onChange={(e) => setEncryptionKey(e.target.value)}
          />
          <Box className={classes.infoBox} mt={2}>
            <Typography variant="body2">
              <strong>Note:</strong> Store this key securely. If you lose it, you won't be able to access your data.
              Homomorphic encryption allows computations on encrypted data without decrypting it first.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEncryptDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEncryptSubmit} color="primary" variant="contained">
            Encrypt
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

export default DatasetDetail; 