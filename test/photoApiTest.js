/* global describe, it */
/**
 * Mocha test of Project 3 web API for photo upload and like endpoints.
 * Run using this command from the test/ directory:
 *   node_modules/.bin/mocha photoApiTest.js
 */

import assert from 'assert';
import axios from 'axios';

const port = 3001;
const host = 'localhost';

/** Plaintext for seeded users; matches bcrypt digest in loadDatabase.js */
const SEEDED_LOGIN_PASSWORD = 'password';

function makeFullUrl(url) {
  return `http://${host}:${port}${url}`;
}

describe('Photo App: Photo Upload and Like API Tests', () => {
  let sessionCookie;
  let userId;
  let uploadedPhotoId;

  describe('login as took', () => {
    it('can login', (done) => {
      axios
        .post(makeFullUrl('/admin/login'), {
          login_name: 'took',
          password: SEEDED_LOGIN_PASSWORD,
        })
        .then((response) => {
          assert.strictEqual(response.status, 200, 'HTTP response status code 200');
          sessionCookie = response.headers['set-cookie'][0];
          assert.ok(sessionCookie, 'Session cookie found');
          userId = response.data._id;
          assert.ok(userId, "Login response contains user's _id");
          done();
        })
        .catch((err) => {
          assert.fail(`Unexpected error: ${err.message}`);
        });
    });
  });

  describe('POST /photos', () => {
    it('returns 401 if not authenticated', (done) => {
      axios
        .post(makeFullUrl('/photos'), { url: 'https://example.com/photo.jpg' })
        .then(() => {
          assert.fail('Expected 401 error not received');
        })
        .catch((error) => {
          assert.strictEqual(
            error.response.status,
            401,
            'HTTP response status code 401',
          );
          done();
        });
    });

    it('returns 400 if url is missing', (done) => {
      axios
        .post(makeFullUrl('/photos'), {}, {
          headers: { Cookie: sessionCookie },
        })
        .then(() => {
          assert.fail('Expected 400 error not received');
        })
        .catch((error) => {
          assert.strictEqual(
            error.response.status,
            400,
            'HTTP response status code 400',
          );
          done();
        });
    });

    it('returns 400 if url is empty string', (done) => {
      axios
        .post(makeFullUrl('/photos'), { url: '   ' }, {
          headers: { Cookie: sessionCookie },
        })
        .then(() => {
          assert.fail('Expected 400 error not received');
        })
        .catch((error) => {
          assert.strictEqual(
            error.response.status,
            400,
            'HTTP response status code 400',
          );
          done();
        });
    });

    it('saves a photo URL and returns the new photo object', (done) => {
      const testUrl = 'https://example.com/test-photo.jpg';
      axios
        .post(makeFullUrl('/photos'), { url: testUrl }, {
          headers: { Cookie: sessionCookie },
        })
        .then((response) => {
          assert.strictEqual(response.status, 200, 'HTTP response status code 200');
          const photo = response.data;
          assert.ok(photo._id, 'Response contains _id');
          assert.strictEqual(photo.file_name, testUrl, 'file_name matches uploaded URL');
          assert.strictEqual(
            photo.user_id.toString(),
            userId.toString(),
            'user_id matches logged-in user',
          );
          assert.ok(photo.date_time, 'Response contains date_time');
          assert.ok(Array.isArray(photo.comments), 'comments is an array');
          assert.strictEqual(photo.comments.length, 0, 'new photo has no comments');
          uploadedPhotoId = photo._id;
          done();
        })
        .catch((err) => {
          assert.fail(`Unexpected error: ${err.message}`);
        });
    });

    it('photo appears in photosOfUser after upload', (done) => {
      axios
        .get(makeFullUrl(`/photosOfUser/${userId}`), {
          headers: { Cookie: sessionCookie },
        })
        .then((response) => {
          assert.strictEqual(response.status, 200, 'HTTP response status code 200');
          const photos = response.data;
          const found = photos.find((p) => p._id === uploadedPhotoId);
          assert.ok(found, 'Uploaded photo appears in photosOfUser');
          done();
        })
        .catch((err) => {
          assert.fail(`Unexpected error: ${err.message}`);
        });
    });
  });

  describe('POST /photos/:photoId/like', () => {
    it('returns 401 if not authenticated', (done) => {
      axios
        .post(makeFullUrl(`/photos/${uploadedPhotoId}/like`))
        .then(() => {
          assert.fail('Expected 401 error not received');
        })
        .catch((error) => {
          assert.strictEqual(
            error.response.status,
            401,
            'HTTP response status code 401',
          );
          done();
        });
    });

    it('returns 400 for an invalid photo id', (done) => {
      axios
        .post(makeFullUrl('/photos/notanid/like'), {}, {
          headers: { Cookie: sessionCookie },
        })
        .then(() => {
          assert.fail('Expected 400 error not received');
        })
        .catch((error) => {
          assert.strictEqual(
            error.response.status,
            400,
            'HTTP response status code 400',
          );
          done();
        });
    });

    it('adds a like to the photo', (done) => {
      axios
        .post(makeFullUrl(`/photos/${uploadedPhotoId}/like`), {}, {
          headers: { Cookie: sessionCookie },
        })
        .then((response) => {
          assert.strictEqual(response.status, 200, 'HTTP response status code 200');
          const photo = response.data;
          assert.ok(Array.isArray(photo.likes), 'likes is an array');
          assert.strictEqual(photo.likes.length, 1, 'photo now has 1 like');
          const likedByUser = photo.likes.some(
            (id) => id.toString() === userId.toString(),
          );
          assert.ok(likedByUser, "user's id is in the likes array");
          done();
        })
        .catch((err) => {
          assert.fail(`Unexpected error: ${err.message}`);
        });
    });

    it('removes the like on a second request from the same user (toggle)', (done) => {
      axios
        .post(makeFullUrl(`/photos/${uploadedPhotoId}/like`), {}, {
          headers: { Cookie: sessionCookie },
        })
        .then((response) => {
          assert.strictEqual(response.status, 200, 'HTTP response status code 200');
          const photo = response.data;
          assert.ok(Array.isArray(photo.likes), 'likes is an array');
          assert.strictEqual(photo.likes.length, 0, 'like was removed (toggled off)');
          done();
        })
        .catch((err) => {
          assert.fail(`Unexpected error: ${err.message}`);
        });
    });
  });

  describe('logout', () => {
    it('can logout', (done) => {
      axios
        .post(makeFullUrl('/admin/logout'), {}, {
          headers: { Cookie: sessionCookie },
        })
        .then((response) => {
          assert.strictEqual(response.status, 200, 'HTTP response status code 200');
          done();
        })
        .catch((err) => {
          assert.fail(`Unexpected error: ${err.message}`);
        });
    });
  });
});
