import { Router } from 'express';

import AppController from '../controllers/AppController';


const routter = Router();

routter.get('/status', AppController.getStatus);

routter.get('/stats', AppController.getStats);

module.exports = routter;
