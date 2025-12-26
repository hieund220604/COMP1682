"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddlewareOptional = exports.authMiddleware = void 0;
const authService_1 = require("../service/authService");
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ success: false, message: 'Missing or invalid token' });
            return;
        }
        const token = authHeader.substring(7);
        const decodedToken = authService_1.authService.verifyToken(token);
        if (!decodedToken) {
            res.status(401).json({ success: false, message: 'Invalid token' });
            return;
        }
        req.user = decodedToken;
        next();
    }
    catch (error) {
        res.status(401).json({ success: false, message: 'Authencation failed' });
    }
};
exports.authMiddleware = authMiddleware;
const authMiddlewareOptional = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decodedToken = authService_1.authService.verifyToken(token);
            if (decodedToken) {
                req.user = decodedToken;
            }
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.authMiddlewareOptional = authMiddlewareOptional;
