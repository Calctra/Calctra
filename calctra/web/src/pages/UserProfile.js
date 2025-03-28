import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Box,
  Divider,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  InputAdornment
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Language as LanguageIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Link as LinkIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const UserProfile = () => {
  const { isAuthenticated, token, user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  // User profile data
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    bio: '',
    location: '',
    website: '',
    organization: '',
    skills: []
  });
  
  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  
  // Stats data
  const [statsData, setStatsData] = useState({
    totalJobs: 0,
    completedJobs: 0,
    totalResources: 0,
    activeResources: 0,
    totalDatasets: 0,
    reputation: 0,
    tokens: 0
  });
  
  // Recent activities
  const [activities, setActivities] = useState([]);
  
  // Reviews
  const [reviews, setReviews] = useState([]);
  
  // Load user profile data on component mount
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/profile' } });
      return;
    }
    
    fetchUserProfile();
    fetchUserStats();
    fetchUserActivities();
    fetchUserReviews();
  }, [isAuthenticated, token]);
  
  const fetchUserProfile = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${apiUrl}/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        const userData = response.data.data.user;
        setProfileData({
          name: userData.name || '',
          email: userData.email || '',
          bio: userData.bio || '',
          location: userData.location || '',
          website: userData.website || '',
          organization: userData.organization || '',
          skills: userData.skills || []
        });
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load user profile data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUserStats = async () => {
    if (!token) return;
    
    try {
      const response = await axios.get(`${apiUrl}/users/stats`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setStatsData(response.data.data.stats);
      }
    } catch (err) {
      console.error('Error fetching user stats:', err);
    }
  };
  
  const fetchUserActivities = async () => {
    if (!token) return;
    
    try {
      const response = await axios.get(`${apiUrl}/users/activities`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setActivities(response.data.data.activities);
      }
    } catch (err) {
      console.error('Error fetching user activities:', err);
    }
  };
  
  const fetchUserReviews = async () => {
    if (!token) return;
    
    try {
      const response = await axios.get(`${apiUrl}/users/reviews`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setReviews(response.data.data.reviews);
      }
    } catch (err) {
      console.error('Error fetching user reviews:', err);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleEditProfile = () => {
    setEditMode(true);
  };
  
  const handleCancelEdit = () => {
    setEditMode(false);
    fetchUserProfile(); // Reset form data
  };
  
  const handleSaveProfile = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await axios.put(`${apiUrl}/users/profile`, profileData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setSuccess('Profile updated successfully');
        setEditMode(false);
      }
    } catch (err) {
      console.error('Error updating user profile:', err);
      setError('Failed to update profile. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenPasswordDialog = () => {
    setOpenPasswordDialog(true);
  };
  
  const handleClosePasswordDialog = () => {
    setOpenPasswordDialog(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };
  
  const handleSavePassword = async () => {
    if (!token) return;
    
    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await axios.put(`${apiUrl}/users/change-password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setSuccess('Password changed successfully');
        handleClosePasswordDialog();
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setError(err.response?.data?.error?.message || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('default', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  
  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      <Grid container spacing={4}>
        {/* Profile Header */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, position: 'relative' }}>
            <Box display="flex" alignItems="center">
              <Avatar
                src={user?.avatar}
                alt={profileData.name}
                sx={{ width: 100, height: 100, mr: 3 }}
              />
              <Box>
                <Typography variant="h4" gutterBottom>
                  {profileData.name}
                </Typography>
                <Typography variant="body1" color="textSecondary" gutterBottom>
                  {profileData.bio}
                </Typography>
                <Box display="flex" alignItems="center" mt={1}>
                  {profileData.organization && (
                    <Box display="flex" alignItems="center" mr={2}>
                      <PersonIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="body2" color="textSecondary">
                        {profileData.organization}
                      </Typography>
                    </Box>
                  )}
                  {profileData.location && (
                    <Box display="flex" alignItems="center" mr={2}>
                      <LocationIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="body2" color="textSecondary">
                        {profileData.location}
                      </Typography>
                    </Box>
                  )}
                  <Box display="flex" alignItems="center">
                    <CalendarIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2" color="textSecondary">
                      Joined {user?.createdAt ? formatDate(user.createdAt) : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
            
            {!editMode && (
              <Box position="absolute" top={16} right={16}>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleEditProfile}
                >
                  Edit Profile
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Profile Content */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Profile" />
              <Tab label="Activities" />
              <Tab label="Reviews" />
            </Tabs>
            
            {/* Profile Tab */}
            <TabPanel value={tabValue} index={0}>
              {editMode ? (
                <Box component="form">
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Name"
                        name="name"
                        value={profileData.name}
                        onChange={handleInputChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        value={profileData.email}
                        onChange={handleInputChange}
                        disabled
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Bio"
                        name="bio"
                        value={profileData.bio}
                        onChange={handleInputChange}
                        multiline
                        rows={3}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Organization"
                        name="organization"
                        value={profileData.organization}
                        onChange={handleInputChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Location"
                        name="location"
                        value={profileData.location}
                        onChange={handleInputChange}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Website"
                        name="website"
                        value={profileData.website}
                        onChange={handleInputChange}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Skills (comma separated)"
                        name="skills"
                        value={profileData.skills ? profileData.skills.join(', ') : ''}
                        onChange={(e) => {
                          const skillsArray = e.target.value.split(',').map(skill => skill.trim()).filter(Boolean);
                          setProfileData(prev => ({
                            ...prev,
                            skills: skillsArray
                          }));
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveProfile}
                        sx={{ mr: 1 }}
                        disabled={loading}
                      >
                        Save Changes
                      </Button>
                      <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<CancelIcon />}
                        onClick={handleCancelEdit}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              ) : (
                <Box>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <EmailIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Email"
                        secondary={profileData.email}
                      />
                    </ListItem>
                    
                    {profileData.organization && (
                      <ListItem>
                        <ListItemIcon>
                          <PersonIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Organization"
                          secondary={profileData.organization}
                        />
                      </ListItem>
                    )}
                    
                    {profileData.location && (
                      <ListItem>
                        <ListItemIcon>
                          <LocationIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Location"
                          secondary={profileData.location}
                        />
                      </ListItem>
                    )}
                    
                    {profileData.website && (
                      <ListItem>
                        <ListItemIcon>
                          <LanguageIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Website"
                          secondary={
                            <a href={profileData.website} target="_blank" rel="noopener noreferrer">
                              {profileData.website}
                            </a>
                          }
                        />
                      </ListItem>
                    )}
                  </List>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="h6" gutterBottom>
                    Skills
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    {profileData.skills && profileData.skills.length > 0 ? 
                      profileData.skills.map((skill, index) => (
                        <Chip
                          key={index}
                          label={skill}
                          sx={{ m: 0.5 }}
                        />
                      )) : 
                      <Typography variant="body2" color="textSecondary">
                        No skills added yet
                      </Typography>
                    }
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="h6" gutterBottom>
                    Security
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={handleOpenPasswordDialog}
                    sx={{ mt: 1 }}
                  >
                    Change Password
                  </Button>
                </Box>
              )}
            </TabPanel>
            
            {/* Activities Tab */}
            <TabPanel value={tabValue} index={1}>
              {activities.length > 0 ? (
                <List>
                  {activities.map((activity) => (
                    <React.Fragment key={activity._id}>
                      <ListItem 
                        alignItems="flex-start"
                        button={!!activity.link}
                        onClick={() => activity.link && navigate(activity.link)}
                      >
                        <ListItemText
                          primary={activity.description}
                          secondary={formatDate(activity.createdAt)}
                        />
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box textAlign="center" p={3}>
                  <Typography variant="body1" color="textSecondary">
                    No recent activities
                  </Typography>
                </Box>
              )}
            </TabPanel>
            
            {/* Reviews Tab */}
            <TabPanel value={tabValue} index={2}>
              {reviews.length > 0 ? (
                <List>
                  {reviews.map((review) => (
                    <React.Fragment key={review._id}>
                      <ListItem alignItems="flex-start">
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center">
                              <Typography variant="subtitle1" component="span">
                                {review.reviewer.name}
                              </Typography>
                              <Box display="flex" alignItems="center" ml={1}>
                                {[...Array(5)].map((_, index) => (
                                  <StarIcon 
                                    key={index} 
                                    fontSize="small" 
                                    sx={{ 
                                      color: index < review.rating ? 'primary.main' : 'text.disabled'
                                    }} 
                                  />
                                ))}
                              </Box>
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography
                                component="span"
                                variant="body2"
                                color="textPrimary"
                              >
                                {review.comment}
                              </Typography>
                              <Typography
                                component="div"
                                variant="caption"
                                color="textSecondary"
                                sx={{ mt: 1 }}
                              >
                                {formatDate(review.createdAt)}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box textAlign="center" p={3}>
                  <Typography variant="body1" color="textSecondary">
                    No reviews yet
                  </Typography>
                </Box>
              )}
            </TabPanel>
          </Paper>
        </Grid>
        
        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Stats */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Stats
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Reputation Score" 
                  secondary={statsData.reputation} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="CAL Tokens" 
                  secondary={statsData.tokens} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Total Jobs" 
                  secondary={`${statsData.completedJobs} / ${statsData.totalJobs}`} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Active Resources" 
                  secondary={`${statsData.activeResources} / ${statsData.totalResources}`} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Datasets" 
                  secondary={statsData.totalDatasets} 
                />
              </ListItem>
            </List>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Quick Links
            </Typography>
            <List dense>
              <ListItem 
                button
                onClick={() => navigate('/jobs')}
              >
                <ListItemIcon>
                  <LinkIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="My Jobs" />
              </ListItem>
              <ListItem 
                button
                onClick={() => navigate('/resources')}
              >
                <ListItemIcon>
                  <LinkIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="My Resources" />
              </ListItem>
              <ListItem 
                button
                onClick={() => navigate('/datasets')}
              >
                <ListItemIcon>
                  <LinkIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="My Datasets" />
              </ListItem>
              <ListItem 
                button
                onClick={() => navigate('/wallet')}
              >
                <ListItemIcon>
                  <LinkIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Wallet" />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Password Change Dialog */}
      <Dialog open={openPasswordDialog} onClose={handleClosePasswordDialog}>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <DialogContentText>
            To change your password, please enter your current password and a new password.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            name="currentPassword"
            label="Current Password"
            type={showCurrentPassword ? 'text' : 'password'}
            fullWidth
            variant="outlined"
            value={passwordData.currentPassword}
            onChange={handlePasswordChange}
            sx={{ mt: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    edge="end"
                  >
                    {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <TextField
            margin="dense"
            name="newPassword"
            label="New Password"
            type={showNewPassword ? 'text' : 'password'}
            fullWidth
            variant="outlined"
            value={passwordData.newPassword}
            onChange={handlePasswordChange}
            sx={{ mt: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    edge="end"
                  >
                    {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <TextField
            margin="dense"
            name="confirmPassword"
            label="Confirm New Password"
            type={showConfirmPassword ? 'text' : 'password'}
            fullWidth
            variant="outlined"
            value={passwordData.confirmPassword}
            onChange={handlePasswordChange}
            sx={{ mt: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePasswordDialog} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleSavePassword} 
            color="primary" 
            disabled={
              !passwordData.currentPassword || 
              !passwordData.newPassword || 
              !passwordData.confirmPassword ||
              passwordData.newPassword !== passwordData.confirmPassword
            }
          >
            Change Password
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserProfile; 