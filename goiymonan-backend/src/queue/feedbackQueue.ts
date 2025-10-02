import Queue from 'bull';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const redis = new IORedis(REDIS_URL);
const feedbackQueue = new Queue('feedback-queue', REDIS_URL);

export default feedbackQueue;
