/* eslint-disable no-console */
/* eslint-disable import/extensions */
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import session from 'express-session';
import bcrypt from 'bcrypt';
import User from './schema/user.js';
import Photo from './schema/photo.js';

dotenv.config();

const app = express();

const port = process.env.PORT || 3001;
const mongoUrl = process.env.MONGODB_URI;

app.set('trust proxy', 1);

app.use(express.json());

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  name: 'connect.sid',
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: 'none',
    maxAge: 86400000,
  },
}));
app.use('/images', express.static('images'));

mongoose.connect(mongoUrl);

mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
});

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).send('Not logged in! Unauthorized content.');
  }

  next();
  return next();
}

/* POST /admin/login */
app.post('/admin/login', async (req, res) => {
  try {
    const { login_name, password } = req.body;

    const user = await User.findOne({ login_name });
    if (!user) return res.status(400).send('Invalid login name!');

    const ok = await bcrypt.compare(password, user.password_digest);
    if (!ok) return res.status(400).send('Invalid password!');

    req.session.userId = user._id.toString();

    return res.json({
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
    });
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

/* POST /user */
app.post('/user', async (req, res) => {
  try {
    const {
      login_name, password, first_name, last_name, location, description, occupation,
    } = req.body;

    if (!login_name || !password || !first_name || !last_name) {
      return res.status(400).send('Login name, password, first name, and last name are required!');
    }

    const existing = await User.findOne({ login_name });
    if (existing) {
      return res.status(400).send('Login name already exists!');
    }

    const saltRounds = 10;
    const password_digest = await bcrypt.hash(password, saltRounds);

    const user = await User.create({
      login_name,
      password_digest,
      first_name,
      last_name,
      location: location || '',
      description: description || '',
      occupation: occupation || '',
    });

    return res.status(200).json({
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      location: user.location,
      description: user.description,
      occupation: user.occupation,
      login_name: user.login_name,
    });
  } catch (err) {
    console.error('Error registering: ', err);
    return res.status(500).send(err.message);
  }
});

/* GET /user/list */
app.get('/user/list', requireAuth, async (req, res) => {
  try {
    const users = await User.find({}, '_id first_name last_name').lean();

    const result = users.map((u) => ({
      _id: u._id,
      first_name: u.first_name,
      last_name: u.last_name,
    }));

    return res.json(result);
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

/* GET /user/:id */
app.get('/user/:id', requireAuth, async (req, res) => {
  try {
    const { id: userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).send('Invalid user id');
    }

    const user = await User.findById(userId).lean();

    if (!user) {
      return res.status(404).send('User not found');
    }

    return res.json({
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      location: user.location,
      description: user.description,
      occupation: user.occupation,
    });
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

/* GET /photosOfUser/:id */
app.get('/photosOfUser/:id', requireAuth, async (req, res) => {
  try {
    const photos = await Photo.find({ user_id: req.params.id }).lean();
    return res.json(photos);
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

app.post('/photos', requireAuth, async (req, res) => {
  try {
    const { url } = req.body;

    const photo = await Photo.create({
      user_id: req.session.userId,
      file_name: url,
      date_time: new Date(),
      comments: [],
    });

    return res.json(photo);
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
