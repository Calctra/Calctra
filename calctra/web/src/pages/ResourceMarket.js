import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Box,
  Chip,
  Divider,
  Paper,
  InputAdornment,
  Snackbar,
} from '@material-ui/core';
import { 
  Search as SearchIcon, 
  FilterList as FilterIcon,
  Computer as ComputerIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@material-ui/icons';
import { Alert } from '@material-ui/lab';
import { makeStyles } from '@material-ui/core/styles';
import { fetchResources } from '../redux/slices/resourceSlice';
import { RESOURCE_TYPES } from '../utils/constants';

const useStyles = makeStyles((theme) => ({
  root: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(6),
  },
  header: {
    marginBottom: theme.spacing(4),
  },
  filterContainer: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(4),
  },
  formControl: {
    minWidth: 120,
    marginRight: theme.spacing(2),
  },
  searchInput: {
    marginBottom: theme.spacing(2),
  },
  filterSection: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  filterLabel: {
    marginRight: theme.spacing(2),
    fontWeight: 'bold',
  },
  card: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: theme.shadows[4],
    },
  },
  resourceTypeChip: {
    marginRight: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  cardContent: {
    flexGrow: 1,
  },
  resourceIcon: {
    marginRight: theme.spacing(1),
    verticalAlign: 'middle',
  },
  resourceType: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  },
  resourceSpecs: {
    marginTop: theme.spacing(2),
  },
  specItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(0.5),
  },
  pricing: {
    fontWeight: 'bold',
    fontSize: '1.1rem',
    color: theme.palette.primary.main,
    marginTop: theme.spacing(2),
  },
  ratingContainer: {
    display: 'flex',
    alignItems: 'center',
    marginTop: theme.spacing(1),
  },
  ratingValue: {
    marginLeft: theme.spacing(1),
    fontWeight: 'bold',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(8),
  },
  buttonRent: {
    marginLeft: 'auto',
  },
  noResults: {
    padding: theme.spacing(4),
    textAlign: 'center',
  },
}));

const ResourceMarket = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { resources, isLoading, error } = useSelector((state) => state.resources);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    minCPU: '',
    minMemory: '',
    minStorage: '',
    maxPrice: '',
    sortBy: 'price_asc',
  });
  const [filteredResources, setFilteredResources] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchResources());
  }, [dispatch]);

  useEffect(() => {
    if (resources) {
      let filtered = [...resources];

      // Apply search
      if (searchTerm) {
        filtered = filtered.filter(
          (resource) =>
            resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            resource.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Apply filters
      if (filters.type) {
        filtered = filtered.filter((resource) => resource.type === filters.type);
      }
      if (filters.minCPU) {
        filtered = filtered.filter((resource) => resource.cpu >= parseInt(filters.minCPU));
      }
      if (filters.minMemory) {
        filtered = filtered.filter(
          (resource) => resource.memory >= parseInt(filters.minMemory)
        );
      }
      if (filters.minStorage) {
        filtered = filtered.filter(
          (resource) => resource.storage >= parseInt(filters.minStorage)
        );
      }
      if (filters.maxPrice) {
        filtered = filtered.filter(
          (resource) => resource.pricePerHour <= parseFloat(filters.maxPrice)
        );
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'price_asc':
          filtered.sort((a, b) => a.pricePerHour - b.pricePerHour);
          break;
        case 'price_desc':
          filtered.sort((a, b) => b.pricePerHour - a.pricePerHour);
          break;
        case 'rating_desc':
          filtered.sort((a, b) => b.rating - a.rating);
          break;
        case 'cpu_desc':
          filtered.sort((a, b) => b.cpu - a.cpu);
          break;
        case 'memory_desc':
          filtered.sort((a, b) => b.memory - a.memory);
          break;
        default:
          break;
      }

      setFilteredResources(filtered);
    }
  }, [resources, searchTerm, filters]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const handleResetFilters = () => {
    setFilters({
      type: '',
      minCPU: '',
      minMemory: '',
      minStorage: '',
      maxPrice: '',
      sortBy: 'price_asc',
    });
    setSearchTerm('');
  };

  const handleRentResource = (resourceId) => {
    if (!isAuthenticated) {
      setSnackbarOpen(true);
      return;
    }
    navigate(`/resources/${resourceId}`);
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case RESOURCE_TYPES.CPU:
        return <ComputerIcon />;
      case RESOURCE_TYPES.GPU:
        return <SpeedIcon />;
      case RESOURCE_TYPES.MEMORY:
        return <MemoryIcon />;
      case RESOURCE_TYPES.STORAGE:
        return <StorageIcon />;
      default:
        return <ComputerIcon />;
    }
  };

  const renderRating = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<StarIcon key={i} color="primary" fontSize="small" />);
      } else {
        stars.push(<StarBorderIcon key={i} color="primary" fontSize="small" />);
      }
    }
    return (
      <div className={classes.ratingContainer}>
        {stars}
        <span className={classes.ratingValue}>{rating.toFixed(1)}</span>
      </div>
    );
  };

  if (error) {
    return (
      <Container className={classes.root}>
        <Alert severity="error">
          Error loading resources: {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container className={classes.root}>
      <div className={classes.header}>
        <Typography variant="h4" component="h1" gutterBottom>
          Resource Market
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Browse and rent computing resources from providers around the world
        </Typography>
      </div>

      <Paper className={classes.filterContainer}>
        <TextField
          className={classes.searchInput}
          variant="outlined"
          fullWidth
          placeholder="Search resources..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <div className={classes.filterSection}>
          <FilterIcon className={classes.resourceIcon} />
          <Typography className={classes.filterLabel}>Filters:</Typography>

          <FormControl variant="outlined" size="small" className={classes.formControl}>
            <InputLabel>Resource Type</InputLabel>
            <Select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              label="Resource Type"
            >
              <MenuItem value="">All Types</MenuItem>
              {Object.values(RESOURCE_TYPES).map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl variant="outlined" size="small" className={classes.formControl}>
            <InputLabel>Min CPU Cores</InputLabel>
            <Select
              name="minCPU"
              value={filters.minCPU}
              onChange={handleFilterChange}
              label="Min CPU Cores"
            >
              <MenuItem value="">Any</MenuItem>
              <MenuItem value="2">2+ Cores</MenuItem>
              <MenuItem value="4">4+ Cores</MenuItem>
              <MenuItem value="8">8+ Cores</MenuItem>
              <MenuItem value="16">16+ Cores</MenuItem>
              <MenuItem value="32">32+ Cores</MenuItem>
            </Select>
          </FormControl>

          <FormControl variant="outlined" size="small" className={classes.formControl}>
            <InputLabel>Min Memory (GB)</InputLabel>
            <Select
              name="minMemory"
              value={filters.minMemory}
              onChange={handleFilterChange}
              label="Min Memory (GB)"
            >
              <MenuItem value="">Any</MenuItem>
              <MenuItem value="4">4+ GB</MenuItem>
              <MenuItem value="8">8+ GB</MenuItem>
              <MenuItem value="16">16+ GB</MenuItem>
              <MenuItem value="32">32+ GB</MenuItem>
              <MenuItem value="64">64+ GB</MenuItem>
            </Select>
          </FormControl>

          <FormControl variant="outlined" size="small" className={classes.formControl}>
            <InputLabel>Max Price (CAL/h)</InputLabel>
            <Select
              name="maxPrice"
              value={filters.maxPrice}
              onChange={handleFilterChange}
              label="Max Price (CAL/h)"
            >
              <MenuItem value="">Any</MenuItem>
              <MenuItem value="1">≤ 1 CAL/h</MenuItem>
              <MenuItem value="5">≤ 5 CAL/h</MenuItem>
              <MenuItem value="10">≤ 10 CAL/h</MenuItem>
              <MenuItem value="25">≤ 25 CAL/h</MenuItem>
              <MenuItem value="50">≤ 50 CAL/h</MenuItem>
            </Select>
          </FormControl>

          <FormControl variant="outlined" size="small" className={classes.formControl}>
            <InputLabel>Sort By</InputLabel>
            <Select
              name="sortBy"
              value={filters.sortBy}
              onChange={handleFilterChange}
              label="Sort By"
            >
              <MenuItem value="price_asc">Price: Low to High</MenuItem>
              <MenuItem value="price_desc">Price: High to Low</MenuItem>
              <MenuItem value="rating_desc">Highest Rating</MenuItem>
              <MenuItem value="cpu_desc">Most CPU Cores</MenuItem>
              <MenuItem value="memory_desc">Most Memory</MenuItem>
            </Select>
          </FormControl>

          <Button 
            variant="outlined" 
            color="primary" 
            onClick={handleResetFilters}
            style={{ marginLeft: 'auto' }}
          >
            Reset Filters
          </Button>
        </div>
      </Paper>

      {isLoading ? (
        <div className={classes.loadingContainer}>
          <CircularProgress />
        </div>
      ) : filteredResources.length === 0 ? (
        <Paper className={classes.noResults}>
          <Typography variant="h6" gutterBottom>
            No resources found
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Try adjusting your search criteria or filters
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredResources.map((resource) => (
            <Grid item key={resource.id} xs={12} sm={6} md={4}>
              <Card className={classes.card}>
                <CardContent className={classes.cardContent}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {resource.name}
                  </Typography>

                  <div className={classes.resourceType}>
                    {getResourceIcon(resource.type)}
                    <Chip 
                      label={resource.type} 
                      color="primary" 
                      size="small" 
                      className={classes.resourceTypeChip} 
                    />
                    {resource.gpu && (
                      <Chip 
                        label="GPU" 
                        color="secondary" 
                        size="small" 
                        className={classes.resourceTypeChip} 
                      />
                    )}
                  </div>

                  <Typography variant="body2" color="textSecondary" paragraph>
                    {resource.description}
                  </Typography>

                  <Divider />

                  <div className={classes.resourceSpecs}>
                    <div className={classes.specItem}>
                      <Typography variant="body2">CPU Cores:</Typography>
                      <Typography variant="body2" color="textPrimary">
                        {resource.cpu}
                      </Typography>
                    </div>
                    <div className={classes.specItem}>
                      <Typography variant="body2">Memory:</Typography>
                      <Typography variant="body2" color="textPrimary">
                        {resource.memory} GB
                      </Typography>
                    </div>
                    <div className={classes.specItem}>
                      <Typography variant="body2">Storage:</Typography>
                      <Typography variant="body2" color="textPrimary">
                        {resource.storage} GB
                      </Typography>
                    </div>
                    {resource.gpu && (
                      <div className={classes.specItem}>
                        <Typography variant="body2">GPU:</Typography>
                        <Typography variant="body2" color="textPrimary">
                          {resource.gpuModel}
                        </Typography>
                      </div>
                    )}
                  </div>

                  {renderRating(resource.rating)}

                  <Typography className={classes.pricing}>
                    {resource.pricePerHour} CAL / hour
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    size="small"
                    onClick={() => navigate(`/resources/${resource.id}`)}
                  >
                    Details
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    className={classes.buttonRent}
                    onClick={() => handleRentResource(resource.id)}
                  >
                    Rent
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={4000} 
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert severity="info" onClose={() => setSnackbarOpen(false)}>
          Please log in to rent computing resources
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ResourceMarket; 