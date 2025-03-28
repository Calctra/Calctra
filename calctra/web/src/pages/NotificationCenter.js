import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Tabs,
  Tab,
  Chip,
  Grid,
  Alert,
  Pagination
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  DoneAll as DoneAllIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  
  const { isAuthenticated, token, user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  
  const limit = 10; // Items per page
  
  // Notification types
  const notificationTypes = [
    { value: 'job_completed', label: 'Job Completed' },
    { value: 'job_failed', label: 'Job Failed' },
    { value: 'job_started', label: 'Job Started' },
    { value: 'job_scheduled', label: 'Job Scheduled' },
    { value: 'resource_matched', label: 'Resource Matched' },
    { value: 'resource_status', label: 'Resource Status' },
    { value: 'payment_received', label: 'Payment Received' },
    { value: 'payment_sent', label: 'Payment Sent' },
    { value: 'account_update', label: 'Account Update' },
    { value: 'system_alert', label: 'System Alert' },
    { value: 'data_shared', label: 'Data Shared' },
    { value: 'review_received', label: 'Review Received' },
    { value: 'custom', label: 'Other' }
  ];
  
  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/notifications' } });
    }
  }, [isAuthenticated, navigate]);
  
  // Fetch notifications on mount and when filters change
  useEffect(() => {
    fetchNotifications();
  }, [page, currentTab, selectedType]);
  
  const fetchNotifications = async () => {
    if (!isAuthenticated || !token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Determine filter parameters based on current tab
      let params = {
        page,
        limit,
      };
      
      // Add tab-specific filters
      switch(currentTab) {
        case 0: // All
          break;
        case 1: // Unread
          params.unreadOnly = true;
          break;
        case 2: // Read
          params.readOnly = true;
          break;
        default:
          break;
      }
      
      // Add type filter if selected
      if (selectedType) {
        params.type = selectedType;
      }
      
      const queryString = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
      
      const response = await axios.get(`${apiUrl}/notifications?${queryString}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setNotifications(response.data.data.notifications);
        setTotalPages(Math.ceil(response.data.data.pagination.total / limit));
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    setPage(1); // Reset to first page when changing tabs
  };
  
  const handlePageChange = (event, value) => {
    setPage(value);
  };
  
  const handleFilterClick = (event) => {
    setFilterMenuAnchor(event.currentTarget);
  };
  
  const handleFilterClose = () => {
    setFilterMenuAnchor(null);
  };
  
  const handleFilterSelect = (type) => {
    setSelectedType(type);
    setPage(1); // Reset to first page when changing filter
    handleFilterClose();
  };
  
  const handleActionClick = (event, notification) => {
    setSelectedNotification(notification);
    setActionMenuAnchor(event.currentTarget);
    event.stopPropagation(); // Prevent triggering the ListItem click
  };
  
  const handleActionClose = () => {
    setActionMenuAnchor(null);
  };
  
  const markAsRead = async (notificationId) => {
    if (!isAuthenticated || !token) return;
    
    try {
      await axios.put(`${apiUrl}/notifications/${notificationId}/read`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification._id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };
  
  const markAsUnread = async (notificationId) => {
    if (!isAuthenticated || !token) return;
    
    try {
      await axios.put(`${apiUrl}/notifications/${notificationId}/unread`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification._id === notificationId 
            ? { ...notification, isRead: false }
            : notification
        )
      );
    } catch (err) {
      console.error('Error marking notification as unread:', err);
    }
  };
  
  const removeNotification = async (notificationId) => {
    if (!isAuthenticated || !token) return;
    
    try {
      await axios.delete(`${apiUrl}/notifications/${notificationId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.filter(notification => notification._id !== notificationId)
      );
    } catch (err) {
      console.error('Error removing notification:', err);
    }
  };
  
  const markAllAsRead = async () => {
    if (!isAuthenticated || !token) return;
    
    try {
      await axios.put(`${apiUrl}/notifications/read-all`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, isRead: true }))
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };
  
  const handleNotificationClick = (notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    
    // Navigate based on link type
    if (notification.linkType && notification.linkId) {
      let route = '';
      
      switch(notification.linkType) {
        case 'job':
          route = `/jobs/${notification.linkId}`;
          break;
        case 'resource':
          route = `/resources/${notification.linkId}`;
          break;
        case 'data':
          route = `/datasets/${notification.linkId}`;
          break;
        case 'user':
          route = `/profile/${notification.linkId}`;
          break;
        case 'review':
          route = `/reviews/${notification.linkId}`;
          break;
        default:
          // Use custom URL if available, otherwise do nothing
          if (notification.linkUrl) {
            route = notification.linkUrl;
          }
      }
      
      if (route) {
        navigate(route);
      }
    }
  };
  
  const getTypeBadge = (type) => {
    const typeObj = notificationTypes.find(t => t.value === type);
    return typeObj ? typeObj.label : 'Notification';
  };
  
  const formatNotificationTime = (timestamp) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('default', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Notifications
      </Typography>
      
      <Paper sx={{ mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            sx={{ flexGrow: 1 }}
          >
            <Tab label="All" />
            <Tab label="Unread" />
            <Tab label="Read" />
          </Tabs>
          
          <Box sx={{ display: 'flex', alignItems: 'center', pr: 2 }}>
            <Button 
              startIcon={<DoneAllIcon />} 
              onClick={markAllAsRead}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              Mark all as read
            </Button>
            
            <IconButton
              aria-label="filter notifications"
              aria-controls="filter-menu"
              aria-haspopup="true"
              onClick={handleFilterClick}
            >
              <FilterListIcon />
            </IconButton>
            <Menu
              id="filter-menu"
              anchorEl={filterMenuAnchor}
              keepMounted
              open={Boolean(filterMenuAnchor)}
              onClose={handleFilterClose}
            >
              <MenuItem onClick={() => handleFilterSelect(null)}>
                All Types
              </MenuItem>
              <Divider />
              {notificationTypes.map((type) => (
                <MenuItem 
                  key={type.value} 
                  onClick={() => handleFilterSelect(type.value)}
                  selected={selectedType === type.value}
                >
                  {type.label}
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Box>
        
        {loading ? (
          <Box display="flex" justifyContent="center" p={5}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
        ) : notifications.length === 0 ? (
          <Box textAlign="center" p={5}>
            <Typography variant="body1" color="textSecondary">
              No notifications found
            </Typography>
            {selectedType && (
              <Button 
                onClick={() => setSelectedType(null)} 
                sx={{ mt: 2 }}
              >
                Clear filter
              </Button>
            )}
          </Box>
        ) : (
          <>
            <List sx={{ width: '100%' }}>
              {notifications.map((notification) => (
                <React.Fragment key={notification._id}>
                  <ListItem 
                    alignItems="flex-start"
                    button
                    onClick={() => handleNotificationClick(notification)}
                    sx={{ 
                      backgroundColor: notification.isRead ? 'inherit' : 'rgba(144, 202, 249, 0.08)',
                      py: 2
                    }}
                  >
                    <ListItemText
                      primary={
                        <Grid container alignItems="center" spacing={1}>
                          <Grid item xs>
                            <Typography variant="subtitle1">
                              {notification.title}
                            </Typography>
                          </Grid>
                          <Grid item>
                            <Chip 
                              label={getTypeBadge(notification.type)} 
                              size="small" 
                              color={
                                notification.priority === 'high' || notification.priority === 'urgent' 
                                  ? 'error' 
                                  : 'primary'
                              }
                              variant={notification.priority === 'low' ? 'outlined' : 'filled'}
                            />
                          </Grid>
                        </Grid>
                      }
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            color="textPrimary"
                            sx={{ display: 'block', my: 1 }}
                          >
                            {notification.message}
                          </Typography>
                          <Typography
                            component="span"
                            variant="caption"
                            color="textSecondary"
                          >
                            {formatNotificationTime(notification.createdAt)}
                          </Typography>
                        </>
                      }
                    />
                    <IconButton
                      edge="end"
                      aria-label="notification actions"
                      onClick={(e) => handleActionClick(e, notification)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
            
            <Box display="flex" justifyContent="center" p={2}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          </>
        )}
      </Paper>
      
      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        keepMounted
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionClose}
      >
        {selectedNotification && !selectedNotification.isRead && (
          <MenuItem 
            onClick={() => {
              markAsRead(selectedNotification._id);
              handleActionClose();
            }}
          >
            Mark as read
          </MenuItem>
        )}
        {selectedNotification && selectedNotification.isRead && (
          <MenuItem 
            onClick={() => {
              markAsUnread(selectedNotification._id);
              handleActionClose();
            }}
          >
            Mark as unread
          </MenuItem>
        )}
        <MenuItem 
          onClick={() => {
            if (selectedNotification) {
              removeNotification(selectedNotification._id);
            }
            handleActionClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Remove notification
        </MenuItem>
      </Menu>
    </Container>
  );
};

export default NotificationCenter; 