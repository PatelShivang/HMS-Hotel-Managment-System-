const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    
    if (!token) {
        console.log('No token provided');
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decoded:', JSON.stringify(decoded));
        console.log('User from token:', JSON.stringify(decoded.user));
        console.log('User role from token:', decoded.user.role);
        req.user = decoded.user;
        next();
    } catch (err) {
        console.error('Token verification error:', err.message);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            console.log('Authorization failed: No user in request');
            return res.status(401).json({ msg: 'User not authenticated' });
        }
        
        // Convert roles to array if it's not already
        const allowedRoles = Array.isArray(roles) ? roles : [roles];
        
        console.log('User role:', req.user.role);
        console.log('Allowed roles:', JSON.stringify(allowedRoles));
        
        // Special case: admin role has access to everything
        if (req.user.role === 'admin') {
            console.log('Admin role detected - granting access');
            return next();
        }
        
        // Check if user role is in allowed roles
        const hasPermission = allowedRoles.includes(req.user.role);
        console.log('Role check result:', hasPermission);
        
        if (!hasPermission) {
            console.log('Authorization failed: Role not allowed');
            return res.status(403).json({ 
                msg: 'You do not have permission to perform this action' 
            });
        }
        
        console.log('Authorization successful');
        next();
    };
};

module.exports = { auth, authorize }; 