import { z } from 'zod';

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" }).min(3).max(100),
    projectCode: z.string({ required_error: "Project code is required" }),
    email: z.string().email("Invalid email address"),
    address: z.object({
      street: z.string().optional(),
      number: z.string().optional(),
      postal: z.string().optional(),
      city: z.string().optional(),
      province: z.string().optional(),
    }).optional(),
    clientId: z.string({ required_error: "A valid Client ID is required" })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format"),
    notes: z.string().max(500).optional(),
    active: z.boolean().default(true),
  }),
});