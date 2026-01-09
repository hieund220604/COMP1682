"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const authRoutes_1 = __importDefault(require("./route/authRoutes"));
const groupRoutes_1 = __importDefault(require("./route/groupRoutes"));
const expenseRoutes_1 = __importDefault(require("./route/expenseRoutes"));
const settlementRoutes_1 = __importDefault(require("./route/settlementRoutes"));
const accountRoutes_1 = __importDefault(require("./route/accountRoutes"));
const vnpayRoutes_1 = __importDefault(require("./route/vnpayRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/groups', groupRoutes_1.default);
app.use('/api/groups', expenseRoutes_1.default);
app.use('/api/groups', settlementRoutes_1.default);
app.use('/api/accounts', accountRoutes_1.default);
app.use('/api/payments', vnpayRoutes_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
// Database connection test
app.get('/db-test', async (req, res) => {
    try {
        const result = await prisma.$queryRaw `SELECT NOW()`;
        res.json({
            status: 'Connected to database',
            timestamp: result
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'Database connection failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});
// Start server
const startServer = async () => {
    try {
        await prisma.$connect();
        console.log('✓ Connected to Supabase');
        app.listen(PORT, () => {
            console.log(`✓ Server running on port ${PORT}`);
            console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`✓ API available at http://localhost:${PORT}/api`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n✓ Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});
startServer();
