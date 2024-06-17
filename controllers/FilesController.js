import { v4 as uuidv4 } from 'uuid';

import { ObjectID } from 'mongodb';

import { promises as fs } from 'fs';

import mime from 'mime-types';

import dbClient from '../utils/db';

import Queue from 'bull';

import redisClient from '../utils/redis';

const fileQueue = new Queue('fileQueue', 'redis://127.0.0.1:6379');

class FilesController {
  static async getUser(request) {

    const tokenn = request.header('X-Token');

    const keyy = `auth_${tokenn}`;

    const userId = await redisClient.get(keyy);

    if (userId) {

      const userrs = dbClient.db.collection('users');

      const id_Object = new ObjectID(userId);

      const userr = await userrs.findOne({ _id: id_Object });

      if (!userr) {

        return null;

      }
      return userr;
    }
    return null;
  }

  static async postUpload(request, response) {

    const userr = await FilesController.getUser(request);

    if (!userr) {

      return response.status(401).json({ error: 'Unauthorized' });

    }

    const { name } = request.body;

    const { type } = request.body;

    const { parentId } = request.body;

    const isPublic = request.body.isPublic || false;

    const { data } = request.body;

    if (!name) {

      return response.status(400).json({ error: 'Missing name' });

    }
    if (!type) {

      return response.status(400).json({ error: 'Missing type' });

    }

    if (type !== 'folder' && !data) {

      return response.status(400).json({ error: 'Missing data' });

    }

    const filles = dbClient.db.collection('files');

    if (parentId) {

      const id_Object = new ObjectID(parentId);

      const filee = await filles.findOne({ _id: id_Object, userId: userr._id });

      if (!filee) {

        return response.status(400).json({ error: 'Parent not found' });
    
      }
      if (filee.type !== 'folder') {

        return response.status(400).json({ error: 'Parent is not a folder' });

      }
    }
    if (type === 'folder') {

      filles.insertOne(
        {
          userId: userr._id,
          name,
          type,
          parentId: parentId || 0,
          isPublic,
        },
      ).then((result) => response.status(201).json({
        id: result.insertedId,
        userId: userr._id,
        name,
        type,
        isPublic,
        parentId: parentId || 0,
      })).catch((error) => {

        console.log(error);

      });
    } else {

      const file_Path = process.env.FOLDER_PATH || '/tmp/files_manager';

      const filee_Name = `${file_Path}/${uuidv4()}`;

      const buff = Buffer.from(data, 'base64');

      try {
        try {
          await fs.mkdir(file_Path);
        } catch (error) {
        }
        await fs.writeFile(filee_Name, buff, 'utf-8');
      } catch (error) {

        console.log(error);
      }

      filles.insertOne(
        {
          userId: userr._id,
          name,
          type,
          isPublic,
          parentId: parentId || 0,
          localPath: filee_Name,
        },
      ).then((result) => {

        response.status(201).json(
          {
            id: result.insertedId,
            userId: userr._id,
            name,
            type,
            isPublic,
            parentId: parentId || 0,
          },
        );

        if (type === 'image') {

          fileQueue.add(
            {
              userId: userr._id,
              fileId: result.insertedId,
            },
          );
        }
      }).catch((error) => console.log(error));

    }
    return null;
  }

  static async getShow(request, response) {

    const userr = await FilesController.getUser(request);

    if (!userr) {

      return response.status(401).json({ error: 'Unauthorized' });

    }

    const fileId = request.params.id;

    const filles = dbClient.db.collection('files');

    const id_Object = new ObjectID(fileId);

    const filee = await filles.findOne({ _id: id_Object, userId: userr._id });

    if (!filee) {

      return response.status(404).json({ error: 'Not found' });

    }

    return response.status(200).json(filee);
  }

  static async getIndex(request, response) {

    const userr = await FilesController.getUser(request);

    if (!userr) {

      return response.status(401).json({ error: 'Unauthorized' });

    }

    const {
      parentId,
      page,
    } = request.query;

    const pageNum = page || 0;

    const filles = dbClient.db.collection('files');

    let query;

    if (!parentId) {

      query = { userId: userr._id };
    } else {
      query = { userId: userr._id, parentId: ObjectID(parentId) };
    }
    filles.aggregate(
      [
        { $match: query },
        { $sort: { _id: -1 } },
        {
          $facet: {
            metadata: [{ $count: 'total' }, { $addFields: { page: parseInt(pageNum, 10) } }],
            data: [{ $skip: 20 * parseInt(pageNum, 10) }, { $limit: 20 }],
          },
        },
      ],
    ).toArray((err, result) => {

      if (result) {

        const final = result[0].data.map((filee) => {

          const tmpFile = {

            ...filee,
            id: filee._id,
          };
          delete tmpFile._id;

          delete tmpFile.localPath;

          return tmpFile;

        });
        // console.log(final);
        return response.status(200).json(final);
      }

      console.log('Error occured');

      return response.status(404).json({ error: 'Not found' });

    });
    return null;
  }
}

module.exports = FilesController;
