import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Box,
  Divider,
  Switch,
  FormGroup,
  FormControlLabel,
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton
} from '@mui/material';
import {
  NotificationsActive as NotificationsIcon,
  Security as SecurityIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon,
  ExpandMore as ExpandMoreIcon,
  Wallet as WalletIcon,
  Delete as DeleteIcon,
  DataObject as DataIcon,
  PrivacyTip as PrivacyIcon,
  Sync as SyncIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Settings = () => {
  const { isAuthenticated, token } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    jobUpdates: true,
    resourceAlerts: true,
    paymentNotifications: true,
    marketplaceUpdates: true,
    systemAnnouncements: true
  });
  
  // Display settings
  const [displaySettings, setDisplaySettings] = useState({
    theme: 'light',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    timezone: 'UTC'
  });
  
  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showResources: true,
    showActivity: true,
    allowDataSharing: false
  });
  
  // Wallet settings
  const [walletSettings, setWalletSettings] = useState({
    autoWithdraw: false,
    minWithdrawAmount: 100,
    preferredCurrency: 'USD'
  });
  
  // Connected accounts
  const [connectedAccounts, setConnectedAccounts] = useState([
    { id: 1, name: 'Solana Wallet', connected: true, address: '8xk7nAstQYnHjxGEPs4s4njxBE14XaRTwvRj8J3GYMj6' },
    { id: 2, name: 'GitHub', connected: false, username: null }
  ]);
  
  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/settings' } });
      return;
    }
    
    fetchSettings();
  }, [isAuthenticated, token]);
  
  const fetchSettings = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${apiUrl}/users/settings`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        const settings = response.data.data.settings;
        
        // Update state with fetched settings
        if (settings.notifications) {
          setNotificationSettings(settings.notifications);
        }
        
        if (settings.display) {
          setDisplaySettings(settings.display);
        }
        
        if (settings.privacy) {
          setPrivacySettings(settings.privacy);
        }
        
        if (settings.wallet) {
          setWalletSettings(settings.wallet);
        }
        
        if (settings.connectedAccounts) {
          setConnectedAccounts(settings.connectedAccounts);
        }
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const saveSettings = async (section, data) => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await axios.put(`${apiUrl}/users/settings/${section}`, data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setSuccess(`${section.charAt(0).toUpperCase() + section.slice(1)} settings updated successfully`);
      }
    } catch (err) {
      console.error(`Error updating ${section} settings:`, err);
      setError(`Failed to update ${section} settings. Please try again later.`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleNotificationChange = (event) => {
    const { name, checked } = event.target;
    setNotificationSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  const handleDisplayChange = (event) => {
    const { name, value } = event.target;
    setDisplaySettings(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handlePrivacyChange = (event) => {
    const { name, checked, value } = event.target;
    setPrivacySettings(prev => ({
      ...prev,
      [name]: event.target.type === 'checkbox' ? checked : value
    }));
  };
  
  const handleWalletChange = (event) => {
    const { name, value, checked } = event.target;
    setWalletSettings(prev => ({
      ...prev,
      [name]: event.target.type === 'checkbox' ? checked : value
    }));
  };
  
  const disconnectAccount = (id) => {
    // Implement API call to disconnect account
    setConnectedAccounts(prev => 
      prev.map(account => 
        account.id === id ? { ...account, connected: false } : account
      )
    );
  };
  
  const connectAccount = (id) => {
    // Implement API call to connect account
    // This would typically involve OAuth or similar
    alert(`Connect account with ID: ${id}`);
  };
  
  const saveNotificationSettings = () => {
    saveSettings('notifications', notificationSettings);
  };
  
  const saveDisplaySettings = () => {
    saveSettings('display', displaySettings);
  };
  
  const savePrivacySettings = () => {
    saveSettings('privacy', privacySettings);
  };
  
  const saveWalletSettings = () => {
    saveSettings('wallet', walletSettings);
  };
  
  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Account Settings
      </Typography>
      
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
      
      <Grid container spacing={3}>
        {/* Notification Settings */}
        <Grid item xs={12}>
          <Accordion defaultExpanded>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="notification-settings-content"
              id="notification-settings-header"
            >
              <Box display="flex" alignItems="center">
                <NotificationsIcon sx={{ mr: 2 }} />
                <Typography variant="h6">Notification Settings</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <FormGroup>
                <FormControlLabel
                  control={<Switch checked={notificationSettings.emailNotifications} onChange={handleNotificationChange} name="emailNotifications" />}
                  label="Email Notifications"
                />
                <FormControlLabel
                  control={<Switch checked={notificationSettings.jobUpdates} onChange={handleNotificationChange} name="jobUpdates" />}
                  label="Job Status Updates"
                />
                <FormControlLabel
                  control={<Switch checked={notificationSettings.resourceAlerts} onChange={handleNotificationChange} name="resourceAlerts" />}
                  label="Resource Alerts"
                />
                <FormControlLabel
                  control={<Switch checked={notificationSettings.paymentNotifications} onChange={handleNotificationChange} name="paymentNotifications" />}
                  label="Payment Notifications"
                />
                <FormControlLabel
                  control={<Switch checked={notificationSettings.marketplaceUpdates} onChange={handleNotificationChange} name="marketplaceUpdates" />}
                  label="Marketplace Updates"
                />
                <FormControlLabel
                  control={<Switch checked={notificationSettings.systemAnnouncements} onChange={handleNotificationChange} name="systemAnnouncements" />}
                  label="System Announcements"
                />
              </FormGroup>
              <Box mt={2}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={saveNotificationSettings}
                  disabled={loading}
                >
                  Save Notification Settings
                </Button>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Grid>
        
        {/* Display Settings */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="display-settings-content"
              id="display-settings-header"
            >
              <Box display="flex" alignItems="center">
                <PaletteIcon sx={{ mr: 2 }} />
                <Typography variant="h6">Display Settings</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="theme-select-label">Theme</InputLabel>
                    <Select
                      labelId="theme-select-label"
                      id="theme-select"
                      value={displaySettings.theme}
                      label="Theme"
                      name="theme"
                      onChange={handleDisplayChange}
                    >
                      <MenuItem value="light">Light</MenuItem>
                      <MenuItem value="dark">Dark</MenuItem>
                      <MenuItem value="system">System Default</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="language-select-label">Language</InputLabel>
                    <Select
                      labelId="language-select-label"
                      id="language-select"
                      value={displaySettings.language}
                      label="Language"
                      name="language"
                      onChange={handleDisplayChange}
                    >
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem value="zh">Chinese</MenuItem>
                      <MenuItem value="es">Spanish</MenuItem>
                      <MenuItem value="fr">French</MenuItem>
                      <MenuItem value="de">German</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="date-format-select-label">Date Format</InputLabel>
                    <Select
                      labelId="date-format-select-label"
                      id="date-format-select"
                      value={displaySettings.dateFormat}
                      label="Date Format"
                      name="dateFormat"
                      onChange={handleDisplayChange}
                    >
                      <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                      <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                      <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="timezone-select-label">Timezone</InputLabel>
                    <Select
                      labelId="timezone-select-label"
                      id="timezone-select"
                      value={displaySettings.timezone}
                      label="Timezone"
                      name="timezone"
                      onChange={handleDisplayChange}
                    >
                      <MenuItem value="UTC">UTC</MenuItem>
                      <MenuItem value="America/New_York">Eastern Time (ET)</MenuItem>
                      <MenuItem value="America/Chicago">Central Time (CT)</MenuItem>
                      <MenuItem value="America/Denver">Mountain Time (MT)</MenuItem>
                      <MenuItem value="America/Los_Angeles">Pacific Time (PT)</MenuItem>
                      <MenuItem value="Asia/Shanghai">China Standard Time (CST)</MenuItem>
                      <MenuItem value="Europe/London">Greenwich Mean Time (GMT)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <Box mt={2}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={saveDisplaySettings}
                  disabled={loading}
                >
                  Save Display Settings
                </Button>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Grid>
        
        {/* Privacy Settings */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="privacy-settings-content"
              id="privacy-settings-header"
            >
              <Box display="flex" alignItems="center">
                <PrivacyIcon sx={{ mr: 2 }} />
                <Typography variant="h6">Privacy Settings</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="profile-visibility-label">Profile Visibility</InputLabel>
                    <Select
                      labelId="profile-visibility-label"
                      id="profile-visibility-select"
                      value={privacySettings.profileVisibility}
                      label="Profile Visibility"
                      name="profileVisibility"
                      onChange={handlePrivacyChange}
                    >
                      <MenuItem value="public">Public - Anyone can view your profile</MenuItem>
                      <MenuItem value="authenticated">Authenticated - Only registered users can view your profile</MenuItem>
                      <MenuItem value="private">Private - Only you can view your profile</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormGroup>
                    <FormControlLabel
                      control={<Switch checked={privacySettings.showResources} onChange={handlePrivacyChange} name="showResources" />}
                      label="Show my resources in the marketplace"
                    />
                    <FormControlLabel
                      control={<Switch checked={privacySettings.showActivity} onChange={handlePrivacyChange} name="showActivity" />}
                      label="Allow others to see my activity"
                    />
                    <FormControlLabel
                      control={<Switch checked={privacySettings.allowDataSharing} onChange={handlePrivacyChange} name="allowDataSharing" />}
                      label="Allow anonymized data sharing for platform improvement"
                    />
                  </FormGroup>
                </Grid>
              </Grid>
              <Box mt={2}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={savePrivacySettings}
                  disabled={loading}
                >
                  Save Privacy Settings
                </Button>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Grid>
        
        {/* Wallet Settings */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="wallet-settings-content"
              id="wallet-settings-header"
            >
              <Box display="flex" alignItems="center">
                <WalletIcon sx={{ mr: 2 }} />
                <Typography variant="h6">Wallet Settings</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={<Switch checked={walletSettings.autoWithdraw} onChange={handleWalletChange} name="autoWithdraw" />}
                    label="Automatically withdraw earnings when threshold is reached"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Minimum Withdraw Amount"
                    name="minWithdrawAmount"
                    type="number"
                    value={walletSettings.minWithdrawAmount}
                    onChange={handleWalletChange}
                    disabled={!walletSettings.autoWithdraw}
                    InputProps={{
                      startAdornment: '₡',
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="preferred-currency-label">Preferred Currency</InputLabel>
                    <Select
                      labelId="preferred-currency-label"
                      id="preferred-currency-select"
                      value={walletSettings.preferredCurrency}
                      label="Preferred Currency"
                      name="preferredCurrency"
                      onChange={handleWalletChange}
                    >
                      <MenuItem value="USD">USD</MenuItem>
                      <MenuItem value="EUR">EUR</MenuItem>
                      <MenuItem value="GBP">GBP</MenuItem>
                      <MenuItem value="CNY">CNY</MenuItem>
                      <MenuItem value="CAL">CAL (Calctra Token)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <Box mt={2}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={saveWalletSettings}
                  disabled={loading}
                >
                  Save Wallet Settings
                </Button>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Grid>
        
        {/* Connected Accounts */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="connected-accounts-content"
              id="connected-accounts-header"
            >
              <Box display="flex" alignItems="center">
                <SyncIcon sx={{ mr: 2 }} />
                <Typography variant="h6">Connected Accounts</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {connectedAccounts.map((account) => (
                  <ListItem key={account.id}>
                    <ListItemIcon>
                      {account.name === 'Solana Wallet' ? <WalletIcon /> : <DataIcon />}
                    </ListItemIcon>
                    <ListItemText
                      primary={account.name}
                      secondary={
                        account.connected 
                          ? (account.address || account.username) 
                          : 'Not connected'
                      }
                    />
                    <ListItemSecondaryAction>
                      {account.connected ? (
                        <Button
                          variant="outlined"
                          color="secondary"
                          size="small"
                          startIcon={<DeleteIcon />}
                          onClick={() => disconnectAccount(account.id)}
                        >
                          Disconnect
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          color="primary"
                          size="small"
                          onClick={() => connectAccount(account.id)}
                        >
                          Connect
                        </Button>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        </Grid>
        
        {/* Account Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mt: 2 }}>
            <Typography variant="h6" color="error" gutterBottom>
              Danger Zone
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Button 
                  variant="outlined" 
                  color="error" 
                  fullWidth
                  onClick={() => {
                    if (window.confirm('Are you sure you want to deactivate your account? You can reactivate it later.')) {
                      // Implement account deactivation
                      alert('Account deactivation functionality would go here');
                    }
                  }}
                >
                  Deactivate Account
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button 
                  variant="contained" 
                  color="error" 
                  fullWidth
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone!')) {
                      // Implement account deletion
                      alert('Account deletion functionality would go here');
                    }
                  }}
                >
                  Delete Account
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Settings; 