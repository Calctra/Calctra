import React from 'react';
import { Container, Box } from '@mui/material';
import Header from './layout/Header';
import Footer from './layout/Footer';

/**
 * Main layout component that wraps the application
 * Includes the header, main content area, and footer
 */
const Layout = ({ children }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <Header />
      <Container 
        component="main" 
        maxWidth="lg" 
        sx={{ 
          flexGrow: 1,
          py: 4,
        }}
      >
        {children}
      </Container>
      <Footer />
    </Box>
  );
};

export default Layout; 