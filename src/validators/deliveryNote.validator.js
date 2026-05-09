import { z } from 'zod';

export const createDeliveryNoteSchema = z.object({
  body: z.object({
    project: z.string({ required_error: "Project ID is required" })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid Project ID format"),
    client: z.string({ required_error: "Client ID is required" })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid Client ID format"),
    format: z.enum(['material', 'hours'], { 
      required_error: "Format must be either 'material' or 'hours'" 
    }),
    description: z.string({ required_error: "Description is required" }).min(5),
    workDate: z.string().transform((str) => new Date(str)),
    
    material: z.string().optional(),
    quantity: z.number().optional(),
    unit: z.string().optional(),
    
    hours: z.number().optional(),
    workers: z.array(z.object({
      name: z.string(),
      hours: z.number()
    })).optional(),
  }).refine((data) => {

    if (data.format === 'material') {
      return data.material && data.quantity;
    }

    if (data.format === 'hours') {
      return data.hours !== undefined || (data.workers && data.workers.length > 0);
    }
    return true;
  }, {
    message: "Missing specific fields for the selected format (material or hours)",
    path: ["format"]
  })
});