// server.js
// Express backend for Pro Clubs Championship
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

// --- Add CORS configuration for production (optional, secure) ---
// Uncomment and configure allowed origins for production
// app.use(cors({
//   origin: ['https://your-frontend-domain.com'],
//   credentials: true
// }));

// --- SECURITY: Use environment variables for all secrets ---
// Example .env file:
// MONGO_URI=mongodb://localhost:27017/proclubs
// DISCORD_TOKEN=your_discord_bot_token
// JWT_SECRET=your_jwt_secret

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/proclubs';
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- Sample Schemas ---
const ClubSchema = new mongoose.Schema({
  name: String,
  logo: String,
  description: String,
  stats: Object
});
const PlayerSchema = new mongoose.Schema({
  name: String,
  club: String,
  stats: Object
});
const StandingSchema = new mongoose.Schema({
  club: String,
  points: Number,
  played: Number,
  won: Number,
  drawn: Number,
  lost: Number,
  gf: Number,
  ga: Number,
  gd: Number
});
const UserSchema = new mongoose.Schema({
  email: String,
  password: String // In production, hash passwords!
});
const Club = mongoose.model('Club', ClubSchema);
const Player = mongoose.model('Player', PlayerSchema);
const Standing = mongoose.model('Standing', StandingSchema);
const User = mongoose.model('User', UserSchema);

// --- API Endpoints ---
app.get('/api/clubs', async (req, res) => {
  const clubs = await Club.find();
  res.json(clubs);
});

app.get('/api/players', async (req, res) => {
  const players = await Player.find();
  res.json(players);
});

// --- Update Standings API to match frontend expectations ---
app.get('/api/standings', async (req, res) => {
  const standings = await Standing.find().sort({ points: -1 });
  // Map to frontend format
  const mapped = standings.map((row, i) => ({
    club: row.club,
    logo: row.logo || '',
    p: row.played,
    w: row.won,
    d: row.drawn,
    l: row.lost,
    gf: row.gf,
    ga: row.ga,
    gd: row.gd,
    pts: row.points
  }));
  res.json(mapped);
});

// --- Discord Bot Integration Endpoint ---
app.post('/api/discord/report-match', async (req, res) => {
  const { matchId } = req.body;
  // Here you would trigger your Discord bot (e.g., via database, event, or direct call)
  // For demo, just respond OK
  // TODO: Integrate with your Discord bot logic
  res.json({ message: `Match ${matchId} reported to Discord (stub).` });
});

// --- EA FC 25 Proxy Endpoint (for CORS and security) ---
app.get('/api/ea/clubdetails', async (req, res) => {
  const { platform, clubId } = req.query;
  if (!platform || !clubId) return res.status(400).json({ error: 'Missing platform or clubId' });
  try {
    const url = `https://proclubs.ea.com/api/clubdetails?platform=${platform}&clubId=${clubId}`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'EA API error', details: err.message });
  }
});

// --- Advanced: Add authentication middleware (JWT, stub) ---
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// --- Advanced: Add user registration and login endpoints (JWT) ---
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ email, password: hashed });
  await user.save();
  res.status(201).json({ message: 'User registered' });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ email: user.email, id: user._id }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ token });
});

// --- Advanced: Add POST, PUT, DELETE endpoints for clubs, players, standings ---
// Create Club
app.post('/api/clubs', authenticateToken, async (req, res) => {
  const club = new Club(req.body);
  await club.save();
  res.status(201).json(club);
});
// Update Club
app.put('/api/clubs/:id', authenticateToken, async (req, res) => {
  const club = await Club.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(club);
});
// Delete Club
app.delete('/api/clubs/:id', authenticateToken, async (req, res) => {
  await Club.findByIdAndDelete(req.params.id);
  res.status(204).end();
});
// Create Player
app.post('/api/players', authenticateToken, async (req, res) => {
  const player = new Player(req.body);
  await player.save();
  res.status(201).json(player);
});
// Update Player
app.put('/api/players/:id', authenticateToken, async (req, res) => {
  const player = await Player.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(player);
});
// Delete Player
app.delete('/api/players/:id', authenticateToken, async (req, res) => {
  await Player.findByIdAndDelete(req.params.id);
  res.status(204).end();
});
// Create Standing
app.post('/api/standings', authenticateToken, async (req, res) => {
  const standing = new Standing(req.body);
  await standing.save();
  res.status(201).json(standing);
});
// Update Standing
app.put('/api/standings/:id', authenticateToken, async (req, res) => {
  const standing = await Standing.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(standing);
});
// Delete Standing
app.delete('/api/standings/:id', authenticateToken, async (req, res) => {
  await Standing.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

// Add more endpoints as needed (POST, PUT, DELETE)

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
