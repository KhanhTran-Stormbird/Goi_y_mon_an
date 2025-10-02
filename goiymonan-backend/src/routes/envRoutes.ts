import { Router } from "express";
import {
  resetEnvironment,
  stepEnvironment,
} from "../controllers/envController";

const router = Router();

router.post("/reset", resetEnvironment);
router.post("/step", stepEnvironment);

export default router;
