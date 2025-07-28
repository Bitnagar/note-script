import express from 'express';
import cors from 'cors';
import passport from 'passport';
import 'dotenv/config';

// Import routes
import authRoutes from './routes/authRoutes';
import mainRoutes from './routes/mainRoutes';

// Initialize Express app
const app = express();
const port = 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// --- API Routes ---
// Authentication routes for login/register
app.use('/auth', authRoutes);

// Core application routes for documents and chat
app.use('/api', mainRoutes);

// --- Start Server ---
app.listen(port, () => {
  console.log(
    `Backend server running at ${process.env.BACKEND_BASE_URL}:${port} 🚀`
  );
});
