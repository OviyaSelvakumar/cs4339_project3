/* eslint-disable no-console */
/* eslint-disable import/extensions */
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import session from 'express-session';
import bcrypt from 'bcryptjs';

import User from './schema/user.js';
import Photo from './schema/photo.js';

const app = express();

const port = process.env.PORT || 3001;
const mongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1/project3';



app.use(cors());
app.use(express.json());

app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true
  }
}))

mongoose.connect(mongoUrl);

mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
});

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

//Check that a valid session exists before processing the request
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).send('Not logged in! Unauthorized content.');
  }
  next();
}

/* POST /admin/login */
app.post('/admin/login', async (req, res) => {
  try {
    const {login_name, password} = req.body; //Accepts a JSON body with login_name and password
    if (!login_name || !password) {
      return res.status(400).send('Login name and password required!');
    }

    const user = await User.findOne({login_name}); //Finds the user by login_name
    if (!user) { //400 Bad Request if login fails
      return res.status(400, send('Invalid login name!'));
    }

    //When a user logs in, use bcrypt.compare to verify the password against the stored hash
    const isValidPassword = await bcrypt.compare(password, user.password_digest); //Verifies the password using bcrypt.compare
    if (!isValidPassword) { //400 Bad Request if login fails
      return res.status(400).send('Invalid password!');
    }

    //When a user logs in successfully, store their identity in the session
    req.session.userId = user_id.toString();

    //Returns the logged-in user object (excluding password_digest)
    return res.json({
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      location: user.location,
      description: user.description,
      occupation: user.occupation,
      login_name: user.login_name
    });
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

/* POST /admin/logout */
app.post('/admin/logout', async (req, res) => {
  try {
    //Accepts an empty body

    //Check that a valid session exists before processing the request
    if (!req.session.userId) { 
      return res.status(400).send("Not logged in!"); //Returns 400 Bad Request if no user is currently logged in
    }

    //Destroy the session
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).send("Log out error!");
      }

      res.clearCookie("connect.sid");
      return res.status(200).send("Logged out!");
    });
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

/* POST /user */
app.post('/user', async (req, res) => {
  try {
    //Accepts a JSON body with login_name, password, first_name, last_name, location, description, and occupation
    const {login_name, password, first_name, last_name, location, description, occupation} = req.body;

    //Validates that login_name, password, first_name, and last_name are non-empty
    if (!login_name || !password || !first_name || last_name) {
      return res.status(400).send("Login name, password, first name, and last name are required!")
    }

    //Validates that login_name does not already exist
    const existing = await User.findOne({login_name});
    if (existing) {
      return res.status(400).send("Login name already exists!");
    }

    //Hashes the password with bcrypt before saving
    const saltRounds = 10;
    const password_digest = await bcrypt.hash(password, saltRounds);

    const newUser = newUser({login_name, password_digest, first_name, last_name, location: location || "", description: description || "", occupation: occupation || ""});

    await newUser.save();

    return res.status(201).json({
      _id: newUser._id,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      location: newUser.location,
      description: newUser.description,
      occupation: newUser.occupation,
      login_name: newUser.login_name
    });
  } catch (err) {
    return res.status(500).send(err.message);
  }
})

/* GET /user/:list */
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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
