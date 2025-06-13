"use client";
import React, { useState, ChangeEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";
import { analyzeDisputeText, generateDisputeLetter, saveTradelines } from "@/services/aiService";
import type { Account, UserData } from "@/schemas/ai";
import { useAuth } from "@/hooks/use-auth";

export default function DisputeWizardPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selected, setSelected] = useState<Account[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [letter, setLetter] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return toast({ title: "No file", description: "Select a PDF." });
    if (file.type !== "application/pdf")
      return toast({ title: "Invalid", description: "Only PDFs allowed." });

    setUploading(true);
    setUploadProgress(0);
    setAccounts([]);
    setSelected([]);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== "string") {
        setUploading(false);
        return toast({ title: "Error", description: "Could not read file." });
      }
      setUploadProgress(50);
      try {
        // Call the new service:
        const analysis = await analyzeDisputeText(dataUrl);
        setAccounts(analysis.accounts);
        toast({
          title: "Extraction Complete",
          description: `Found ${analysis.accounts.length} accounts.`,
        });
      } catch (err: any) {
        toast({ title: "Extraction Failed", description: err.message });
      } finally {
        setUploadProgress(100);
        setUploading(false);
      }
    };
    reader.onerror = () => {
      setUploading(false);
      toast({ title: "Read Error", description: "Failed to load file." });
    };
  };

  const toggleSelect = (acct: Account) => {
    setSelected((prev) =>
      prev.some((a) => a.accountNumber === acct.accountNumber)
        ? prev.filter((a) => a.accountNumber !== acct.accountNumber)
        : [...prev, acct]
    );
  };

  const generateLetterHandler = async () => {
    if (!user) return toast({ title: "Not signed in", description: "" });
    if (!name || !address || selected.length === 0)
      return toast({ title: "Missing Info", description: "Enter name, address & pick accounts." });

    const userData: UserData = { name, address };
    try {
      // Save tradelines in the database
      await saveTradelines(selected, user.id);
      // Generate the dispute letter
      const { letter: content } = await generateDisputeLetter(selected, userData);
      setLetter(content);
    } catch (err: any) {
      toast({ title: "Error", description: err.message });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <Card className="max-w-3xl mx-auto space-y-6">
        <CardHeader>
          <CardTitle>Dispute Wizard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="pdf-upload">Upload Credit Report</Label>
            <Input
              id="pdf-upload"
              type="file"
              accept="application/pdf"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            {uploading && <Progress value={uploadProgress} className="mt-2" />}
          </div>

          {accounts.length > 0 && (
            <div>
              <Label>Select Accounts to Dispute</Label>
              <div className="space-y-3 mt-2">
                {accounts.map((a) => {
                  const isSelected = selected.some((s) => s.accountNumber === a.accountNumber);
                  return (
                    <div
                      key={a.accountNumber}
                      className={`p-4 border rounded-lg cursor-pointer ${
                        isSelected ? "border-destructive bg-destructive/10" : ""
                      }`}
                      onClick={() => toggleSelect(a)}
                    >
                      <strong>{a.creditorName}</strong>
                      <br />
                      Account #: {a.accountNumber}
                      <br />
                      Status: {a.accountStatus}
                      <br />
                      Balance:{" "}
                      {a.accountBalance !== undefined ? `$${a.accountBalance.toFixed(2)}` : "N/A"}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Your Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </div>

          <Button
            onClick={generateLetterHandler}
            disabled={!name || !address || selected.length === 0}
          >
            Generate Letter
          </Button>

          {letter && (
            <div className="space-y-2">
              <Label>Generated Letter</Label>
              <Textarea readOnly rows={12} value={letter} className="font-mono" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
