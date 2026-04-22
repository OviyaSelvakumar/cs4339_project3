/**
 * Loads the Project 4 demo data into MongoDB using Mongoose.
 * Run: node loadDatabase.js
 *
 * Uses MONGODB_URI when provided, else falls back to local project4 DB.
 * Collections affected: User, Photo, SchemaInfo. Existing data is cleared.
 */

// We use the Mongoose to define the schema stored in MongoDB.
// eslint-disable-next-line import/no-extraneous-dependencies
import mongoose from "mongoose";
// eslint-disable-next-line import/no-extraneous-dependencies
import bluebird from "bluebird";
import models from "./modelData/photoApp.js";

// Load the Mongoose schema for Use and Photo
import User from "./schema/user.js";
import Photo from "./schema/photo.js";
import SchemaInfo from "./schema/schemaInfo.js";

const cloudinaryUrls = {
  "kenobi1.jpg": "https://res.cloudinary.com/megamukil/image/upload/v1776568710/photoapp-seed/kenobi1.jpg",
  "kenobi2.jpg": "https://res.cloudinary.com/megamukil/image/upload/v1776568711/photoapp-seed/kenobi2.jpg",
  "kenobi3.jpg": "https://res.cloudinary.com/megamukil/image/upload/v1776568711/photoapp-seed/kenobi3.jpg",
  "kenobi4.jpg": "https://res.cloudinary.com/megamukil/image/upload/v1776568712/photoapp-seed/kenobi4.jpg",
  "ludgate1.jpg": "https://res.cloudinary.com/megamukil/image/upload/v1776568712/photoapp-seed/ludgate1.jpg",
  "malcolm1.jpg": "https://res.cloudinary.com/megamukil/image/upload/v1776568713/photoapp-seed/malcolm1.jpg",
  "malcolm2.jpg": "https://res.cloudinary.com/megamukil/image/upload/v1776568713/photoapp-seed/malcolm2.jpg",
  "ouster.jpg": "https://res.cloudinary.com/megamukil/image/upload/v1776568714/photoapp-seed/ouster.jpg",
  "ripley1.jpg": "https://res.cloudinary.com/megamukil/image/upload/v1776568714/photoapp-seed/ripley1.jpg",
  "ripley2.jpg": "https://res.cloudinary.com/megamukil/image/upload/v1776568715/photoapp-seed/ripley2.jpg",
  "took1.jpg": "https://res.cloudinary.com/megamukil/image/upload/v1776568715/photoapp-seed/took1.jpg",
  "took2.jpg": "https://res.cloudinary.com/megamukil/image/upload/v1776568716/photoapp-seed/took2.jpg",
};


mongoose.Promise = bluebird;
mongoose.set("strictQuery", false);
const mongoUri =
  process.env.MONGODB_URI || process.env.MONGO_URL || "mongodb+srv://susanzhang901_db_user:cs4339password@cluster0.eehcgfp.mongodb.net/project4?appName=Cluster0";
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});


// We start by removing anything that existing in the collections.
const removePromises = [
  User.deleteMany({}),
  Photo.deleteMany({}),
  SchemaInfo.deleteMany({}),
];

Promise.all(removePromises)
  .then(function () {
    // Load the users into the User. Mongo assigns ids to objects so we record
    // the assigned '_id' back into the model.userListModels so we have it
    // later in the script.

    const userModels = models.userListModel();
    const mapFakeId2RealId = {};
    const userPromises = userModels.map(function (user) {
      return User.create({
        login_name: user.login_name,
        password: user.password, 
        first_name: user.first_name,
        last_name: user.last_name,
        location: user.location,
        description: user.description,
        occupation: user.occupation,
      })
        .then(function (userObj) {
          // Set the unique ID of the object. We use the MongoDB generated _id
          // for now but we keep it distinct from the MongoDB ID so we can go to
          // something prettier in the future since these show up in URLs, etc.
          userObj.save();
          mapFakeId2RealId[user._id] = userObj._id;
          user.objectID = userObj._id;
          console.log(
            "Adding user:",
            user.first_name + " " + user.last_name,
            " with ID ",
            user.objectID
          );
        })
        .catch(function (err) {
          console.error("Error create user", err);
        });
    });

    const allPromises = Promise.all(userPromises).then(function () {
      // Once we've loaded all the users into the User collection we add all the
      // photos. Note that the user_id of the photo is the MongoDB assigned id
      // in the User object.
      const photoModels = [];
      const userIDs = Object.keys(mapFakeId2RealId);
      userIDs.forEach(function (id) {
        photoModels.push(...models.photoOfUserModel(id));
      });

      const photoPromises = photoModels.map(function (photo) {
        const seededPhotoUrl = cloudinaryUrls[photo.file_name];
        if (!seededPhotoUrl) {
          throw new Error(
            `Missing Cloudinary URL mapping for seeded photo '${photo.file_name}'`
          );
        }
        return Photo.create({
          file_name: photo.file_name,
          photo_url: seededPhotoUrl,
          date_time: photo.date_time,
          user_id: mapFakeId2RealId[photo.user_id],
        })
          .then(function (photoObj) {
            photo.objectID = photoObj._id;
            if (photo.comments) {
              photo.comments.forEach(function (comment) {
                photoObj.comments = photoObj.comments.concat([
                  {
                    comment: comment.comment,
                    date_time: comment.date_time,
                    user_id: comment.user.objectID,
                  },
                ]);
                console.log(
                  "Adding comment of length %d by user %s to photo %s",
                  comment.comment.length,
                  comment.user.objectID,
                  photo.file_name
                );
              });
            }
            photoObj.save();
            console.log(
              "Adding photo:",
              photo.file_name,
              " of user ID ",
              photoObj.user_id
            );
          })
          .catch(function (err) {
            console.error("Error create user", err);
          });
      });
      return Promise.all(photoPromises).then(function () {
        // Create a single SchemaInfo document (no version field required)
        return SchemaInfo.create(models.schemaInfo2())
          .then(function () {
            console.log("SchemaInfo object created");
          })
          .catch(function (err) {
            console.error("Error create schemaInfo", err);
          });
      });
    });

    allPromises.then(function () {
      mongoose.disconnect();
    });
  })
  .catch(function (err) {
    console.error("Error create schemaInfo", err);
  });
