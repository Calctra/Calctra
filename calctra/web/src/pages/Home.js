import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import {
  Container,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  Box,
  Paper,
} from '@material-ui/core';
import {
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Code as CodeIcon,
} from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  hero: {
    height: '80vh',
    display: 'flex',
    alignItems: 'center',
    backgroundImage: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
    color: 'white',
  },
  heroContent: {
    padding: theme.spacing(8, 0, 6),
  },
  heroButtons: {
    marginTop: theme.spacing(4),
  },
  section: {
    padding: theme.spacing(8, 0),
  },
  sectionAlt: {
    padding: theme.spacing(8, 0),
    backgroundColor: theme.palette.grey[100],
  },
  card: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
    },
  },
  cardMedia: {
    paddingTop: '56.25%', // 16:9
    backgroundColor: theme.palette.primary.light,
  },
  cardContent: {
    flexGrow: 1,
  },
  featureIcon: {
    fontSize: 50,
    color: theme.palette.primary.main,
  },
  featureContainer: {
    textAlign: 'center',
    padding: theme.spacing(3),
  },
  statValue: {
    fontSize: '2.5rem',
    fontWeight: 700,
    color: theme.palette.primary.main,
  },
  statContainer: {
    padding: theme.spacing(2),
    textAlign: 'center',
  },
}));

const Home = () => {
  const classes = useStyles();

  const features = [
    {
      title: 'Decentralized Resource Pool',
      description:
        'Combine idle computing resources globally to create a powerful scientific computing network.',
      icon: <StorageIcon className={classes.featureIcon} />,
    },
    {
      title: 'Resource Matching Engine',
      description:
        'Advanced algorithms match scientific computing tasks with the most suitable resources.',
      icon: <SpeedIcon className={classes.featureIcon} />,
    },
    {
      title: 'Privacy Computing Framework',
      description:
        'Homomorphic encryption allows computation on encrypted data, protecting privacy.',
      icon: <SecurityIcon className={classes.featureIcon} />,
    },
    {
      title: 'CAL Token Ecosystem',
      description:
        'Fair incentive mechanism powered by blockchain technology for all participants.',
      icon: <CodeIcon className={classes.featureIcon} />,
    },
  ];

  const stats = [
    { value: '10,000+', label: 'Computing Resources' },
    { value: '1,200+', label: 'Active Users' },
    { value: '50,000+', label: 'Tasks Completed' },
    { value: '30TB+', label: 'Data Processed' },
  ];

  return (
    <>
      <Box className={classes.hero}>
        <Container maxWidth="md" className={classes.heroContent}>
          <Typography component="h1" variant="h2" align="center" gutterBottom>
            Revolutionizing Scientific Computing with Blockchain
          </Typography>
          <Typography variant="h5" align="center" paragraph>
            Calctra creates a decentralized scientific computing ecosystem that
            democratizes access to computing resources, protects data privacy, and
            rewards contributors fairly.
          </Typography>
          <div className={classes.heroButtons}>
            <Grid container spacing={2} justifyContent="center">
              <Grid item>
                <Button
                  variant="contained"
                  color="secondary"
                  component={RouterLink}
                  to="/resources"
                  size="large"
                >
                  Explore Resources
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  color="inherit"
                  component={RouterLink}
                  to="/register"
                  size="large"
                >
                  Join Now
                </Button>
              </Grid>
            </Grid>
          </div>
        </Container>
      </Box>

      <div className={classes.section}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" gutterBottom>
            Core Features
          </Typography>
          <Typography variant="h6" align="center" color="textSecondary" paragraph>
            Building a new scientific computing infrastructure for the future.
          </Typography>
          <Grid container spacing={4} style={{ marginTop: 20 }}>
            {features.map((feature, index) => (
              <Grid item key={index} xs={12} sm={6} md={3}>
                <Paper elevation={2} className={classes.featureContainer}>
                  {feature.icon}
                  <Typography variant="h5" component="h3" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography>{feature.description}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </div>

      <div className={classes.sectionAlt}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" gutterBottom>
            Platform Statistics
          </Typography>
          <Grid container spacing={4} style={{ marginTop: 20 }}>
            {stats.map((stat, index) => (
              <Grid item key={index} xs={6} md={3}>
                <Paper elevation={2} className={classes.statContainer}>
                  <Typography className={classes.statValue}>{stat.value}</Typography>
                  <Typography variant="h6" color="textSecondary">
                    {stat.label}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </div>

      <div className={classes.section}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" gutterBottom>
            How It Works
          </Typography>
          <Typography variant="h6" align="center" color="textSecondary" paragraph>
            A simple three-step process to get started.
          </Typography>
          <Grid container spacing={4} style={{ marginTop: 20 }}>
            <Grid item xs={12} md={4}>
              <Card className={classes.card}>
                <CardMedia
                  className={classes.cardMedia}
                  image="https://via.placeholder.com/800x450?text=Step+1"
                  title="Step 1"
                />
                <CardContent className={classes.cardContent}>
                  <Typography gutterBottom variant="h5" component="h2">
                    1. Register Resources
                  </Typography>
                  <Typography>
                    Register your computing resources on the platform. Define specifications,
                    availability, and pricing.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card className={classes.card}>
                <CardMedia
                  className={classes.cardMedia}
                  image="https://via.placeholder.com/800x450?text=Step+2"
                  title="Step 2"
                />
                <CardContent className={classes.cardContent}>
                  <Typography gutterBottom variant="h5" component="h2">
                    2. Submit Compute Jobs
                  </Typography>
                  <Typography>
                    Submit your scientific computing tasks with requirements and budget. Our
                    matching engine will find optimal resources.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card className={classes.card}>
                <CardMedia
                  className={classes.cardMedia}
                  image="https://via.placeholder.com/800x450?text=Step+3"
                  title="Step 3"
                />
                <CardContent className={classes.cardContent}>
                  <Typography gutterBottom variant="h5" component="h2">
                    3. Earn & Utilize
                  </Typography>
                  <Typography>
                    Resource providers earn CAL tokens for computation. Users get results securely
                    with privacy protection.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          <Box mt={6} textAlign="center">
            <Button
              variant="contained"
              color="primary"
              size="large"
              component={RouterLink}
              to="/register"
            >
              Get Started Today
            </Button>
          </Box>
        </Container>
      </div>
    </>
  );
};

export default Home; 