import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import resourceService from '../../services/resourceService';

export const fetchResources = createAsyncThunk(
  'resources/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await resourceService.getResources();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch resources');
    }
  }
);

export const fetchMyResources = createAsyncThunk(
  'resources/fetchMine',
  async (_, { rejectWithValue }) => {
    try {
      return await resourceService.getMyResources();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch your resources');
    }
  }
);

export const addResource = createAsyncThunk(
  'resources/add',
  async (resourceData, { rejectWithValue }) => {
    try {
      return await resourceService.addResource(resourceData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add resource');
    }
  }
);

export const updateResource = createAsyncThunk(
  'resources/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await resourceService.updateResource(id, data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update resource');
    }
  }
);

const initialState = {
  resources: [],
  myResources: [],
  isLoading: false,
  error: null,
};

const resourceSlice = createSlice({
  name: 'resources',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchResources.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchResources.fulfilled, (state, action) => {
        state.isLoading = false;
        state.resources = action.payload;
      })
      .addCase(fetchResources.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchMyResources.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyResources.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myResources = action.payload;
      })
      .addCase(fetchMyResources.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(addResource.fulfilled, (state, action) => {
        state.myResources.push(action.payload);
      })
      .addCase(updateResource.fulfilled, (state, action) => {
        const index = state.myResources.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.myResources[index] = action.payload;
        }
      });
  },
});

export const { clearError } = resourceSlice.actions;
export default resourceSlice.reducer; 