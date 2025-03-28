import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  ButtonGroup,
  CircularProgress,
  Alert,
  Divider,
  useTheme
} from '@mui/material';
import { 
  Bar, 
  Line, 
  Pie, 
  Doughnut,
  PolarArea,
  Radar
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// 注册Chart.js组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

// 数据可视化组件
function DataVisualization() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('week');
  const [chartData, setChartData] = useState(null);

  // 生成图表选项
  const getChartOptions = (title) => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: title,
          font: {
            size: 16
          }
        },
      },
    };
  };

  // 加载数据
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1200));

        // 根据选定时间范围生成不同的数据点
        let labels = [];
        if (timeRange === 'week') {
          labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        } else if (timeRange === 'month') {
          labels = Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`);
        } else {
          labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        }

        // 生成模拟数据
        const computeUsage = generateRandomData(labels.length, 40, 100);
        const storageUsage = generateRandomData(labels.length, 30, 90);
        const networkUsage = generateRandomData(labels.length, 20, 80);
        const tokenSpending = generateRandomData(labels.length, 10, 50);
        const jobCompletion = generateRandomData(labels.length, 60, 100);
        
        // 设置图表数据
        setChartData({
          labels,
          resourceUtilization: {
            labels,
            datasets: [
              {
                label: 'Compute',
                data: computeUsage,
                backgroundColor: theme.palette.primary.main,
                borderColor: theme.palette.primary.main,
                borderWidth: 2,
              },
              {
                label: 'Storage',
                data: storageUsage,
                backgroundColor: theme.palette.secondary.main,
                borderColor: theme.palette.secondary.main,
                borderWidth: 2,
              },
              {
                label: 'Network',
                data: networkUsage,
                backgroundColor: theme.palette.success.main,
                borderColor: theme.palette.success.main,
                borderWidth: 2,
              }
            ],
          },
          spending: {
            labels,
            datasets: [
              {
                label: 'CAL Token Spending',
                data: tokenSpending,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
              }
            ],
          },
          jobsStatus: {
            labels: ['Completed', 'Running', 'Failed', 'Queued'],
            datasets: [
              {
                data: [65, 15, 7, 13],
                backgroundColor: [
                  theme.palette.success.light,
                  theme.palette.primary.light,
                  theme.palette.error.light,
                  theme.palette.warning.light,
                ],
                borderColor: [
                  theme.palette.success.main,
                  theme.palette.primary.main,
                  theme.palette.error.main,
                  theme.palette.warning.main,
                ],
                borderWidth: 1,
              },
            ],
          },
          resourceTypes: {
            labels: ['Compute', 'Storage', 'GPU', 'TPU', 'IoT Devices'],
            datasets: [
              {
                data: [40, 25, 20, 10, 5],
                backgroundColor: [
                  'rgba(54, 162, 235, 0.7)',
                  'rgba(255, 206, 86, 0.7)',
                  'rgba(75, 192, 192, 0.7)',
                  'rgba(153, 102, 255, 0.7)',
                  'rgba(255, 159, 64, 0.7)',
                ],
                borderWidth: 1,
              },
            ],
          },
          datasetUsage: {
            labels: ['Research', 'ML Training', 'Analytics', 'Simulations', 'Data Processing'],
            datasets: [
              {
                label: 'Dataset Usage by Category',
                data: [80, 70, 60, 50, 40],
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
              },
            ],
          },
          performanceMetrics: {
            labels: ['Processing Speed', 'Reliability', 'Uptime', 'Throughput', 'Response Time', 'Error Rate'],
            datasets: [
              {
                label: 'Current',
                data: [85, 90, 95, 80, 75, 15],
                fill: true,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(54, 162, 235, 1)',
              },
              {
                label: 'Last Period',
                data: [75, 85, 90, 75, 70, 20],
                fill: true,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(255, 99, 132, 1)',
              },
            ],
          },
          jobCompletionTrend: {
            labels,
            datasets: [
              {
                label: 'Job Completion Rate',
                data: jobCompletion,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true,
              }
            ],
          },
        });
      } catch (err) {
        setError('Failed to load visualization data. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange, theme]);

  // 生成随机数据辅助函数
  const generateRandomData = (length, min, max) => {
    return Array.from({ length }, () => Math.floor(Math.random() * (max - min + 1)) + min);
  };

  // 处理时间范围变更
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
    );
  }

  if (!chartData) {
    return (
      <Alert severity="info">No data available for visualization.</Alert>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Analytics Dashboard
        </Typography>
        <ButtonGroup variant="outlined" size="small">
          <Button 
            onClick={() => handleTimeRangeChange('week')}
            variant={timeRange === 'week' ? 'contained' : 'outlined'}
          >
            Week
          </Button>
          <Button 
            onClick={() => handleTimeRangeChange('month')}
            variant={timeRange === 'month' ? 'contained' : 'outlined'}
          >
            Month
          </Button>
          <Button 
            onClick={() => handleTimeRangeChange('year')}
            variant={timeRange === 'year' ? 'contained' : 'outlined'}
          >
            Year
          </Button>
        </ButtonGroup>
      </Box>

      <Grid container spacing={3}>
        {/* 资源利用率 */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ height: 300 }}>
              <Line 
                options={getChartOptions('Resource Utilization (%)')} 
                data={chartData.resourceUtilization} 
              />
            </Box>
          </Paper>
        </Grid>

        {/* 作业状态分布 */}
        <Grid item xs={12} sm={6} lg={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ height: 300 }}>
              <Doughnut 
                options={getChartOptions('Jobs Status Distribution')} 
                data={chartData.jobsStatus} 
              />
            </Box>
          </Paper>
        </Grid>

        {/* CAL代币支出 */}
        <Grid item xs={12} sm={6} lg={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ height: 300 }}>
              <Line 
                options={getChartOptions('CAL Token Spending')} 
                data={chartData.spending} 
              />
            </Box>
          </Paper>
        </Grid>

        {/* 资源类型分布 */}
        <Grid item xs={12} sm={6} lg={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ height: 300 }}>
              <Pie 
                options={getChartOptions('Resource Types Distribution')} 
                data={chartData.resourceTypes} 
              />
            </Box>
          </Paper>
        </Grid>

        {/* 性能指标 */}
        <Grid item xs={12} sm={6} lg={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ height: 300 }}>
              <Radar 
                options={getChartOptions('Performance Metrics')} 
                data={chartData.performanceMetrics} 
              />
            </Box>
          </Paper>
        </Grid>

        {/* 数据集使用情况 */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ height: 300 }}>
              <Bar 
                options={getChartOptions('Dataset Usage by Category')} 
                data={chartData.datasetUsage} 
              />
            </Box>
          </Paper>
        </Grid>

        {/* 作业完成趋势 */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ height: 300 }}>
              <Line 
                options={getChartOptions('Job Completion Rate Trend')} 
                data={chartData.jobCompletionTrend} 
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default DataVisualization; 