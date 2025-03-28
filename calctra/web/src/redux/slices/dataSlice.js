import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import dataService from '../../services/dataService';

export const fetchMyDatasets = createAsyncThunk(
  'data/fetchMine',
  async (_, { rejectWithValue }) => {
    try {
      return await dataService.getMyDatasets();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch your datasets');
    }
  }
);

export const fetchPublicDatasets = createAsyncThunk(
  'data/fetchPublic',
  async (_, { rejectWithValue }) => {
    try {
      return await dataService.getPublicDatasets();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch public datasets');
    }
  }
);

export const fetchDatasetById = createAsyncThunk(
  'data/fetchById',
  async (datasetId, { rejectWithValue }) => {
    try {
      return await dataService.getDatasetById(datasetId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dataset details');
    }
  }
);

export const uploadDataset = createAsyncThunk(
  'data/upload',
  async (datasetData, { rejectWithValue }) => {
    try {
      return await dataService.uploadDataset(datasetData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload dataset');
    }
  }
);

export const updateDatasetPermissions = createAsyncThunk(
  'data/updatePermissions',
  async ({ datasetId, permissions }, { rejectWithValue }) => {
    try {
      return await dataService.updateDatasetPermissions(datasetId, permissions);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update dataset permissions');
    }
  }
);

export const deleteDataset = createAsyncThunk(
  'data/delete',
  async (datasetId, { rejectWithValue }) => {
    try {
      await dataService.deleteDataset(datasetId);
      return datasetId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete dataset');
    }
  }
);

const initialState = {
  myDatasets: [],
  publicDatasets: [],
  currentDataset: null,
  isLoading: false,
  error: null,
};

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    clearDataError: (state) => {
      state.error = null;
    },
    clearCurrentDataset: (state) => {
      state.currentDataset = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch my datasets
      .addCase(fetchMyDatasets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyDatasets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myDatasets = action.payload;
      })
      .addCase(fetchMyDatasets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch public datasets
      .addCase(fetchPublicDatasets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPublicDatasets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.publicDatasets = action.payload;
      })
      .addCase(fetchPublicDatasets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch dataset by ID
      .addCase(fetchDatasetById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDatasetById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentDataset = action.payload;
      })
      .addCase(fetchDatasetById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Upload dataset
      .addCase(uploadDataset.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadDataset.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myDatasets.push(action.payload);
      })
      .addCase(uploadDataset.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update dataset permissions
      .addCase(updateDatasetPermissions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateDatasetPermissions.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update in my datasets
        const myIndex = state.myDatasets.findIndex(dataset => dataset.id === action.payload.id);
        if (myIndex !== -1) {
          state.myDatasets[myIndex] = action.payload;
        }
        // Update in public datasets if applicable
        const publicIndex = state.publicDatasets.findIndex(dataset => dataset.id === action.payload.id);
        if (publicIndex !== -1) {
          state.publicDatasets[publicIndex] = action.payload;
        }
        // Update current dataset if applicable
        if (state.currentDataset && state.currentDataset.id === action.payload.id) {
          state.currentDataset = action.payload;
        }
      })
      .addCase(updateDatasetPermissions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Delete dataset
      .addCase(deleteDataset.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteDataset.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myDatasets = state.myDatasets.filter(dataset => dataset.id !== action.payload);
        state.publicDatasets = state.publicDatasets.filter(dataset => dataset.id !== action.payload);
        if (state.currentDataset && state.currentDataset.id === action.payload) {
          state.currentDataset = null;
        }
      })
      .addCase(deleteDataset.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearDataError, clearCurrentDataset } = dataSlice.actions;
export default dataSlice.reducer; 