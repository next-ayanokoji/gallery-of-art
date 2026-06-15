/**
 * Authentication Middleware
 * JWT token verification for protected routes
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false, 
                message: 'Not authorized to access this route' 
            });
        }

        const token = authHeader.split(' ')[1];

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            
            // Get user from token
            req.user = await User.findById(decoded.id).select('-password');
            
            if (!req.user) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'User not found' 
                });
            }

            next();
        } catch (error) {
            return res.status(401).json({ 
                success: false, 
                message: 'Token is not valid' 
            });
        }
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: 'Server error in authentication' 
        });
    }
};

// Check if user is admin
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ 
            success: false, 
            message: 'Not authorized as admin' 
        });
    }
};

module.exports = { protect, admin };
