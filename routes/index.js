import { Router } from 'express';

import AppController from '../controllers/AppController';

import UsersController from '../controllers/UsersController';

import AuthController from '../controllers/AuthController';

const routter = Router();

routter.get('/status', AppController.getStatus);

routter.get('/stats', AppController.getStats);

routter.post('/users', UsersController.postNew);

routter.get('/connect', AuthController.getConnect);

routter.get('/disconnect', AuthController.getDisconnect);

routter.get('/users/me', UsersController.getMe);

routter.post('/files', FilesController.postUpload);

module.exports = routter;
