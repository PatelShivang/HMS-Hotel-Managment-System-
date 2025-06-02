import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Container,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Box,
    CircularProgress,
    Alert,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import {
    fetchServiceRequests,
    updateServiceRequest,
    deleteServiceRequest,
    setFilters,
    clearFilters,
    clearError,
} from '../../store/slices/serviceRequestSlice';

const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
];

const statusColors = {
    pending: 'warning',
    in_progress: 'info',
    completed: 'success',
    cancelled: 'error',
};

const ServiceRequestManagement = () => {
    const dispatch = useDispatch();
    const { requests, loading, error, filters } = useSelector((state) => state.serviceRequests);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [formData, setFormData] = useState({
        status: '',
        assignedTo: '',
        notes: '',
    });

    useEffect(() => {
        dispatch(fetchServiceRequests());
    }, [dispatch]);

    const handleOpenDialog = (request) => {
        setSelectedRequest(request);
        setFormData({
            status: request.status,
            assignedTo: request.assignedTo?._id || '',
            notes: request.notes || '',
        });
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedRequest(null);
        setFormData({
            status: '',
            assignedTo: '',
            notes: '',
        });
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await dispatch(updateServiceRequest({
                id: selectedRequest._id,
                updateData: formData
            })).unwrap();
            toast.success('Service request updated successfully');
            handleCloseDialog();
        } catch (error) {
            toast.error(error.msg || 'Failed to update service request');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this service request?')) {
            try {
                await dispatch(deleteServiceRequest(id)).unwrap();
                toast.success('Service request deleted successfully');
            } catch (error) {
                toast.error(error.msg || 'Failed to delete service request');
            }
        }
    };

    const handleFilterChange = (field, value) => {
        dispatch(setFilters({ [field]: value }));
    };

    const filteredRequests = requests.filter((request) => {
        if (filters.status !== 'all' && request.status !== filters.status) {
            return false;
        }
        if (filters.type !== 'all' && request.type !== filters.type) {
            return false;
        }
        if (filters.priority !== 'all' && request.priority !== filters.priority) {
            return false;
        }
        return true;
    });

    if (loading) {
        return (
            <Container>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    return (
        <Container>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" component="h1">
                    Service Request Management
                </Typography>
                <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => dispatch(clearFilters())}
                >
                    Clear Filters
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ mb: 3, p: 2 }}>
                <Box display="flex" gap={2}>
                    <TextField
                        select
                        label="Status"
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        sx={{ minWidth: 200 }}
                    >
                        <MenuItem value="all">All Statuses</MenuItem>
                        {statusOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        select
                        label="Type"
                        value={filters.type}
                        onChange={(e) => handleFilterChange('type', e.target.value)}
                        sx={{ minWidth: 200 }}
                    >
                        <MenuItem value="all">All Types</MenuItem>
                        <MenuItem value="room_cleaning">Room Cleaning</MenuItem>
                        <MenuItem value="food_order">Food Order</MenuItem>
                        <MenuItem value="maintenance">Maintenance</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                    </TextField>
                    <TextField
                        select
                        label="Priority"
                        value={filters.priority}
                        onChange={(e) => handleFilterChange('priority', e.target.value)}
                        sx={{ minWidth: 200 }}
                    >
                        <MenuItem value="all">All Priorities</MenuItem>
                        <MenuItem value="low">Low</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                    </TextField>
                </Box>
            </Paper>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Title</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Priority</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Guest</TableCell>
                            <TableCell>Submitted</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredRequests.map((request) => (
                            <TableRow key={request._id}>
                                <TableCell>{request.title}</TableCell>
                                <TableCell>{request.type.replace('_', ' ')}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={request.priority}
                                        color={request.priority === 'high' ? 'error' : request.priority === 'medium' ? 'warning' : 'success'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={request.status.replace('_', ' ')}
                                        color={statusColors[request.status]}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>{request.user.name}</TableCell>
                                <TableCell>
                                    {format(new Date(request.createdAt), 'PPp')}
                                </TableCell>
                                <TableCell>
                                    <Tooltip title="Update Status">
                                        <IconButton
                                            color="primary"
                                            onClick={() => handleOpenDialog(request)}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete Request">
                                        <IconButton
                                            color="error"
                                            onClick={() => handleDelete(request._id)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Update Service Request</DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        <TextField
                            select
                            fullWidth
                            label="Status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            margin="normal"
                            required
                        >
                            {statusOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            fullWidth
                            label="Notes"
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            margin="normal"
                            multiline
                            rows={4}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button type="submit" variant="contained" color="primary">
                            Update
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Container>
    );
};

export default ServiceRequestManagement; 