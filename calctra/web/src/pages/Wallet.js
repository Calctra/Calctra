import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  TextField, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Tabs,
  Tab,
  Divider,
  CircularProgress,
  Alert,
  Tooltip,
  IconButton,
  Chip
} from '@mui/material';
import { styled } from '@mui/system';
import { useDispatch, useSelector } from 'react-redux';
import { DataGrid } from '@mui/x-data-grid';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import HistoryIcon from '@mui/icons-material/History';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';

// 注册Chart.js组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

// 样式组件
const GradientBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  color: theme.palette.common.white,
  boxShadow: theme.shadows[4],
  marginBottom: theme.spacing(3),
}));

const WalletAddressBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: theme.spacing(2),
}));

const WalletContent = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
}));

// 模拟数据
const mockTransactions = [
  { id: 1, date: '2023-03-26', type: 'Send', amount: '-10.5', recipient: '8ZJ...9xF2', status: 'Completed', hash: 'Tz5nE...2gFr' },
  { id: 2, date: '2023-03-25', type: 'Receive', amount: '+25.0', sender: '3rK...7hD4', status: 'Completed', hash: 'Qm7pR...9jTs' },
  { id: 3, date: '2023-03-24', type: 'Stake', amount: '-100.0', validator: 'Everstake', status: 'Completed', hash: 'Bv6sT...4kPz' },
  { id: 4, date: '2023-03-22', type: 'Receive', amount: '+5.2', sender: '9jL...2cS7', status: 'Completed', hash: 'Hp3vX...7qRt' },
  { id: 5, date: '2023-03-20', type: 'Send', amount: '-15.75', recipient: '2xD...8pL5', status: 'Completed', hash: 'Gc4jL...1wSv' },
];

const balanceHistory = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'CAL Balance',
      data: [65, 120, 180, 150, 210, 245],
      borderColor: 'rgba(75, 192, 192, 1)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.4,
      fill: true,
    },
  ],
};

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Balance History',
    },
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
};

// 交易表格列定义
const columns = [
  { field: 'date', headerName: 'Date', width: 110 },
  { 
    field: 'type', 
    headerName: 'Type', 
    width: 110,
    renderCell: (params) => (
      <Chip 
        label={params.value} 
        color={params.value === 'Receive' ? 'success' : params.value === 'Send' ? 'primary' : 'secondary'} 
        size="small" 
        variant="outlined"
      />
    ),
  },
  { 
    field: 'amount', 
    headerName: 'Amount (CAL)', 
    width: 140,
    renderCell: (params) => (
      <Typography 
        variant="body2" 
        color={params.value.startsWith('+') ? 'success.main' : 'primary.main'}
      >
        {params.value}
      </Typography>
    ),
  },
  { 
    field: 'recipient', 
    headerName: 'Recipient', 
    width: 130,
    renderCell: (params) => params.value ? (
      <Tooltip title={params.value}>
        <Typography variant="body2">{params.value}</Typography>
      </Tooltip>
    ) : null
  },
  { 
    field: 'sender', 
    headerName: 'Sender', 
    width: 130,
    renderCell: (params) => params.value ? (
      <Tooltip title={params.value}>
        <Typography variant="body2">{params.value}</Typography>
      </Tooltip>
    ) : null
  },
  { field: 'status', headerName: 'Status', width: 120 },
  { 
    field: 'hash', 
    headerName: 'Transaction Hash', 
    width: 150,
    renderCell: (params) => (
      <Tooltip title={`View transaction: ${params.value}`}>
        <Typography variant="body2" sx={{ textDecoration: 'underline', cursor: 'pointer' }}>
          {params.value}
        </Typography>
      </Tooltip>
    ),
  },
];

function Wallet() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [calBalance, setCalBalance] = useState(0);
  const [solBalance, setSolBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendingTransaction, setSendingTransaction] = useState(false);
  const [transactionSuccess, setTransactionSuccess] = useState(false);

  // Mock wallet connection
  const connectWallet = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Here would be actual wallet connection logic
      // For now, we'll simulate successful connection
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setWalletAddress('5FHwkrdxD2rKw9XfNsRzHpNw7c8gJMgpHnRKpFYA9TMn');
      setCalBalance(245.75);
      setSolBalance(1.23);
      setIsConnected(true);
    } catch (err) {
      setError('Failed to connect wallet. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress('');
    setCalBalance(0);
    setSolBalance(0);
    setIsConnected(false);
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    // Would add a notification here in a real app
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenSendDialog = () => {
    setSendDialogOpen(true);
  };

  const handleCloseSendDialog = () => {
    setSendDialogOpen(false);
    setRecipientAddress('');
    setSendAmount('');
    setSendingTransaction(false);
    setTransactionSuccess(false);
  };

  const handleSendTransaction = async () => {
    setSendingTransaction(true);
    
    try {
      // Mock transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update balance (would be handled by state management in real app)
      setCalBalance(prev => parseFloat((prev - parseFloat(sendAmount)).toFixed(2)));
      setTransactionSuccess(true);
      
      // Close dialog after showing success
      setTimeout(() => {
        handleCloseSendDialog();
      }, 2000);
    } catch (err) {
      setError('Transaction failed. Please try again.');
      console.error(err);
    } finally {
      setSendingTransaction(false);
    }
  };

  const refreshBalance = async () => {
    setIsLoading(true);
    
    try {
      // Mock refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In a real app, would fetch updated balance
    } catch (err) {
      setError('Failed to refresh balance.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <AccountBalanceWalletIcon sx={{ mr: 1 }} /> Wallet
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      {!isConnected ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>Connect your Solana wallet to manage your CAL tokens</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            You need to connect your wallet to view your balance, send tokens, and view transaction history.
          </Typography>
          <Button 
            variant="contained" 
            size="large" 
            onClick={connectWallet}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoading ? 'Connecting...' : 'Connect Wallet'}
          </Button>
        </Paper>
      ) : (
        <>
          <GradientBox>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Typography variant="h6">Wallet Balance</Typography>
                <Typography variant="h3" component="div" fontWeight="bold" sx={{ mt: 2 }}>
                  {calBalance.toFixed(2)} CAL
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.8 }}>
                  {solBalance.toFixed(4)} SOL
                </Typography>
                
                <WalletAddressBox>
                  <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {walletAddress}
                  </Typography>
                  <Box>
                    <IconButton size="small" onClick={handleCopyAddress} sx={{ color: 'white' }}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </WalletAddressBox>
              </Grid>
              <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: { xs: 'flex-start', md: 'flex-end' } }}>
                <Button 
                  variant="contained" 
                  color="secondary" 
                  sx={{ mb: 2, width: { xs: '100%', md: 'auto' } }}
                  startIcon={<SendIcon />}
                  onClick={handleOpenSendDialog}
                >
                  Send CAL
                </Button>
                <Button 
                  variant="outlined" 
                  sx={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: 'white',
                    '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                    width: { xs: '100%', md: 'auto' }
                  }}
                  startIcon={<RefreshIcon />}
                  onClick={refreshBalance}
                  disabled={isLoading}
                >
                  Refresh
                </Button>
              </Grid>
            </Grid>
          </GradientBox>
          
          <Box sx={{ mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} centered>
              <Tab label="Overview" icon={<AccountBalanceWalletIcon />} iconPosition="start" />
              <Tab label="Transaction History" icon={<HistoryIcon />} iconPosition="start" />
            </Tabs>
          </Box>
          
          <Box hidden={tabValue !== 0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <WalletContent>
                  <Typography variant="h6" gutterBottom>Balance History</Typography>
                  <Box sx={{ height: 300, mt: 2 }}>
                    <Line options={chartOptions} data={balanceHistory} />
                  </Box>
                </WalletContent>
              </Grid>
              <Grid item xs={12} md={5}>
                <WalletContent>
                  <Typography variant="h6" gutterBottom>Recent Activity</Typography>
                  <Box sx={{ mt: 2 }}>
                    {mockTransactions.slice(0, 3).map((tx) => (
                      <Box key={tx.id} sx={{ mb: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Grid container>
                          <Grid item xs={8}>
                            <Typography variant="body2" sx={{ opacity: 0.7 }}>{tx.date}</Typography>
                            <Typography variant="body1">{tx.type}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {tx.type === 'Send' ? `To: ${tx.recipient}` : `From: ${tx.sender}`}
                            </Typography>
                          </Grid>
                          <Grid item xs={4} sx={{ textAlign: 'right' }}>
                            <Typography 
                              variant="body1" 
                              fontWeight="bold"
                              color={tx.amount.startsWith('+') ? 'success.main' : 'primary.main'}
                            >
                              {tx.amount} CAL
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    ))}
                    <Button 
                      variant="text" 
                      fullWidth 
                      onClick={() => setTabValue(1)}
                      sx={{ mt: 1 }}
                    >
                      View All Transactions
                    </Button>
                  </Box>
                </WalletContent>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button variant="outlined" color="error" onClick={disconnectWallet}>
                    Disconnect Wallet
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
          
          <Box hidden={tabValue !== 1}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Transaction History</Typography>
              <Box sx={{ height: 400, width: '100%' }}>
                <DataGrid
                  rows={mockTransactions}
                  columns={columns}
                  pageSize={5}
                  rowsPerPageOptions={[5, 10, 20]}
                  disableSelectionOnClick
                />
              </Box>
            </Paper>
          </Box>
        </>
      )}
      
      {/* Send Dialog */}
      <Dialog open={sendDialogOpen} onClose={handleCloseSendDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Send CAL Tokens</DialogTitle>
        <DialogContent>
          {transactionSuccess ? (
            <Alert severity="success" sx={{ my: 2 }}>
              Transaction successful! {sendAmount} CAL sent to {recipientAddress}.
            </Alert>
          ) : (
            <>
              <TextField
                margin="dense"
                label="Recipient Address"
                type="text"
                fullWidth
                variant="outlined"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                disabled={sendingTransaction}
                sx={{ mb: 2, mt: 2 }}
              />
              <TextField
                margin="dense"
                label="Amount (CAL)"
                type="number"
                fullWidth
                variant="outlined"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                disabled={sendingTransaction}
                InputProps={{
                  endAdornment: <Typography variant="body2">CAL</Typography>
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Typography variant="body2">Available: {calBalance.toFixed(2)} CAL</Typography>
                <Button size="small" onClick={() => setSendAmount(calBalance.toString())}>Max</Button>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSendDialog}>Cancel</Button>
          <Button 
            onClick={handleSendTransaction} 
            variant="contained"
            disabled={
              sendingTransaction || 
              transactionSuccess || 
              !recipientAddress || 
              !sendAmount || 
              parseFloat(sendAmount) <= 0 || 
              parseFloat(sendAmount) > calBalance
            }
            startIcon={sendingTransaction ? <CircularProgress size={20} /> : <SendIcon />}
          >
            {sendingTransaction ? 'Sending...' : 'Send'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Wallet; 