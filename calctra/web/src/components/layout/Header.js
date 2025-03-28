import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  Container,
  Tooltip,
  Badge
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Storage as StorageIcon,
  AccountCircle as AccountIcon,
  Assignment as JobIcon,
  Dataset as DatasetIcon,
  ExitToApp as LogoutIcon,
  Login as LoginIcon,
  Person,
  Notifications,
  AccountBalanceWallet,
  Computer
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import NotificationBell from '../NotificationBell';
import logo from '../../assets/logo.svg';

const useStyles = makeStyles((theme) => ({
  title: {
    flexGrow: 1,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none',
    color: 'inherit',
  },
  logo: {
    height: 36,
    marginRight: theme.spacing(1),
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
  },
  avatar: {
    width: 32,
    height: 32,
    marginRight: theme.spacing(1),
    backgroundColor: theme.palette.primary.main,
  },
  userButton: {
    textTransform: 'none',
  },
  drawerContainer: {
    width: 240,
    padding: theme.spacing(2),
  },
  navLink: {
    textDecoration: 'none',
    color: theme.palette.text.primary,
  },
  activeLink: {
    color: theme.palette.primary.main,
    '& .MuiListItemIcon-root': {
      color: theme.palette.primary.main,
    },
  },
}));

const Header = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'));
  const theme = useTheme();
  
  const { user } = useSelector((state) => state.auth);
  
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  
  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };
  
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };
  
  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };
  
  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };
  
  const handleNavigate = (path) => {
    navigate(path);
    handleCloseNavMenu();
    handleCloseUserMenu();
    setMobileDrawerOpen(false);
  };
  
  const handleLogout = () => {
    dispatch(logout());
    handleCloseUserMenu();
    navigate('/');
  };
  
  const toggleMobileDrawer = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };
  
  const pages = [
    { title: 'Resources', path: '/resources', icon: <Computer /> },
    { title: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { title: 'Jobs', path: '/jobs', icon: <JobIcon /> },
    { title: 'Datasets', path: '/datasets', icon: <DatasetIcon /> },
  ];
  
  const settings = [
    { title: 'Profile', path: '/profile', icon: <Person /> },
    { title: 'Wallet', path: '/wallet', icon: <AccountBalanceWallet /> },
    { title: 'Settings', path: '/settings', icon: <AccountIcon /> },
  ];
  
  const renderMobileDrawer = () => (
    <Drawer
      anchor="left"
      open={mobileDrawerOpen}
      onClose={toggleMobileDrawer}
    >
      <div className={classes.drawerContainer}>
        <Typography variant="h6" component="div" gutterBottom>
          Calctra
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <List>
          {pages.map((page) => (
            <ListItem 
              button 
              key={page.title} 
              onClick={() => handleNavigate(page.path)}
            >
              <ListItemIcon>{page.icon}</ListItemIcon>
              <ListItemText primary={page.title} />
            </ListItem>
          ))}
          <Divider sx={{ my: 2 }} />
          {user ? (
            <>
              {settings.map((setting) => (
                <ListItem 
                  button 
                  key={setting.title} 
                  onClick={() => handleNavigate(setting.path)}
                >
                  <ListItemIcon>{setting.icon}</ListItemIcon>
                  <ListItemText primary={setting.title} />
                </ListItem>
              ))}
              <ListItem button onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItem>
            </>
          ) : (
            <>
              <ListItem button onClick={() => handleNavigate('/login')}>
                <ListItemText primary="Login" />
              </ListItem>
              <ListItem button onClick={() => handleNavigate('/register')}>
                <ListItemText primary="Register" />
              </ListItem>
            </>
          )}
        </List>
      </div>
    </Drawer>
  );
  
  const desktopMenu = (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {pages.map((page) => (
        <Button 
          key={page.title}
          onClick={() => handleNavigate(page.path)}
          color="inherit"
          sx={{ mx: 1 }}
        >
          {page.title}
        </Button>
      ))}
    </Box>
  );
  
  return (
    <>
      <AppBar position="fixed" className={classes.appBar}>
        <Container>
          <Toolbar disableGutters>
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={toggleMobileDrawer}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            
            <Box 
              component={RouterLink} 
              to="/" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                textDecoration: 'none', 
                color: 'inherit',
                flexGrow: isMobile ? 1 : 0
              }}
            >
              <img 
                src={logo} 
                alt="Calctra Logo" 
                style={{ 
                  height: 40, 
                  marginRight: 10 
                }} 
              />
              {!isMobile && (
                <Typography variant="h6" component="div">
                  Calctra
                </Typography>
              )}
            </Box>
            
            {!isMobile && (
              <Box sx={{ flexGrow: 1, ml: 3 }}>
                {desktopMenu}
              </Box>
            )}
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <NotificationBell />
              
              {user ? (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<AccountBalanceWallet />}
                    onClick={() => handleNavigate('/wallet')}
                    sx={{ mr: 2, display: { xs: 'none', md: 'flex' } }}
                  >
                    Wallet
                  </Button>
                  
                  <NotificationBell 
                    count={3} 
                    onClick={() => handleNavigate('/notifications')} 
                    sx={{ mr: 2 }}
                  />
                  
                  <Tooltip title="Open user menu">
                    <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                      <Avatar 
                        alt={user?.name || 'User'} 
                        src={user?.avatar || ''} 
                        sx={{ width: 32, height: 32 }}
                      >
                        {user?.name?.charAt(0) || 'U'}
                      </Avatar>
                    </IconButton>
                  </Tooltip>
                  <Menu
                    sx={{ mt: '45px' }}
                    id="menu-appbar"
                    anchorEl={anchorElUser}
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    keepMounted
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    open={Boolean(anchorElUser)}
                    onClose={handleCloseUserMenu}
                  >
                    {settings.map((setting) => (
                      <MenuItem key={setting.title} onClick={() => handleNavigate(setting.path)}>
                        <ListItemIcon>{setting.icon}</ListItemIcon>
                        <Typography textAlign="center">{setting.title}</Typography>
                      </MenuItem>
                    ))}
                    <Divider />
                    <MenuItem onClick={handleLogout}>
                      <ListItemIcon><LogoutIcon /></ListItemIcon>
                      <Typography textAlign="center">Logout</Typography>
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <Button 
                    color="inherit" 
                    component={RouterLink} 
                    to="/login"
                    sx={{ ml: 1 }}
                  >
                    Login
                  </Button>
                  <Button 
                    variant="contained" 
                    color="secondary" 
                    component={RouterLink} 
                    to="/register"
                    sx={{ ml: 1 }}
                  >
                    Register
                  </Button>
                </Box>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      {renderMobileDrawer()}
    </>
  );
};

export default Header; 