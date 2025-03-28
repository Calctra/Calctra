import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Paper,
  Button,
  Chip,
  Box,
  Rating,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  TextField,
  CircularProgress,
  Alert,
  Stack,
  Card,
  CardContent,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  AccessTime,
  CheckCircle,
  Computer,
  Memory,
  Storage,
  Speed,
  CloudQueue,
  LocationOn,
  Star,
  AttachMoney,
  Schedule,
  Link as LinkIcon,
  ThumbUp,
  ThumbDown,
  Send
} from '@mui/icons-material';
import { styled } from '@mui/system';
import { useSelector } from 'react-redux';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// 注册Chart.js组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// 样式组件
const ResourceImage = styled('img')(({ theme }) => ({
  width: '100%',
  height: 250,
  objectFit: 'cover',
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(2)
}));

const StyledRating = styled(Rating)(({ theme }) => ({
  '& .MuiRating-iconFilled': {
    color: theme.palette.primary.main,
  }
}));

const SpecItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(1.5),
  '& .MuiSvgIcon-root': {
    marginRight: theme.spacing(1),
    color: theme.palette.primary.main
  }
}));

const StatusChip = styled(Chip)(({ theme, status }) => ({
  backgroundColor: status === 'available' 
    ? theme.palette.success.light 
    : status === 'busy'
      ? theme.palette.warning.light
      : theme.palette.error.light,
  color: status === 'available'
    ? theme.palette.success.dark
    : status === 'busy'
      ? theme.palette.warning.dark
      : theme.palette.error.dark,
  fontWeight: 'bold'
}));

// 模拟数据
const mockResource = {
  id: 'res-12345',
  name: 'High Performance Computing Cluster',
  description: 'Enterprise-grade computing cluster with 128 CPU cores and 512GB RAM, perfect for large-scale data processing, scientific simulations, and AI/ML training.',
  provider: 'TechCloud Solutions',
  providerAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  location: 'Frankfurt, Germany',
  type: 'Compute',
  status: 'available',
  rating: 4.7,
  reviewCount: 48,
  price: 5.75,
  pricePeriod: 'hour',
  image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31',
  specs: {
    cpu: '128 cores (AMD EPYC 7763)',
    ram: '512 GB DDR4',
    storage: '4 TB NVMe SSD',
    network: '40 Gbps',
    gpu: 'NVIDIA A100 (4x)',
  },
  uptime: '99.95%',
  availability: {
    nextAvailable: '2023-03-28T09:00:00Z',
    scheduledDowntime: []
  },
  tags: ['HPC', 'AI/ML', 'Data Processing', 'Scientific Computing'],
  metrics: {
    utilization: [65, 78, 82, 75, 68, 90, 85],
    performance: [92, 95, 90, 88, 93, 94, 91],
    dates: ['Mar 20', 'Mar 21', 'Mar 22', 'Mar 23', 'Mar 24', 'Mar 25', 'Mar 26']
  }
};

const mockReviews = [
  {
    id: 1,
    user: 'Dr. Sarah Chen',
    avatar: 'https://randomuser.me/api/portraits/women/45.jpg',
    rating: 5,
    date: '2023-03-15',
    comment: 'Exceptional performance for our genomics research. The cluster handled our workload efficiently and the uptime was excellent.',
    helpful: 12,
    notHelpful: 1
  },
  {
    id: 2,
    user: 'Mark Johnson',
    avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
    rating: 4,
    date: '2023-03-10',
    comment: 'Great resource for our ML model training. Could use better documentation on optimal configurations, but overall very satisfied.',
    helpful: 8,
    notHelpful: 2
  },
  {
    id: 3,
    user: 'Dr. Alex Rivera',
    avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
    rating: 5,
    date: '2023-03-05',
    comment: 'Perfect for our climate simulation models. The resource scaled wonderfully with our increasing demands.',
    helpful: 15,
    notHelpful: 0
  }
];

function ResourceDetail() {
  const { resourceId } = useParams();
  const navigate = useNavigate();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [newReview, setNewReview] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const [isRenting, setIsRenting] = useState(false);
  
  // 从Redux或其他状态管理获取用户信息
  const isLoggedIn = useSelector(state => state?.auth?.isLoggedIn) || false;
  
  useEffect(() => {
    // 模拟API调用
    const fetchResourceDetails = async () => {
      setLoading(true);
      setError('');
      
      try {
        // 在实际应用中，这里会调用API获取资源详情
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 使用模拟数据
        setResource(mockResource);
        setReviews(mockReviews);
      } catch (err) {
        setError('Failed to load resource details. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchResourceDetails();
  }, [resourceId]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleTimeframeChange = (event, newValue) => {
    setSelectedTimeframe(newValue);
  };
  
  const handleReviewSubmit = async () => {
    if (!newReview.trim()) return;
    
    setSubmittingReview(true);
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 添加新评论到列表
      const newReviewObj = {
        id: reviews.length + 1,
        user: 'Current User',
        avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
        rating: newRating,
        date: new Date().toISOString().split('T')[0],
        comment: newReview,
        helpful: 0,
        notHelpful: 0
      };
      
      setReviews([newReviewObj, ...reviews]);
      setNewReview('');
      setNewRating(5);
    } catch (err) {
      setError('Failed to submit review. Please try again.');
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };
  
  const handleRentResource = async () => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: `/resources/${resourceId}` } });
      return;
    }
    
    setIsRenting(true);
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 在实际应用中，这里会进行资源租用流程
      // 成功后重定向到工作创建页面或仪表板
      navigate('/jobs/create', { state: { selectedResource: resourceId } });
    } catch (err) {
      setError('Failed to initiate resource rental. Please try again.');
      console.error(err);
    } finally {
      setIsRenting(false);
    }
  };
  
  // 生成不同时间段的图表数据
  const getChartData = (type) => {
    // 根据选定的时间段生成不同的数据点数量
    let labels = [];
    let data = [];
    
    if (selectedTimeframe === 'week') {
      labels = resource?.metrics.dates || [];
      data = type === 'utilization' 
        ? resource?.metrics.utilization || [] 
        : resource?.metrics.performance || [];
    } else if (selectedTimeframe === 'month') {
      // 模拟月度数据
      labels = Array.from({ length: 30 }, (_, i) => `Mar ${i+1}`);
      data = Array.from({ length: 30 }, () => Math.floor(Math.random() * 30) + 70);
    } else {
      // 模拟年度数据
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      data = Array.from({ length: 12 }, () => Math.floor(Math.random() * 30) + 70);
    }
    
    return {
      labels,
      datasets: [
        {
          label: type === 'utilization' ? 'Utilization (%)' : 'Performance Score',
          data,
          borderColor: type === 'utilization' ? 'rgba(255, 99, 132, 1)' : 'rgba(53, 162, 235, 1)',
          backgroundColor: type === 'utilization' ? 'rgba(255, 99, 132, 0.2)' : 'rgba(53, 162, 235, 0.2)',
          tension: 0.3,
          fill: true,
        },
      ],
    };
  };
  
  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/resources')}>
          Back to Resources
        </Button>
      </Container>
    );
  }
  
  if (!resource) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="warning">Resource not found</Alert>
        <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/resources')}>
          Back to Resources
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Button variant="outlined" sx={{ mb: 2 }} onClick={() => navigate('/resources')}>
        &lt; Back to Resources
      </Button>
      
      <Grid container spacing={4}>
        {/* 左侧 - 资源详情 */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <ResourceImage src={resource.image} alt={resource.name} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                {resource.name}
              </Typography>
              <StatusChip 
                label={resource.status === 'available' ? 'Available' : resource.status === 'busy' ? 'Busy' : 'Offline'} 
                status={resource.status}
              />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <StyledRating value={resource.rating} precision={0.1} readOnly />
              <Typography variant="body2" sx={{ ml: 1 }}>
                ({resource.rating}) · {resource.reviewCount} reviews
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
              {resource.tags.map(tag => (
                <Chip key={tag} label={tag} size="small" variant="outlined" />
              ))}
            </Stack>
            
            <Typography variant="body1" paragraph>
              {resource.description}
            </Typography>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" gutterBottom>Specifications</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <SpecItem>
                  <Computer /> 
                  <Typography variant="body1">{resource.specs.cpu}</Typography>
                </SpecItem>
                <SpecItem>
                  <Memory /> 
                  <Typography variant="body1">{resource.specs.ram}</Typography>
                </SpecItem>
                <SpecItem>
                  <Storage /> 
                  <Typography variant="body1">{resource.specs.storage}</Typography>
                </SpecItem>
              </Grid>
              <Grid item xs={12} md={6}>
                <SpecItem>
                  <Speed /> 
                  <Typography variant="body1">{resource.specs.network}</Typography>
                </SpecItem>
                <SpecItem>
                  <CloudQueue /> 
                  <Typography variant="body1">Uptime: {resource.uptime}</Typography>
                </SpecItem>
                <SpecItem>
                  <LocationOn /> 
                  <Typography variant="body1">{resource.location}</Typography>
                </SpecItem>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            <Box>
              <Typography variant="h6" gutterBottom>Provider</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar src={resource.providerAvatar} sx={{ mr: 2 }} />
                <Typography variant="body1">{resource.provider}</Typography>
              </Box>
            </Box>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Performance Metrics</Typography>
            
            <Box sx={{ mb: 2 }}>
              <Tabs value={selectedTimeframe} onChange={handleTimeframeChange} centered>
                <Tab label="Week" value="week" />
                <Tab label="Month" value="month" />
                <Tab label="Year" value="year" />
              </Tabs>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" align="center" gutterBottom>Resource Utilization</Typography>
                <Box sx={{ height: 250 }}>
                  <Line options={{ maintainAspectRatio: false }} data={getChartData('utilization')} />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" align="center" gutterBottom>Performance Score</Typography>
                <Box sx={{ height: 250 }}>
                  <Bar options={{ maintainAspectRatio: false }} data={getChartData('performance')} />
                </Box>
              </Grid>
            </Grid>
          </Paper>
          
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>Reviews and Ratings</Typography>
            
            {isLoggedIn && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" gutterBottom>Write a Review</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body2" sx={{ mr: 2 }}>Your Rating:</Typography>
                  <StyledRating
                    value={newRating}
                    onChange={(event, newValue) => {
                      setNewRating(newValue);
                    }}
                  />
                </Box>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Share your experience with this resource..."
                  value={newReview}
                  onChange={(e) => setNewReview(e.target.value)}
                  disabled={submittingReview}
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  endIcon={submittingReview ? <CircularProgress size={20} /> : <Send />}
                  onClick={handleReviewSubmit}
                  disabled={!newReview.trim() || submittingReview}
                >
                  Submit Review
                </Button>
              </Box>
            )}
            
            <Divider sx={{ my: 2 }} />
            
            <List>
              {reviews.map((review) => (
                <React.Fragment key={review.id}>
                  <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar src={review.avatar} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="subtitle1">{review.user}</Typography>
                          <Typography variant="body2" color="text.secondary">{review.date}</Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <StyledRating value={review.rating} readOnly size="small" />
                          <Typography variant="body1" sx={{ mt: 1 }}>{review.comment}</Typography>
                          <Box sx={{ display: 'flex', mt: 1 }}>
                            <Button 
                              size="small" 
                              startIcon={<ThumbUp fontSize="small" />}
                              sx={{ mr: 1 }}
                            >
                              Helpful ({review.helpful})
                            </Button>
                            <Button 
                              size="small" 
                              startIcon={<ThumbDown fontSize="small" />}
                            >
                              Not Helpful ({review.notHelpful})
                            </Button>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
            </List>
            
            {reviews.length === 0 && (
              <Typography variant="body1" sx={{ textAlign: 'center', py: A }}>
                No reviews yet. Be the first to review this resource!
              </Typography>
            )}
          </Paper>
        </Grid>
        
        {/* 右侧 - 价格和可用性 */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3, position: { md: 'sticky' }, top: { md: 20 } }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Pricing</Typography>
              <Typography variant="h4" component="div" sx={{ mb: 2 }}>
                {resource.price} CAL
                <Typography component="span" variant="body1" color="text.secondary">
                  /{resource.pricePeriod}
                </Typography>
              </Typography>
              
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleRentResource}
                disabled={resource.status !== 'available' || isRenting}
                sx={{ mb: 2 }}
                startIcon={isRenting ? <CircularProgress size={20} /> : <AttachMoney />}
              >
                {isRenting ? 'Processing...' : 'Rent Now'}
              </Button>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                {resource.status === 'available'
                  ? 'This resource is available for immediate use.'
                  : resource.status === 'busy'
                    ? `Next available: ${new Date(resource.availability.nextAvailable).toLocaleString()}`
                    : 'This resource is currently offline.'
                }
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>Resource Details</Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" scope="row">Type</TableCell>
                      <TableCell align="right">{resource.type}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Location</TableCell>
                      <TableCell align="right">{resource.location}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Provider</TableCell>
                      <TableCell align="right">{resource.provider}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Uptime</TableCell>
                      <TableCell align="right">{resource.uptime}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="body2" paragraph>
                <Schedule fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                Instant deployment
              </Typography>
              <Typography variant="body2" paragraph>
                <CheckCircle fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                Secure payment via CAL tokens
              </Typography>
              <Typography variant="body2">
                <LinkIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                Technical support included
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

export default ResourceDetail; 