"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

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

import { Navbar } from "@/components/layout/Navbar";

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
          .select("firstName, lastName, dob, ssn, address1, address2, city, state, zip")
          .eq("id", user.id)
          .single();

        if (error) throw error;

    if (data) {
      setFirstName(data.firstName ?? "");
      setLastName(data.lastName ?? "");
      setDob(data.dob ?? "");
      setSSN(data.ssn ?? "");
      setAddress1(data.address1 ?? "");
      setAddress2(data.address2 ?? "");
      setCity(data.city ?? "");
      setState(data.state ?? "");
      setZip(data.zip ?? "");
    } else {
      setFeedback("Profile not found.");
    }
  } catch (error) {
    console.error("Error loading profile:", error);
    setFeedback("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!firstName) newErrors.firstName = "First name is required";
    if (!lastName) newErrors.lastName = "Last name is required";
    if (!dob) newErrors.dob = "Date of birth is required";
    if (!ssn || !/^\d{3}-?\d{2}-?\d{4}$/.test(ssn))
      newErrors.ssn = "Valid SSN is required (e.g., 123-45-6789)";
    if (!address1) newErrors.address1 = "Address is required";
    if (!city) newErrors.city = "City is required";
    if (!state) newErrors.state = "State is required";
    if (!zip || !/^\d{5}$/.test(zip))
      newErrors.zip = "Valid ZIP code is required (e.g., 12345)";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !validateForm()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          firstName,
          lastName,
          dob,
          ssn,
          address1,
          address2,
          city,
          state,
          zip,
        });

      if (error) throw error;
      setFeedback("Profile updated successfully.");
    } catch (error) {
      console.error("Error updating profile:", error);
      setFeedback("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>View and update your profile information.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-6">
              {[
                { id: "firstName", label: "First Name", value: firstName, onChange: setFirstName },
                { id: "lastName", label: "Last Name", value: lastName, onChange: setLastName },
                { id: "dob", label: "Date of Birth", value: dob, onChange: setDob, type: "date" },
                { id: "ssn", label: "SSN", value: ssn, onChange: setSSN },
                { id: "address1", label: "Address Line 1", value: address1, onChange: setAddress1 },
                { id: "address2", label: "Address Line 2", value: address2, onChange: setAddress2 },
                { id: "city", label: "City", value: city, onChange: setCity },
                { id: "state", label: "State", value: state, onChange: setState },
                { id: "zip", label: "ZIP", value: zip, onChange: setZip },
              ].map(({ id, label, value, onChange, type }) => (
                <div key={id} className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={id} className="text-right">{label}</Label>
                  <Input
                    id={id}
                    type={type || "text"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="col-span-3"
                    aria-invalid={!!errors[id]}
                    aria-describedby={`${id}-error`}
                  />
                  {errors[id] && (
                    <p id={`${id}-error`} className="text-red-500 text-sm col-start-2 col-span-3">
                      {errors[id]}
                    </p>
                  )}
                </div>
              ))}
              <div className="grid grid-cols-4">
                <div />
                <Button type="submit" disabled={loading}>
                  {loading ? "Updating..." : "Update Profile"}
                </Button>
              </div>
              {feedback && (
                <p className="text-sm text-center text-green-600">{feedback}</p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}