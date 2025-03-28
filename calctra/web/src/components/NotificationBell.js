import React, { useState, useEffect } from 'react';
import { 
  Badge, 
  IconButton, 
  Menu, 
  MenuItem, 
  Typography, 
  Box, 
  List, 
  ListItem, 
  ListItemText, 
  Divider,
  Button,
  Tooltip,
  CircularProgress
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CloseIcon from '@mui/icons-material/Close';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const NotificationBell = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { isAuthenticated, token } = useSelector(state => state.auth);
  const navigate = useNavigate();
  
  const open = Boolean(anchorEl);
  
  const handleClick = (event) => {
    if (isAuthenticated) {
      setAnchorEl(event.currentTarget);
      fetchNotifications();
    } else {
      navigate('/login');
    }
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const fetchUnreadCount = async () => {
    if (!isAuthenticated || !token) return;
    
    try {
      const response = await axios.get(`${apiUrl}/notifications/unread-count`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setUnreadCount(response.data.data.unreadCount);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };
  
  const fetchNotifications = async () => {
    if (!isAuthenticated || !token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${apiUrl}/notifications?limit=5`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setNotifications(response.data.data.notifications);
        setUnreadCount(response.data.data.unreadCount);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications. Please try again later.');
    } finally {
      setLoading(false);
    }
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
      
      // Update unread count
      if (unreadCount > 0) {
        setUnreadCount(prevCount => prevCount - 1);
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
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
      
      // Reset unread count
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };
  
  const handleNotificationClick = (notification) => {
    // Mark as read
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
        handleClose();
      }
    }
  };
  
  // Check for new notifications periodically
  useEffect(() => {
    if (!isAuthenticated) return;
    
    fetchUnreadCount(); // Initial fetch
    
    const interval = setInterval(fetchUnreadCount, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, [isAuthenticated, token]);
  
  const formatNotificationTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    
    // Less than a minute
    if (diffMs < 60000) {
      return 'Just now';
    }
    
    // Less than an hour
    if (diffMs < 3600000) {
      const minutes = Math.floor(diffMs / 60000);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    // Less than a day
    if (diffMs < 86400000) {
      const hours = Math.floor(diffMs / 3600000);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    // Less than a week
    if (diffMs < 604800000) {
      const days = Math.floor(diffMs / 86400000);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
    
    // Otherwise show date
    return date.toLocaleDateString();
  };
  
  return (
    <>
      <Tooltip title={isAuthenticated ? "Notifications" : "Sign in to view notifications"}>
        <IconButton
          color="inherit"
          onClick={handleClick}
          aria-label={`${unreadCount} new notifications`}
          aria-controls={open ? 'notifications-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      <Menu
        id="notifications-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'notification-button',
        }}
        PaperProps={{
          style: {
            width: 320,
            maxHeight: 400,
          },
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" px={2} py={1}>
          <Typography variant="h6">Notifications</Typography>
          <Box>
            {unreadCount > 0 && (
              <Tooltip title="Mark all as read">
                <IconButton size="small" onClick={markAllAsRead}>
                  <DoneAllIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Close">
              <IconButton size="small" onClick={handleClose}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <Divider />
        
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Box p={2} textAlign="center">
            <Typography color="error">{error}</Typography>
          </Box>
        ) : notifications.length === 0 ? (
          <Box p={2} textAlign="center">
            <Typography variant="body2" color="textSecondary">
              No notifications yet
            </Typography>
          </Box>
        ) : (
          <List sx={{ padding: 0 }}>
            {notifications.map((notification) => (
              <React.Fragment key={notification._id}>
                <ListItem 
                  button 
                  onClick={() => handleNotificationClick(notification)}
                  sx={{ 
                    backgroundColor: notification.isRead ? 'inherit' : 'rgba(144, 202, 249, 0.08)',
                    '&:hover': {
                      backgroundColor: 'rgba(144, 202, 249, 0.16)',
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" noWrap>
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography 
                          variant="body2" 
                          color="textSecondary" 
                          component="span"
                          sx={{
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {notification.message}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          color="textSecondary"
                          component="span"
                          sx={{ display: 'block', mt: 0.5 }}
                        >
                          {formatNotificationTime(notification.createdAt)}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
            
            <Box p={1} textAlign="center">
              <Button 
                size="small" 
                onClick={() => {
                  navigate('/notifications');
                  handleClose();
                }}
              >
                View all notifications
              </Button>
            </Box>
          </List>
        )}
      </Menu>
    </>
  );
};

export default NotificationBell; 