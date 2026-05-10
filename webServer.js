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

mongoose.connect(mongoUrl);

mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
});

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// Check that a valid session exists before processing the request
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

    const isValidPassword = await bcrypt.compare(password, user.password_digest);
    if (!isValidPassword) {
      return res.status(400).send('Invalid password!');
    }

    req.session.userId = user._id.toString();

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
    console.error('Error logging in: ', err);
    return res.status(500).send(err.message);
  }
});

/* POST /admin/logout */
app.post('/admin/logout', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(400).send('Not logged in!');
    }

    req.session.destroy((err) => {
      if (err) {
        return res.status(500).send('Log out error!');
      }
      res.clearCookie('connect.sid');
      return res.status(200).send('Logged out!');
    });
    return undefined;
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

/* GET /admin/me */
app.get('/admin/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).send('User not found!');
    }

    return res.json({
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
    const { id: userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).send('Invalid user id');
    }

    const photos = await Photo.find({ user_id: userId }).lean();
    const users = await User.find({}, '_id first_name last_name').lean();

    const userMap = {};
    users.forEach((u) => {
      userMap[u._id.toString()] = {
        _id: u._id,
        first_name: u.first_name,
        last_name: u.last_name,
      };
    });

    const result = photos.map((photo) => ({
      _id: photo._id,
      user_id: photo.user_id,
      file_name: photo.file_name,
      date_time: photo.date_time,
      likes: photo.likes || [],
      comments: (photo.comments || []).map((comment) => ({
        _id: comment._id,
        comment: comment.comment,
        date_time: comment.date_time,
        user: userMap[comment.user_id.toString()] || null,
      })),
    }));

    return res.json(result);
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

/* POST /commentsOfPhoto/:photoId */
app.post('/commentsOfPhoto/:photoId', requireAuth, async (req, res) => {
  try {
    const { photoId } = req.params;
    const { comment } = req.body;

    if (!comment || comment.trim() === '') {
      return res.status(400).send('Comment text is required!');
    }

    if (!isValidObjectId(photoId)) {
      return res.status(400).send('Invalid photo id');
    }

    const photo = await Photo.findById(photoId);
    if (!photo) {
      return res.status(404).send('Photo not found');
    }

    photo.comments.push({
      comment: comment.trim(),
      date_time: new Date(),
      user_id: req.session.userId,
    });

    await photo.save();

    return res.status(200).send('Comment added!');
  } catch (err) {
    console.error('Error adding comment: ', err);
    return res.status(500).send(err.message);
  }
});

/* POST /photos/:photoId/like */
app.post('/photos/:photoId/like', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;
    const { photoId } = req.params;

    if (!isValidObjectId(photoId)) {
      return res.status(400).send('Invalid Photo ID!');
    }

    const photo = await Photo.findById(photoId);
    if (!photo) {
      return res.status(404).send('Photo does not exist!');
    }

    const userLikedIndex = photo.likes.findIndex(
      (id) => id.toString() === userId,
    );

    if (userLikedIndex === -1) {
      photo.likes.push(new mongoose.Types.ObjectId(userId));
    } else {
      photo.likes.splice(userLikedIndex, 1);
    }

    await photo.save();

    return res.status(200).json(photo);
  } catch (err) {
    console.error('Error liking photo: ', err);
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
      file_name: url.trim(),
      date_time: new Date(),
      comments: [],
    });

    return res.status(200).json(photo);
  } catch (err) {
    console.error('Error uploading photo: ', err);
    return res.status(500).send(err.message);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
