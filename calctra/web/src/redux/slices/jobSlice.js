import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import jobService from '../../services/jobService';

// Initial state
const initialState = {
  jobs: [],
  currentJob: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  error: '',
};

// Fetch all jobs for the current user
export const fetchUserJobs = createAsyncThunk(
  'jobs/fetchAll',
  async (_, thunkAPI) => {
    try {
      return await jobService.getUserJobs();
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch jobs';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Fetch a job by ID
export const fetchJobById = createAsyncThunk(
  'jobs/fetchById',
  async (jobId, thunkAPI) => {
    try {
      return await jobService.getJobById(jobId);
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch job';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Create a new job
export const createJob = createAsyncThunk(
  'jobs/create',
  async (jobData, thunkAPI) => {
    try {
      return await jobService.createJob(jobData);
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to create job';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update a job
export const updateJob = createAsyncThunk(
  'jobs/update',
  async ({ jobId, jobData }, thunkAPI) => {
    try {
      return await jobService.updateJob(jobId, jobData);
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update job';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete a job
export const deleteJob = createAsyncThunk(
  'jobs/delete',
  async (jobId, thunkAPI) => {
    try {
      await jobService.deleteJob(jobId);
      return jobId;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to delete job';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Cancel a job
export const cancelJob = createAsyncThunk(
  'jobs/cancel',
  async (jobId, thunkAPI) => {
    try {
      return await jobService.cancelJob(jobId);
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to cancel job';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get job results
export const getJobResults = createAsyncThunk(
  'jobs/getResults',
  async (jobId, thunkAPI) => {
    try {
      return await jobService.getJobResults(jobId);
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to get job results';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get job logs
export const getJobLogs = createAsyncThunk(
  'jobs/getLogs',
  async (jobId, thunkAPI) => {
    try {
      return await jobService.getJobLogs(jobId);
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to get job logs';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get public jobs
export const getPublicJobs = createAsyncThunk(
  'jobs/getPublic',
  async (filters, thunkAPI) => {
    try {
      return await jobService.getPublicJobs(filters);
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to get public jobs';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Job slice
const jobSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.error = '';
    },
    clearCurrentJob: (state) => {
      state.currentJob = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user jobs
      .addCase(fetchUserJobs.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchUserJobs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.jobs = action.payload;
      })
      .addCase(fetchUserJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.error = action.payload;
        state.jobs = [];
      })
      
      // Fetch job by ID
      .addCase(fetchJobById.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchJobById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.currentJob = action.payload;
      })
      .addCase(fetchJobById.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.error = action.payload;
        state.currentJob = null;
      })
      
      // Create job
      .addCase(createJob.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(createJob.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.jobs.push(action.payload);
      })
      .addCase(createJob.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.error = action.payload;
      })
      
      // Update job
      .addCase(updateJob.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(updateJob.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.jobs = state.jobs.map(job => 
          job.id === action.payload.id ? action.payload : job
        );
        if (state.currentJob && state.currentJob.id === action.payload.id) {
          state.currentJob = action.payload;
        }
      })
      .addCase(updateJob.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.error = action.payload;
      })
      
      // Delete job
      .addCase(deleteJob.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(deleteJob.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.jobs = state.jobs.filter(job => job.id !== action.payload);
        if (state.currentJob && state.currentJob.id === action.payload) {
          state.currentJob = null;
        }
      })
      .addCase(deleteJob.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.error = action.payload;
      })
      
      // Cancel job
      .addCase(cancelJob.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(cancelJob.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        
        // Update job status in jobs array
        state.jobs = state.jobs.map(job => 
          job.id === action.payload.id ? action.payload : job
        );
        
        // Update currentJob if it's the one being cancelled
        if (state.currentJob && state.currentJob.id === action.payload.id) {
          state.currentJob = action.payload;
        }
      })
      .addCase(cancelJob.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.error = action.payload;
      })
      
      // Get job results
      .addCase(getJobResults.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(getJobResults.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        
        // If we're viewing a current job, update its results
        if (state.currentJob) {
          state.currentJob = {
            ...state.currentJob,
            results: action.payload
          };
        }
      })
      .addCase(getJobResults.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.error = action.payload;
      })
      
      // Get job logs
      .addCase(getJobLogs.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(getJobLogs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        
        // If we're viewing a current job, update its logs
        if (state.currentJob) {
          state.currentJob = {
            ...state.currentJob,
            logs: action.payload
          };
        }
      })
      .addCase(getJobLogs.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.error = action.payload;
      })
      
      // Get public jobs
      .addCase(getPublicJobs.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(getPublicJobs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.publicJobs = action.payload;
      })
      .addCase(getPublicJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.error = action.payload;
        state.publicJobs = [];
      });
  },
});

export const { reset, clearCurrentJob } = jobSlice.actions;
export default jobSlice.reducer; 