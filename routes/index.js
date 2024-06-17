import { Router } from 'express';

import AppController from '../controllers/AppController';

import UsersController from '../controllers/UsersController';

const routter = Router();

routter.get('/status', AppController.getStatus);

routter.get('/stats', AppController.getStats);

routter.post('/users', UsersController.postNew);

routter.get('/connect', AuthController.getConnect);

routter.get('/disconnect', AuthController.getDisconnect);

routter.get('/users/me', UsersController.getMe);

module.exports = routter;
