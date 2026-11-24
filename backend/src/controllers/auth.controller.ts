import { CookieOptions, NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db";
import { env } from "../config/env";
import { AUTH_COOKIE_NAME } from "../middleware/auth.middleware";
import { AppError } from "../middleware/error.middleware";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function getCookieOptions(): CookieOptions {
  const isSecure = env.COOKIE_SECURE ?? env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? "none" : "lax",
    maxAge: SEVEN_DAYS_MS,
    path: "/",
  };
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      next(new AppError("Invalid email or password.", 401));
      return;
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      next(new AppError("Invalid email or password.", 401));
      return;
    }

    const token = jwt.sign(
      { sub: admin.id, email: admin.email },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] },
    );

    res.cookie(AUTH_COOKIE_NAME, token, getCookieOptions());

    res.status(200).json({
      success: true,
      message: "Signed in successfully.",
      data: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (error) {
    next(error);
  }
}

export function logout(_req: Request, res: Response): void {
  const isSecure = env.COOKIE_SECURE ?? env.NODE_ENV === "production";
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? "none" : "lax",
    path: "/",
  });

  res.status(200).json({
    success: true,
    message: "Signed out successfully.",
  });
}

export function getMe(req: Request, res: Response): void {
  res.status(200).json({
    success: true,
    data: req.admin,
  });
}
