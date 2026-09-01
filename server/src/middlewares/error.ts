import type { NextFunction, Request, Response } from "express"
import { ZodError } from "zod"
import { HttpError } from "../utils/http-error.js"

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new HttpError(404, "Endpoint tidak ditemukan."))
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    res.status(400).json({ message: "Data yang dikirim belum valid.", errors: error.flatten().fieldErrors })
    return
  }
  if (error instanceof HttpError) {
    res.status(error.status).json({ message: error.message })
    return
  }
  console.error(error)
  res.status(500).json({ message: "Terjadi kesalahan pada server. Silakan coba lagi." })
}
