import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db";
import { env } from "../config/env";
import { AppError } from "./error.middleware";

export const AUTH_COOKIE_NAME = "admin_token";

export interface AdminJwtPayload {
  sub: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: string;
        name: string;
        email: string;
      };
    }
  }
}

async function resolveAdminFromCookie(req: Request) {
  const token = req.cookies?.[AUTH_COOKIE_NAME] as string | undefined;
  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AdminJwtPayload;
    const admin = await prisma.admin.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true },
    });
    return admin;
  } catch {
    return null;
  }
}

export async function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const admin = await resolveAdminFromCookie(req);
    if (!admin) {
      next(
        new AppError(
          "Authentication required. Please sign in as administrator.",
          401,
        ),
      );
      return;
    }

    req.admin = admin;
    next();
  } catch (error) {
    next(error);
  }
}

export async function attachAdminIfPresent(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const admin = await resolveAdminFromCookie(req);
    if (admin) {
      req.admin = admin;
    }
    next();
  } catch (error) {
    next(error);
  }
}
export function optionalAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const token = req.cookies?.[AUTH_COOKIE_NAME] as string | undefined;
    if (!token) {
      next();
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
      email: string;
      name: string;
    };

    req.admin = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
    };
  } catch {
    // Invalid or expired token is ignored on public routes
  }

  next();
}
