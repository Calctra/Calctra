import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import DatasetDetail from './pages/DatasetDetail';
import DatasetManagement from './pages/DatasetManagement';
import JobDetail from './pages/JobDetail';
import JobCreation from './pages/JobCreation';
import JobManagement from './pages/JobManagement';
import Dashboard from './pages/Dashboard';
import ResourceMarket from './pages/ResourceMarket';
import ResourceDetail from './pages/ResourceDetail';
import Wallet from './pages/Wallet';
import NotFound from './pages/NotFound';
import NotificationCenter from './pages/NotificationCenter';
import UserProfile from './pages/UserProfile';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import { Provider } from 'react-redux';
import store from './redux/store';

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/resources" element={<ResourceMarket />} />
              <Route path="/resources/:resourceId" element={<ResourceDetail />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/datasets" element={<ProtectedRoute><DatasetManagement /></ProtectedRoute>} />
              <Route path="/datasets/:datasetId" element={<ProtectedRoute><DatasetDetail /></ProtectedRoute>} />
              <Route path="/jobs" element={<ProtectedRoute><JobManagement /></ProtectedRoute>} />
              <Route path="/jobs/create" element={<ProtectedRoute><JobCreation /></ProtectedRoute>} />
              <Route path="/jobs/:jobId" element={<ProtectedRoute><JobDetail /></ProtectedRoute>} />
              <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><NotificationCenter /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App; 