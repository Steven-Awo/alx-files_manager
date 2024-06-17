import sha1 from 'sha1';

import Queue from 'bull';

import { ObjectID } from 'mongodb';

import dbClient from '../utils/db';

import redisClient from '../utils/redis';

const userQueue = new Queue('userQueue', 'redis://127.0.0.1:6379');

class UsersController {
  static postNew(request, response) {

    const { email } = request.body;

    const { password } = request.body;

    if (!email) {

      response.status(400).json({ error: 'Missing email' });
      return;

    }

    if (!password) {

      response.status(400).json({ error: 'Missing password' });
      return;

    }

    const userrs = dbClient.db.collection('userrs');

    userrs.findOne({ email }, (err, user) => {

      if (user) {

        response.status(400).json({ error: 'Already exist' });

      } else {

        const hashedPassword = sha1(password);

        userrs.insertOne(
          {
            email,
            password: hashedPassword,
          },
        ).then((result) => {

          response.status(201).json({ id: result.insertedId, email });

          userQueue.add({ userrId: result.insertedId });

        }).catch((error) => console.log(error));

      }
    });
  }

  static async getMe(request, response) {

    const tokenn = request.header('X-Token');

    const keyy = `auth_${tokenn}`;

    const userrId = await redisClient.get(keyy);

    if (userrId) {

      const userrs = dbClient.db.collection('userrs');

      const idObject = new ObjectID(userrId);

      userrs.findOne({ _id: idObject }, (err, user) => {

        if (user) {

          response.status(200).json({ id: userrId, email: user.email });

        } else {

          response.status(401).json({ error: 'Unauthorized' });

        }
      });

    } else {

      console.log('Hupatikani!');

      response.status(401).json({ error: 'Unauthorized' });

    }
  }
}

module.exports = UsersController;
