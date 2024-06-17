import { v4 as uuidv4 } from 'uuid';
import { ObjectID } from 'mongodb';
import { promises as fs } from 'fs';
import mime from 'mime-types';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import Queue from 'bull';

const fileQueue = new Queue('fileQueue', 'redis://127.0.0.1:6379');

class FilesController {
  static async getUser(request) {
    const token = request.header('X-Token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      return null;
    }

    const usersCollection = dbClient.db.collection('users');
    const userIdObject = new ObjectID(userId);
    const user = await usersCollection.findOne({ _id: userIdObject });

    if (!user) {
      return null;
    }

    return user;
  }

  static async postUpload(request, response) {
    const user = await FilesController.getUser(request);

    if (!user) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    const { name, type, parentId, isPublic, data } = request.body;

    if (!name) {
      return response.status(400).json({ error: 'Missing name' });
    }

    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return response.status(400).json({ error: 'Missing or invalid type' });
    }

    if (type !== 'folder' && !data) {
      return response.status(400).json({ error: 'Missing data' });
    }

    const filesCollection = dbClient.db.collection('files');

    if (parentId) {
      const parentIdObject = new ObjectID(parentId);
      const parentFile = await filesCollection.findOne({ _id: parentIdObject });

      if (!parentFile) {
        return response.status(400).json({ error: 'Parent not found' });
      }

      if (parentFile.type !== 'folder') {
        return response.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    if (type === 'folder') {
      try {
        const result = await filesCollection.insertOne({
          userId: user._id,
          name,
          type,
          parentId: parentId || 0,
          isPublic: isPublic || false,
        });

        return response.status(201).json({
          id: result.insertedId,
          userId: user._id,
          name,
          type,
          parentId: parentId || 0,
          isPublic: isPublic || false,
        });
      } catch (error) {
        console.error('Error creating folder:', error);
        return response.status(500).json({ error: 'Internal server error' });
      }
    } else {
      const filePath = process.env.FOLDER_PATH || '/tmp/files_manager';
      const fileName = `${filePath}/${uuidv4()}`;

      const buffer = Buffer.from(data, 'base64');

      try {
        await fs.mkdir(filePath, { recursive: true });
        await fs.writeFile(fileName, buffer);

        const result = await filesCollection.insertOne({
          userId: user._id,
          name,
          type,
          parentId: parentId || 0,
          isPublic: isPublic || false,
          localPath: fileName,
        });

        response.status(201).json({
          id: result.insertedId,
          userId: user._id,
          name,
          type,
          parentId: parentId || 0,
          isPublic: isPublic || false,
        });

        if (type === 'image') {
          fileQueue.add({
            userId: user._id,
            fileId: result.insertedId,
          });
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        return response.status(500).json({ error: 'Internal server error' });
      }
    }
  }
}

export default FilesController;

