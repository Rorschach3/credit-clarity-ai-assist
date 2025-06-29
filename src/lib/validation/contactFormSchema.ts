import { z } from 'zod';

export const contactFormSchema = z.object({
  name: z.string().min(2, 'Name is required').max(50, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(500, 'Message is too long'),
});

export type ContactFormInputs = z.infer<typeof contactFormSchema>;