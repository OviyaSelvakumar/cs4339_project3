/**
 * Loads Project 3 demo data into MongoDB using Mongoose.
 * Run: node loadDatabase.js (MongoDB must be running locally)
 *
 * Database: project3. Collections: User, Photo, SchemaInfo (cleared first).
 *
 * Each user gets login_name = lowercase last_name and password_digest set to
 * the instructor-supplied bcrypt hash (plaintext for login is "password"; see README).
 */

// eslint-disable-next-line import/no-extraneous-dependencies
import mongoose from 'mongoose';
// eslint-disable-next-line import/no-extraneous-dependencies
import bluebird from 'bluebird';
import models from './modelData/photoApp.js';
import User from './schema/user.js';
import Photo from './schema/photo.js';
import SchemaInfo from './schema/schemaInfo.js';

/** Bcrypt digest for seeded accounts; bcrypt.compare("password", ...) is true. */
const SEEDED_PASSWORD_DIGEST = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

mongoose.Promise = bluebird;
mongoose.set('strictQuery', false);
mongoose.connect('mongodb://127.0.0.1/project3', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const removePromises = [
  User.deleteMany({}),
  Photo.deleteMany({}),
  SchemaInfo.deleteMany({}),
];

Promise.all(removePromises)
  .then(() => {
    const userModels = models.userListModel();
    const mapFakeId2RealId = {};
    const userPromises = userModels.map((user) => User.create({
      first_name: user.first_name,
      last_name: user.last_name,
      location: user.location,
      description: user.description,
      occupation: user.occupation,
      login_name: user.last_name.toLowerCase(),
      password_digest: SEEDED_PASSWORD_DIGEST,
    })
      .then((userObj) => {
        userObj.save();
        mapFakeId2RealId[user._id] = userObj._id;
        user.objectID = userObj._id;
        console.log(
          'Adding user:',
          `${user.first_name} ${user.last_name}`,
          ' with ID ',
          user.objectID,
        );
      })
      .catch((err) => {
        console.error('Error create user', err);
      }));

    const allPromises = Promise.all(userPromises).then(() => {
      const photoModels = [];
      const userIDs = Object.keys(mapFakeId2RealId);
      userIDs.forEach((id) => {
        photoModels.push(...models.photoOfUserModel(id));
      });

      const photoPromises = photoModels.map((photo) => Photo.create({
        file_name: photo.file_name,
        date_time: photo.date_time,
        user_id: mapFakeId2RealId[photo.user_id],
      })
        .then((photoObj) => {
          photo.objectID = photoObj._id;
          if (photo.comments) {
            photo.comments.forEach((comment) => {
              photoObj.comments = photoObj.comments.concat([
                {
                  comment: comment.comment,
                  date_time: comment.date_time,
                  user_id: comment.user.objectID,
                },
              ]);
              console.log(
                'Adding comment of length %d by user %s to photo %s',
                comment.comment.length,
                comment.user.objectID,
                photo.file_name,
              );
            });
          }
          photoObj.save();
          console.log(
            'Adding photo:',
            photo.file_name,
            ' of user ID ',
            photoObj.user_id,
          );
        })
        .catch((err) => {
          console.error('Error create photo', err);
        }));
      return Promise.all(photoPromises).then(() => SchemaInfo.create(models.schemaInfo2())
        .then(() => {
          console.log('SchemaInfo object created');
        })
        .catch((err) => {
          console.error('Error create schemaInfo', err);
        }));
    });

    allPromises.then(() => {
      mongoose.disconnect();
    });
  })
  .catch((err) => {
    console.error('Error clearing collections', err);
  });
