import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactFormSchema, type ContactFormInputs } from '@/lib/validation/contactFormSchema';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ContactForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormInputs>({
    resolver: zodResolver(contactFormSchema),
  });

  const onSubmit = async (data: ContactFormInputs) => {
    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Contact form submitted:', data);
      toast.success('Message sent successfully! We\'ll get back to you soon.');
      reset();
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast.error('Failed to send message. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-card p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6 text-foreground">Contact Us</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-foreground mb-1">
            First Name *
          </label>
          <input
            type="text"
            id="first_name"
            {...register('first_name')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {errors.first_name && <p className="mt-1 text-sm text-destructive">{errors.first_name.message}</p>}
        </div>

        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-foreground mb-1">
            Last Name *
          </label>
          <input
            type="text"
            id="last_name"
            {...register('last_name')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {errors.last_name && <p className="mt-1 text-sm text-destructive">{errors.last_name.message}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
            Email *
          </label>
          <input
            type="email"
            id="email"
            {...register('email')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="phone_number" className="block text-sm font-medium text-foreground mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone_number"
            {...register('phone_number')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="(555) 123-4567"
          />
          {errors.phone_number && <p className="mt-1 text-sm text-destructive">{errors.phone_number.message}</p>}
        </div>

        <div>
          <label htmlFor="address1" className="block text-sm font-medium text-foreground mb-1">
            Address *
          </label>
          <input
            type="text"
            id="address1"
            {...register('address1')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="123 Main Street"
          />
          {errors.address1 && <p className="mt-1 text-sm text-destructive">{errors.address1.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-foreground mb-1">
              City *
            </label>
            <input
              type="text"
              id="city"
              {...register('city')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.city && <p className="mt-1 text-sm text-destructive">{errors.city.message}</p>}
          </div>

          <div>
            <label htmlFor="state" className="block text-sm font-medium text-foreground mb-1">
              State *
            </label>
            <input
              type="text"
              id="state"
              {...register('state')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="CA"
              maxLength={2}
            />
            {errors.state && <p className="mt-1 text-sm text-destructive">{errors.state.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="zip_code" className="block text-sm font-medium text-foreground mb-1">
            ZIP Code *
          </label>
          <input
            type="text"
            id="zip_code"
            {...register('zip_code')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="12345"
            maxLength={5}
          />
          {errors.zip_code && <p className="mt-1 text-sm text-destructive">{errors.zip_code.message}</p>}
        </div>

        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </Button>
      </form>
    </div>
  );
};

export default ContactForm;