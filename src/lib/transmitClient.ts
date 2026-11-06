import { Transmit } from "@adonisjs/transmit-client";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export const transmitClient = new Transmit({ baseUrl: API_URL });