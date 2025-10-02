import { Router } from 'express';
import { postFeedback } from '../controllers/feedbackController';

const router = Router();
router.post('/', postFeedback);

export default router;
