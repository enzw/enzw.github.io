import axios from "axios"
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000/api", withCredentials: true })
export function errorMessage(error: unknown) { if (axios.isAxiosError<{ message?: string }>(error)) return error.response?.data?.message ?? "Tidak dapat terhubung ke server."; return "Terjadi kesalahan. Silakan coba lagi." }
