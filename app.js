const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const { Sequelize, DataTypes } = require('sequelize');
const app = express();
const port = 3000;

// MySQL database setup (adjust these credentials)
const sequelize = new Sequelize({
  dialect: 'mysql',
  host: 'localhost',         // Your MySQL host
  username: 'root',          // Your MySQL username
  password: '',  // Your MySQL password
  database: 'auth_app',      // The database you created
});

// User model
const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// Sync database (creates the table if it doesn’t exist)
sequelize.sync()
  .then(() => console.log('Database synced'))
  .catch(err => console.error('Database sync error:', err));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'your-secret-key', // Change this to a secure string
  resave: false,
  saveUninitialized: false,
}));
app.set('view engine', 'ejs');
app.set('views', './templates');

// Routes
app.get('/', (req, res) => {
  res.render('home', { error: null });
});

app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.get('/register', (req, res) => {
  res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.render('register', { error: 'Username already taken' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashedPassword });
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.render('register', { error: 'Error registering user' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ where: { username } });
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.user = username;
      res.redirect('/dashboard');
    } else {
      res.render('login', { error: 'Invalid credentials' });
    }
  } catch (err) {
    console.error(err);
    res.render('login', { error: 'Error logging in' });
  }
});

app.get('/dashboard', (req, res) => {
  if (req.session.user) {
    res.render('result', { user: req.session.user });
  } else {
    res.redirect('/login');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});