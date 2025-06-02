import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Container,
    Typography,
    Paper,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Grid,
    Card,
    CardContent,
    Chip,
    Box,
    CircularProgress,
    Alert,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import {
    fetchServiceRequests,
    createServiceRequest,
    clearError,
} from '../../store/slices/serviceRequestSlice';

const requestTypes = [
    { value: 'room_cleaning', label: 'Room Cleaning' },
    { value: 'food_order', label: 'Food Order' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'other', label: 'Other' },
];

const priorityLevels = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
];

const statusColors = {
    pending: 'warning',
    in_progress: 'info',
    completed: 'success',
    cancelled: 'error',
};

const ServiceRequests = () => {
    const dispatch = useDispatch();
    const { requests, loading, error } = useSelector((state) => state.serviceRequests);
    const [openDialog, setOpenDialog] = useState(false);
    const [formData, setFormData] = useState({
        type: '',
        title: '',
        description: '',
        priority: 'medium',
    });

    useEffect(() => {
        dispatch(fetchServiceRequests());
    }, [dispatch]);

    const handleOpenDialog = () => {
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setFormData({
            type: '',
            title: '',
            description: '',
            priority: 'medium',
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
            await dispatch(createServiceRequest(formData)).unwrap();
            toast.success('Service request submitted successfully');
            handleCloseDialog();
        } catch (error) {
            toast.error(error.msg || 'Failed to submit service request');
        }
    };

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
                    Service Requests
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleOpenDialog}
                >
                    New Request
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {requests.map((request) => (
                    <Grid item xs={12} md={6} key={request._id}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    {request.title}
                                </Typography>
                                <Typography color="textSecondary" gutterBottom>
                                    Type: {request.type.replace('_', ' ')}
                                </Typography>
                                <Typography color="textSecondary" gutterBottom>
                                    Priority: {request.priority}
                                </Typography>
                                <Typography color="textSecondary" gutterBottom>
                                    Status: {request.status.replace('_', ' ')}
                                </Typography>
                                <Typography color="textSecondary">
                                    Submitted: {format(new Date(request.createdAt), 'PPp')}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>New Service Request</DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        <TextField
                            select
                            fullWidth
                            label="Request Type"
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            margin="normal"
                            required
                        >
                            {requestTypes.map((type) => (
                                <MenuItem key={type.value} value={type.value}>
                                    {type.label}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            fullWidth
                            label="Title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            label="Description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            margin="normal"
                            multiline
                            rows={4}
                            required
                        />
                        <TextField
                            select
                            fullWidth
                            label="Priority"
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            margin="normal"
                            required
                        >
                            {priorityLevels.map((level) => (
                                <MenuItem key={level.value} value={level.value}>
                                    {level.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button type="submit" variant="contained" color="primary">
                            Submit
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Container>
    );
};

export default ServiceRequests; 