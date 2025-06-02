import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchServiceRequests = createAsyncThunk(
    'serviceRequests/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await api.get('/service-requests');
            return data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const createServiceRequest = createAsyncThunk(
    'serviceRequests/create',
    async (requestData, { rejectWithValue }) => {
        try {
            const { data } = await api.post('/service-requests', requestData);
            return data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const updateServiceRequest = createAsyncThunk(
    'serviceRequests/update',
    async ({ id, updateData }, { rejectWithValue }) => {
        try {
            const { data } = await api.put(`/service-requests/${id}`, updateData);
            return data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const deleteServiceRequest = createAsyncThunk(
    'serviceRequests/delete',
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`/service-requests/${id}`);
            return id;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

const initialState = {
    requests: [],
    loading: false,
    error: null,
    filters: {
        status: 'all',
        type: 'all',
        priority: 'all'
    },
    selectedRequest: null
};

const serviceRequestSlice = createSlice({
    name: 'serviceRequests',
    initialState,
    reducers: {
        setFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        clearFilters: (state) => {
            state.filters = initialState.filters;
        },
        setSelectedRequest: (state, action) => {
            state.selectedRequest = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch all requests
            .addCase(fetchServiceRequests.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchServiceRequests.fulfilled, (state, action) => {
                state.loading = false;
                state.requests = action.payload;
            })
            .addCase(fetchServiceRequests.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.msg || 'Failed to fetch service requests';
            })
            // Create request
            .addCase(createServiceRequest.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createServiceRequest.fulfilled, (state, action) => {
                state.loading = false;
                state.requests.unshift(action.payload);
            })
            .addCase(createServiceRequest.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.msg || 'Failed to create service request';
            })
            // Update request
            .addCase(updateServiceRequest.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateServiceRequest.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.requests.findIndex(
                    (request) => request._id === action.payload._id
                );
                if (index !== -1) {
                    state.requests[index] = action.payload;
                }
            })
            .addCase(updateServiceRequest.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.msg || 'Failed to update service request';
            })
            // Delete request
            .addCase(deleteServiceRequest.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteServiceRequest.fulfilled, (state, action) => {
                state.loading = false;
                state.requests = state.requests.filter(
                    (request) => request._id !== action.payload
                );
            })
            .addCase(deleteServiceRequest.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.msg || 'Failed to delete service request';
            });
    }
});

export const { setFilters, clearFilters, setSelectedRequest, clearError } = serviceRequestSlice.actions;

export default serviceRequestSlice.reducer; 