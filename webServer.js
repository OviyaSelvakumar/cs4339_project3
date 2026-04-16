/* eslint-disable no-console */
/* eslint-disable import/extensions */
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import User from './schema/user.js';
import Photo from './schema/photo.js';

const app = express();

const port = process.env.PORT || 3001;
const mongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1/project2';

app.use(cors());

mongoose.connect(mongoUrl);

mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
});

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/* GET /user/:list */
app.get('/user/list', async (req, res) => {
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
app.get('/user/:id', async (req, res) => {
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
app.get('/photosOfUser/:id', async (req, res) => {
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
