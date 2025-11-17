import express from 'express';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import expressSession from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { PrismaClient } from '@prisma/client';
import passport from 'passport';
import configurePassport from './config/passport.js';
import flash from 'connect-flash';
import authRoutes from './routes/auth.routes.js';
import folderRoutes from './routes/folder.routes.js';

dotenv.config();

const app = express();

// Directory config (Fix ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(
  expressSession({
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    store: new PrismaSessionStore(new PrismaClient(), {
      checkPeriod: 2 * 60 * 1000,
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  })
);

// Config Passport.js
app.use(passport.initialize());
app.use(passport.session());
configurePassport(passport);

// Flash Error messages
app.use(flash());

// Middleware to set flash messages in res.locals
app.use((req, res, next) => {
  res.locals.error_msg = req.flash('error_msg')[0];
  res.locals.success_msg = req.flash('success_msg')[0];
  res.locals.error = req.flash('error')[0];
  next();
});

// Routes
app.use('/', authRoutes);
app.use('/', folderRoutes);

// Views
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
