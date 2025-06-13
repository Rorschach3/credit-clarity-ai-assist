"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "../../supabase/client";
import { Database } from "../../supabase/types/supabase";
import { z } from "zod";

type SupabaseProfile = Database['public']['Tables']['profiles']['Row'];

export default function ProfilePage() {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [ssn, setSSN] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!user?.id) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("first_name, last_name, dob, ssn, address1, address2, city, state, zip")
          .eq("id", user.id)
          .returns<SupabaseProfile[]>();

        if (error) throw error;

        if (data && data.length > 0) {
          const profile = data[0];
          setFirstName(profile.first_name ?? "");
          setLastName(profile.last_name ?? "");
          setDob(profile.dob ?? "");
          setSSN(profile.ssn ?? "");
          setAddress1(profile.address1 ?? "");
          setAddress2(profile.address2 ?? "");
          setCity(profile.city ?? "");
          setState(profile.state ?? "");
          setZip(profile.zip ?? "");
        } else {
          setFeedback("Profile not found. Please create a profile.");
        }
      } catch (error: unknown) {
        console.error("Error loading profile:", error);
        setFeedback("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) newErrors.firstName = "First name is required";
    if (!lastName.trim()) newErrors.lastName = "Last name is required";
    if (!dob.trim()) newErrors.dob = "Date of birth is required";
    if (!ssn.trim() || !/^\d{3}-?\d{2}-?\d{4}$/.test(ssn)) {
      newErrors.ssn = "Valid SSN format is required (e.g., XXX-XX-XXXX)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <div className="min-h-screen py-10 px-4 md:px-10">
      <Card className="max-w-3xl mx-auto space-y-6">
        <CardHeader>
          <CardTitle className="text-2xl">Profile</CardTitle>
          <CardDescription>View and edit your personal profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {feedback && <p className="text-red-600">{feedback}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName}</p>}
            </div>

            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="dob">Date of Birth</Label>
            <Input id="dob" value={dob} onChange={(e) => setDob(e.target.value)} type="date" />
            {errors.dob && <p className="text-red-500 text-sm">{errors.dob}</p>}
          </div>

          <div>
            <Label htmlFor="ssn">SSN</Label>
            <Input id="ssn" value={ssn} onChange={(e) => setSSN(e.target.value)} />
            {errors.ssn && <p className="text-red-500 text-sm">{errors.ssn}</p>}
          </div>

          <div>
            <Label htmlFor="address1">Address Line 1</Label>
            <Input id="address1" value={address1} onChange={(e) => setAddress1(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="address2">Address Line 2</Label>
            <Input id="address2" value={address2} onChange={(e) => setAddress2(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input id="state" value={state} onChange={(e) => setState(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="zip">ZIP Code</Label>
              <Input id="zip" value={zip} onChange={(e) => setZip(e.target.value)} />
            </div>
          </div>

          <Button onClick={() => validateForm() && alert("Form is valid!")}>
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
