import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import { 
  Container, 
  Grid, 
  Typography, 
  Link, 
  Box, 
  Divider 
} from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  footer: {
    padding: theme.spacing(6, 0),
    marginTop: 'auto',
    backgroundColor: theme.palette.primary.main,
    color: '#fff',
  },
  link: {
    color: '#fff',
    marginBottom: theme.spacing(1),
    display: 'block',
    '&:hover': {
      color: theme.palette.grey[300],
    },
  },
  title: {
    fontWeight: 700,
    marginBottom: theme.spacing(2),
  },
  copyright: {
    marginTop: theme.spacing(4),
    textAlign: 'center',
  },
}));

const Footer = () => {
  const classes = useStyles();
  const currentYear = new Date().getFullYear();

  return (
    <footer className={classes.footer}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" className={classes.title}>
              Calctra
            </Typography>
            <Typography variant="body2" gutterBottom>
              A decentralized scientific computing ecosystem powered by blockchain technology.
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" className={classes.title}>
              Quick Links
            </Typography>
            <Link component={RouterLink} to="/" className={classes.link}>
              Home
            </Link>
            <Link component={RouterLink} to="/resources" className={classes.link}>
              Resource Market
            </Link>
            <Link component={RouterLink} to="/dashboard" className={classes.link}>
              Dashboard
            </Link>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" className={classes.title}>
              Resources
            </Typography>
            <Link href="#" className={classes.link}>
              API Reference
            </Link>
            <Link href="#" className={classes.link}>
              Whitepaper
            </Link>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" className={classes.title}>
              Community
            </Typography>
            <Link href="#" className={classes.link}>
              GitHub
            </Link>
            <Link href="#" className={classes.link}>
              Twitter
            </Link>
          </Grid>
        </Grid>
        <Divider style={{ background: 'rgba(255, 255, 255, 0.2)', margin: '24px 0' }} />
        <Box className={classes.copyright}>
          <Typography variant="body2">
            © {currentYear} Calctra. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </footer>
  );
};

export default Footer; 