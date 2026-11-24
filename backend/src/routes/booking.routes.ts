import { Router } from "express";
import {
  createBooking,
  createBookingByAdmin,
  deleteBooking,
  listBookings,
  updateBookingStatus,
} from "../controllers/booking.controller";
import { requireAdmin } from "../middleware/auth.middleware";
import { bookingRateLimiter } from "../middleware/rateLimit.middleware";
import { validateBody } from "../middleware/validate.middleware";
import {
  adminCreateBookingSchema,
  createBookingSchema,
  updateBookingStatusSchema,
} from "../utils/validationSchemas";

const router = Router();

router.post(
  "/",
  bookingRateLimiter,
  validateBody(createBookingSchema),
  createBooking,
);
router.post(
  "/admin",
  requireAdmin,
  validateBody(adminCreateBookingSchema),
  createBookingByAdmin,
);
router.get("/", requireAdmin, listBookings);
router.patch(
  "/:id/status",
  requireAdmin,
  validateBody(updateBookingStatusSchema),
  updateBookingStatus,
);
router.delete("/:id", requireAdmin, deleteBooking);

export default router;
