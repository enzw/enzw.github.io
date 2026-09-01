import type { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import { env } from "../config/env.js"
import { HttpError } from "../utils/http-error.js"

type TokenPayload = { sub: string }

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies.access_token as string | undefined
    if (!token) throw new HttpError(401, "Silakan masuk terlebih dahulu.")
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload
    req.userId = payload.sub
    next()
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError(401, "Sesi tidak valid atau sudah berakhir."))
  }
}

export function signToken(userId: string) {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: "7d" })
}
