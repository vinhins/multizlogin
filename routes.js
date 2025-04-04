import express from 'express';
const router = express.Router();

import routesUI from './routes-ui.js';
import routesAPI from './routes-api.js';

router.use('/', routesUI);
router.use('/api', routesAPI);

export default router;
