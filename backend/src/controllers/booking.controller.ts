import { BookingStatus } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/db";
import { AppError } from "../middleware/error.middleware";

function getTodayUtcDateOnly(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function parseDateOnlyUtc(dateStr: string): Date | null {
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return parsed;
}

export async function createBooking(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const {
      customerName,
      phoneNumber,
      serviceId,
      bookingDate,
      preferredTime,
      location,
      message,
    } = req.body as {
      customerName: string;
      phoneNumber: string;
      serviceId: string;
      bookingDate: string;
      preferredTime?: string;
      location?: string;
      message?: string;
    };

    const requestedDate = parseDateOnlyUtc(bookingDate);
    if (!requestedDate) {
      next(new AppError("Please provide a valid calendar date.", 400));
      return;
    }

    const todayUtc = getTodayUtcDateOnly();
    if (requestedDate < todayUtc) {
      next(
        new AppError(
          "Booking date cannot be in the past. Please choose today or a future date.",
          400,
        ),
      );
      return;
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service || !service.isActive) {
      next(
        new AppError(
          "The selected photography service is no longer available. Please choose an active service.",
          400,
        ),
      );
      return;
    }

    const normalizedPhone = phoneNumber.replace(/\s+/g, " ").trim();

    const duplicate = await prisma.booking.findFirst({
      where: {
        phoneNumber: normalizedPhone,
        serviceId,
        bookingDate: requestedDate,
        status: {
          in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
        },
      },
    });

    if (duplicate) {
      next(
        new AppError(
          "You already have an active booking request for this service on the selected date. Our studio will contact you shortly.",
          409,
        ),
      );
      return;
    }

    const booking = await prisma.booking.create({
      data: {
        customerName,
        phoneNumber: normalizedPhone,
        serviceId,
        bookingDate: requestedDate,
        preferredTime: preferredTime ?? null,
        location: location ?? null,
        message: message ?? null,
        status: BookingStatus.PENDING,
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message:
        "Your booking request has been received and is currently pending review. Please note that submitting a request does not automatically guarantee confirmation—we will contact you by phone to confirm availability.",
      data: {
        ...booking,
        service: {
          ...booking.service,
          price: Number(booking.service.price),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function listBookings(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const rawStatus =
      typeof req.query.status === "string"
        ? req.query.status.toUpperCase().trim()
        : undefined;

    let statusFilter: BookingStatus | undefined;
    if (rawStatus && rawStatus !== "ALL") {
      if (!Object.values(BookingStatus).includes(rawStatus as BookingStatus)) {
        next(new AppError("Invalid booking status filter.", 400));
        return;
      }
      statusFilter = rawStatus as BookingStatus;
    }

    const [bookings, groupedCounts] = await Promise.all([
      prisma.booking.findMany({
        where: statusFilter ? { status: statusFilter } : undefined,
        include: {
          service: {
            select: {
              id: true,
              name: true,
              price: true,
              duration: true,
            },
          },
        },
        orderBy: [{ createdAt: "desc" }],
      }),
      prisma.booking.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
    ]);

    const countsByStatus: Record<BookingStatus, number> = {
      PENDING: 0,
      CONFIRMED: 0,
      REJECTED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };

    for (const row of groupedCounts) {
      countsByStatus[row.status] = row._count.status;
    }

    const total = Object.values(countsByStatus).reduce(
      (sum, count) => sum + count,
      0,
    );

    res.status(200).json({
      success: true,
      stats: {
        total,
        pending: countsByStatus.PENDING,
        confirmed: countsByStatus.CONFIRMED,
        completed: countsByStatus.COMPLETED,
        rejected: countsByStatus.REJECTED,
        cancelled: countsByStatus.CANCELLED,
      },
      data: bookings.map((booking) => ({
        ...booking,
        service: {
          ...booking.service,
          price: Number(booking.service.price),
        },
      })),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateBookingStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = String(req.params.id);
    const { status } = req.body as { status: BookingStatus };

    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) {
      next(new AppError("Booking not found.", 404));
      return;
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: `Booking marked as ${status.toLowerCase()}.`,
      data: {
        ...updated,
        service: {
          ...updated.service,
          price: Number(updated.service.price),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteBooking(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = String(req.params.id);
    const existing = await prisma.booking.findUnique({ where: { id } });

    if (!existing) {
      next(new AppError("Booking not found.", 404));
      return;
    }

    await prisma.booking.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: "Booking deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
}
export async function createBookingByAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const {
      customerName,
      phoneNumber,
      serviceId,
      bookingDate,
      preferredTime,
      location,
      message,
      status,
    } = req.body as {
      customerName: string;
      phoneNumber: string;
      serviceId: string;
      bookingDate: string;
      preferredTime?: string;
      location?: string;
      message?: string;
      status: BookingStatus;
    };

    const requestedDate = parseDateOnlyUtc(bookingDate);
    if (!requestedDate) {
      next(new AppError("Please provide a valid calendar date.", 400));
      return;
    }

    const todayUtc = getTodayUtcDateOnly();
    if (
      requestedDate < todayUtc &&
      (status === BookingStatus.PENDING || status === BookingStatus.CONFIRMED)
    ) {
      next(
        new AppError(
          "Pending or confirmed bookings cannot be scheduled in the past. Use Completed status to log a past session.",
          400,
        ),
      );
      return;
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      next(new AppError("Selected photography service was not found.", 400));
      return;
    }

    const normalizedPhone = phoneNumber.replace(/\s+/g, " ").trim();

    if (
      status === BookingStatus.PENDING ||
      status === BookingStatus.CONFIRMED
    ) {
      const duplicate = await prisma.booking.findFirst({
        where: {
          phoneNumber: normalizedPhone,
          serviceId,
          bookingDate: requestedDate,
          status: {
            in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
          },
        },
      });

      if (duplicate) {
        next(
          new AppError(
            "An active booking already exists for this customer phone number, service, and date.",
            409,
          ),
        );
        return;
      }
    }

    const booking = await prisma.booking.create({
      data: {
        customerName,
        phoneNumber: normalizedPhone,
        serviceId,
        bookingDate: requestedDate,
        preferredTime: preferredTime ?? null,
        location: location ?? null,
        message: message ?? null,
        status,
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: `Booking for ${booking.customerName} recorded successfully.`,
      data: {
        ...booking,
        service: {
          ...booking.service,
          price: Number(booking.service.price),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}
