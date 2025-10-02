import { Router } from 'express';
import { postRecommend } from '../controllers/recommendationController';

const router = Router();
router.post('/', postRecommend);

export default router;
