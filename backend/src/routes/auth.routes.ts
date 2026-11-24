import { Router } from "express";
import { getMe, login, logout } from "../controllers/auth.controller";
import { requireAdmin } from "../middleware/auth.middleware";
import { loginRateLimiter } from "../middleware/rateLimit.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { loginSchema } from "../utils/validationSchemas";

const router = Router();

router.post("/login", loginRateLimiter, validateBody(loginSchema), login);
router.post("/logout", requireAdmin, logout);
router.get("/me", requireAdmin, getMe);

export default router;
