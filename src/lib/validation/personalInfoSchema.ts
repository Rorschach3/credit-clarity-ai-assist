import { z } from 'zod';

// Enhanced server-side validation schemas for security
export const personalInfoSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name contains invalid characters'),
    
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name contains invalid characters'),
    
  email: z.string()
    .email('Invalid email address')
    .max(254, 'Email address too long'),
    
  phone: z.string()
    .regex(/^\+?[\d\s\-\(\)\.]+$/, 'Invalid phone number format')
    .min(10, 'Phone number too short')
    .max(20, 'Phone number too long')
    .optional(),
    
  address1: z.string()
    .min(1, 'Address is required')
    .max(100, 'Address must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s,.-]+$/, 'Address contains invalid characters'),
    
  address2: z.string()
    .max(100, 'Address line 2 must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s,.-]*$/, 'Address contains invalid characters')
    .optional(),
    
  city: z.string()
    .min(1, 'City is required')
    .max(50, 'City must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'City contains invalid characters'),
    
  state: z.string()
    .min(2, 'State is required')
    .max(2, 'State must be 2 characters')
    .regex(/^[A-Z]{2}$/, 'State must be uppercase 2-letter code'),
    
  zipCode: z.string()
    .regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format (use 12345 or 12345-6789)'),
    
  lastFourOfSSN: z.string()
    .regex(/^\d{4}$/, 'Must be exactly 4 digits')
    .refine((val) => {
      // Additional security: reject common weak patterns
      const weakPatterns = ['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1234', '4321'];
      return !weakPatterns.includes(val);
    }, 'Invalid SSN format'),
    
  dateOfBirth: z.string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Date must be in MM/DD/YYYY format')
    .refine((val) => {
      const date = new Date(val);
      const now = new Date();
      const minAge = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate());
      const maxAge = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
      
      return date >= minAge && date <= maxAge;
    }, 'Invalid date of birth (must be 18-120 years old)')
});

export type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;

// Sanitization helper
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>\"']/g, '') // Remove potential XSS characters
    .substring(0, 1000); // Prevent overly long inputs
};

// Additional validation for file uploads
export const fileUploadSchema = z.object({
  fileName: z.string()
    .min(1, 'File name is required')
    .max(255, 'File name too long')
    .regex(/^[a-zA-Z0-9._-]+\.(pdf|jpg|jpeg|png)$/i, 'Invalid file name or type'),
    
  fileSize: z.number()
    .min(1, 'File is empty')
    .max(10 * 1024 * 1024, 'File size must be less than 10MB'),
    
  mimeType: z.enum(['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'], {
    errorMap: () => ({ message: 'Only PDF, JPG, and PNG files are allowed' })
  })
});

export type FileUploadData = z.infer<typeof fileUploadSchema>;