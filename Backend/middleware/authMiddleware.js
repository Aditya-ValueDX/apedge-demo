// src/middleware/authMiddleware.js
import { readData } from '../utils/fileHandler.js'; // Assuming fileHandler exists
const USERS_FILE = './data/users.json'; //

export const authenticateToken = async (req, res, next) => {
    // In a real application, you'd send a JWT from the frontend
    // For this file-based system, we'll simulate by expecting a userId and userRole in headers
    // Or you could parse a simple base64 encoded 'token' containing userId and role.
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];

    if (!userId || !userRole) {
        return res.status(401).json({ message: 'Authentication required: User ID and Role headers missing.' });
    }

    try {
        const users = await readData(USERS_FILE); //
        const user = users.find(u => String(u.id) === String(userId) && u.role === userRole); //

        if (!user) {
            return res.status(403).json({ message: 'Invalid user or role.' });
        }

        // Attach user info to the request
        req.user = { id: user.id, role: user.role, email: user.email }; //
        next();
    } catch (error) {
        console.error('Error in authentication middleware:', error);
        res.status(500).json({ message: 'Internal server error during authentication.' });
    }
};

export const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: 'Access Denied: No role information.' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: `Access Denied: ${req.user.role} does not have permission.` });
        }
        next();
    };
};