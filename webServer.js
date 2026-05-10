/* eslint-disable no-console */
/* eslint-disable import/extensions */
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import session from 'express-session';
import bcrypt from 'bcrypt';
import path from 'path';

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

// ✅ FIX: serve images correctly (this fixes /images/kenobi2.jpg 404)
app.use('/images', express.static(path.join(process.cwd(), 'images')));

mongoose.connect(mongoUrl);

mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
});

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// ✅ FIX lint: always return something
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).send('Not logged in! Unauthorized content.');
  }
  next();
  return undefined;
}

/* POST /admin/login */
app.post('/admin/login', async (req, res) => {
  try {
    const { login_name, password } = req.body;

    if (!login_name || !password) {
      return res.status(400).send('Login name and password required!');
    }

    const user = await User.findOne({ login_name });
    if (!user) {
      return res.status(400).send('Invalid login name!');
    }

    const ok = await bcrypt.compare(password, user.password_digest);
    if (!ok) {
      return res.status(400).send('Invalid password!');
    }

    req.session.userId = user._id.toString();

    // IMPORTANT: session must be saved before response in tests
    req.session.save(() => {
      res.status(200).json({
        _id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        location: user.location,
        description: user.description,
        occupation: user.occupation,
        login_name: user.login_name,
      });
    });

    return undefined;
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

/* POST /admin/logout */
app.post('/admin/logout', requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Logout error!');
    }

    res.clearCookie('connect.sid');
    return res.status(200).send('Logged out!');
  });

  return undefined;
});

/* POST /user */
app.post('/user', async (req, res) => {
  try {
    const {
      login_name, password, first_name, last_name, location, description, occupation,
    } = req.body;

    if (!login_name || !password || !first_name || !last_name) {
      return res.status(400).send('Missing required fields');
    }

    const existing = await User.findOne({ login_name });
    if (existing) {
      return res.status(400).send('Login name already exists!');
    }

    const password_digest = await bcrypt.hash(password, 10);

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
    return res.status(500).send(err.message);
  }
});

/* GET /user/list */
app.get('/user/list', requireAuth, async (req, res) => {
  try {
    const users = await User.find({}, '_id first_name last_name').lean();
    return res.json(users);
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

/* GET /user/:id */
app.get('/user/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).send('Invalid user id');
    }

    const user = await User.findById(id).lean();

    if (!user) {
      return res.status(404).send('User not found');
    }

    return res.json(user);
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

/* GET /photosOfUser/:id */
app.get('/photosOfUser/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).send('Invalid user id');
    }

    const photos = await Photo.find({ user_id: id }).lean();
    const users = await User.find({}, '_id first_name last_name').lean();

    const userMap = {};
    users.forEach((u) => {
      userMap[u._id.toString()] = u;
    });

    const result = photos.map((p) => ({
      ...p,
      comments: (p.comments || []).map((c) => ({
        ...c,
        user: userMap[c.user_id?.toString()] || null,
      })),
    }));

    return res.json(result);
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

/* POST /photos */
app.post('/photos', requireAuth, async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || url.trim() === '') {
      return res.status(400).send('URL is missing or empty!');
    }

    const photo = await Photo.create({
      user_id: req.session.userId,
      file_name: url,
      date_time: new Date(),
      comments: [],
      likes: [],
    });

    return res.status(200).json(photo);
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
