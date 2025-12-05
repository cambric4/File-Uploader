import express from 'express';
import session from 'express-session';
import passport from './config/passport';
import path from 'path';
import { fileURLToPath } from 'url';
import ejsMate from 'ejs-mate';   // import ejs-mate
import authRoutes from './routes/auth';
import fileRoutes from './routes/files';
import folderRoutes from './routes/folders';
import 'dotenv/config';

// Recreate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Set up ejs-mate as the engine BEFORE setting view engine
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

app.use(session({
  secret: 'supersecret',
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/', authRoutes);
app.use('/files', fileRoutes);
app.use('/folders', folderRoutes);

// Root route
app.get('/', (req, res) => {
  res.render('index'); // render views/index.ejs, which can extend layout.ejs
});

// Dummy route to silence Chrome DevTools probe
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.status(404).send();
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
