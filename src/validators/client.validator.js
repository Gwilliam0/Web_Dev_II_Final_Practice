import { z } from 'zod';

export const createClientSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" })
      .min(2, "Name must be at least 2 characters")
      .max(100),
    
    cif: z.string({ required_error: "CIF/NIF is required" })
      .min(9, "CIF must be at least 9 characters"),
    
    email: z.string({ required_error: "Email is required" })
      .email("Invalid email format"),
    
    phone: z.string().optional(),

    address: z.object({
      street: z.string().optional(),
      number: z.string().optional(),
      postal: z.string().optional(),
      city: z.string().optional(),
      province: z.string().optional()
    }).optional()
  })
});