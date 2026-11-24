import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import multer from "multer";
import { ZodError } from "zod";
import { env } from "../config/env";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function notFoundHandler(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    res.status(400).json({
      success: false,
      message: errors[0]?.message || "Validation failed",
      errors,
    });
    return;
  }

  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Image exceeds the maximum allowed size of 8 MB."
        : err.code === "LIMIT_FILE_COUNT"
          ? "Too many images uploaded in a single request (maximum 15)."
          : err.message;

    res.status(400).json({
      success: false,
      message,
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({
        success: false,
        message: "A record with these details already exists.",
      });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({
        success: false,
        message: "Requested record was not found.",
      });
      return;
    }
    if (err.code === "P2003") {
      res.status(409).json({
        success: false,
        message:
          "Cannot complete operation because related records still depend on this item.",
      });
      return;
    }
  }

  console.error("Unhandled server error:", err);

  res.status(500).json({
    success: false,
    message:
      env.NODE_ENV === "development" && err instanceof Error
        ? err.message
        : "An unexpected server error occurred.",
  });
}
