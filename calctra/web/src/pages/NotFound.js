import React from 'react';
import { useNavigate } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import { Container, Typography, Button, Box, Grid, Paper } from '@material-ui/core';
import { SentimentDissatisfied as SadIcon } from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  root: {
    marginTop: theme.spacing(12),
    marginBottom: theme.spacing(8),
    textAlign: 'center',
  },
  icon: {
    fontSize: 80,
    color: theme.palette.grey[500],
    marginBottom: theme.spacing(2),
  },
  title: {
    marginBottom: theme.spacing(1),
  },
  paper: {
    padding: theme.spacing(6),
    maxWidth: 600,
    margin: '0 auto',
    marginTop: theme.spacing(4),
  },
  button: {
    margin: theme.spacing(2),
  },
}));

const NotFound = () => {
  const classes = useStyles();
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1);
  };

  const goHome = () => {
    navigate('/');
  };

  return (
    <Container className={classes.root}>
      <SadIcon className={classes.icon} />
      <Typography variant="h2" component="h1" className={classes.title}>
        404
      </Typography>
      <Typography variant="h4" component="h2" color="textSecondary" gutterBottom>
        Page Not Found
      </Typography>

      <Paper elevation={2} className={classes.paper}>
        <Typography variant="body1" paragraph>
          The page you are looking for doesn't exist or has been moved.
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          Please check the URL in the address bar and try again or use the navigation
          options below.
        </Typography>

        <Grid container justify="center">
          <Grid item>
            <Button
              variant="outlined"
              color="primary"
              className={classes.button}
              onClick={goBack}
            >
              Go Back
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              className={classes.button}
              onClick={goHome}
            >
              Go to Homepage
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Box mt={4}>
        <Typography variant="body2" color="textSecondary">
          If you believe this is an error, please contact support.
        </Typography>
      </Box>
    </Container>
  );
};

export default NotFound;
