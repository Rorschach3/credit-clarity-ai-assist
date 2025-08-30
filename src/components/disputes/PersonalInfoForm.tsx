import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

// Enhanced form schema with security validation
const personalInfoSchema = z.object({
  firstName: z.string()
    .min(1, "First name is required")
    .max(50, "First name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "First name contains invalid characters"),
    
  lastName: z.string()
    .min(1, "Last name is required")
    .max(50, "Last name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Last name contains invalid characters"),
    
  address: z.string()
    .min(1, "Address is required")
    .max(100, "Address must be less than 100 characters")
    .regex(/^[a-zA-Z0-9\s,.-]+$/, "Address contains invalid characters"),
    
  city: z.string()
    .min(1, "City is required")
    .max(50, "City must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "City contains invalid characters"),
    
  state: z.string()
    .min(2, "State is required")
    .max(2, "State must be 2 characters")
    .regex(/^[A-Z]{2}$/, "State must be uppercase 2-letter code"),
    
  zip: z.string()
    .regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code format (use 12345 or 12345-6789)"),
    
  phone: z.string()
    .regex(/^[\d\s\-\(\)\.]*$/, "Invalid phone number format")
    .optional(),
    
  email: z.string()
    .email("Please enter a valid email address")
    .max(254, "Email address too long"),
    
  ssnLastFour: z.string()
    .regex(/^\d{4}$/, "Last 4 SSN digits must be numbers")
    .refine((val) => {
      // Security: reject common weak patterns
      const weakPatterns = ['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1234', '4321'];
      return !weakPatterns.includes(val);
    }, "Invalid SSN format")
    .optional(),
});

type PersonalInfoFormValues = z.infer<typeof personalInfoSchema>;

interface PersonalInfoFormProps {
  onComplete?: (info?: PersonalInfoFormValues) => void;
}

export function PersonalInfoForm({ onComplete }: PersonalInfoFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      phone: "",
      email: user?.email || "",
      ssnLastFour: "",
    },
  });

  // Fetch existing personal info if available
  useEffect(() => {
    const fetchPersonalInfo = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching personal info:", error);
          return;
        }

        if (data) {
          // Populate form with existing data
          form.reset({
            firstName: data.first_name || "",
            lastName: data.last_name || "",
            address: data.address1 || "",
            city: data.city || "",
            state: data.state || "",
            zip: data.zip_code || "",
            phone: data.phone_number || "",
            email: user?.email || "",
            ssnLastFour: data.last_four_of_ssn || "",
          });
        }
      } catch (error) {
        console.error("Error in fetching personal info:", error);
      }
    };

    fetchPersonalInfo();
  }, [user, form]);

  const onSubmit = async (values: PersonalInfoFormValues) => {
    console.log("onSubmit called with values:", values);
    console.log("Current user:", user);
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save your personal information.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Security: Sanitize inputs before storing
      const sanitizeInput = (input: string): string => {
        return input
          .trim()
          .replace(/[<>\"']/g, '') // Remove potential XSS characters
          .substring(0, 1000); // Prevent overly long inputs
      };

      const personalInfo = {
        id: crypto.randomUUID(),
        first_name: sanitizeInput(values.firstName),
        last_name: sanitizeInput(values.lastName),
        address1: sanitizeInput(values.address),
        city: sanitizeInput(values.city),
        state: values.state.toUpperCase(),
        zip_code: sanitizeInput(values.zip),
        phone_number: values.phone ? sanitizeInput(values.phone) : null,
        email: values.email.toLowerCase().trim(),
        last_four_of_ssn: values.ssnLastFour,
        user_id: user.id,
      };

      const { error } = await supabase
        .from("profiles")
        .upsert(personalInfo, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        });

      console.log("Supabase operation error:", error);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Your personal information has been saved.",
      });

      if (onComplete) {
        onComplete(values);
      }
    } catch (error) {
      console.error("Error saving personal info:", error);
      toast({
        title: "Error",
        description: "There was a problem saving your information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>
          This information will be included in your dispute letter. The credit bureaus require this to verify your identity.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address *</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main Street" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
                    <FormControl>
                      <Input placeholder="New York" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State *</FormLabel>
                    <FormControl>
                      <Input placeholder="NY" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="zip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="10001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 555-5555" {...field} />
                    </FormControl>
                    <FormDescription>Optional, but recommended</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ssnLastFour"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last 4 Digits of SSN</FormLabel>
                    <FormControl>
                      <Input placeholder="1234" maxLength={4} {...field} />
                    </FormControl>
                    <FormDescription>Required by credit bureaus for verification</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Personal Information
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
