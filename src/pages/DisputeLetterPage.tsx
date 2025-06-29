// src/pages/DisputeLetterPage.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/use-auth";
import { ParsedTradeline, fetchUserTradelines } from "@/utils/tradelineParser";
import { UserInfoForm } from "@/components/disputes/UserInfoForm";
import { LetterEditor } from "@/components/disputes/LetterEditor";
import { TradelineList } from "@/components/disputes/TradelineList";

const DisputeLetterPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [tradelines, setTradelines] = useState<ParsedTradeline[]>([]);
  const [selectedTradelines, setSelectedTradelines] = useState<ParsedTradeline[]>([]);
  const [userInfo, setUserInfo] = useState({ name: "", address: "", city: "", state: "", zip: "" });
  const [letter, setLetter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      toast({ title: "Error", description: "User not authenticated." });
      navigate("/login");
      return;
    }

    const loadData = async () => {
      setLoading(true);
      console.log("=== DEBUG: Starting loadData ===");
      console.log("User ID:", user?.id);
      console.log("Location state:", location.state);

      try {
        // Check if tradelines were passed from previous page
        const passedData = location.state as { 
          selectedTradelines?: ParsedTradeline[];
          allTradelines?: ParsedTradeline[];
        } | null;

        let userTradelines: ParsedTradeline[] = [];
        let initialSelectedTradelines: ParsedTradeline[] = [];

        if (passedData?.allTradelines && passedData.allTradelines.length > 0) {
          // Use tradelines passed from previous page (preferred)
          console.log("=== Using tradelines from navigation state ===");
          userTradelines = passedData.allTradelines;
          initialSelectedTradelines = passedData.selectedTradelines || [];
        } else {
          // Fallback: fetch from database
          console.log("=== Fetching tradelines from database (fallback) ===");
          userTradelines = await fetchUserTradelines(user.id);
          
          // If there were selected tradeline IDs passed, try to match them
          if (passedData?.selectedTradelines) {
            initialSelectedTradelines = passedData.selectedTradelines;
          }
        }

        console.log("=== Final tradelines ===", userTradelines);
        console.log("=== Initial selected tradelines ===", initialSelectedTradelines);

        setTradelines(userTradelines);
        setSelectedTradelines(initialSelectedTradelines);

        // Autofill user info from user profile
        setUserInfo({
          name: user.user_metadata?.full_name || user.email || "",
          address: user.user_metadata?.address || "",
          city: user.user_metadata?.city || "",
          state: user.user_metadata?.state || "",
          zip: user.user_metadata?.zip || "",
        });

        console.log("=== User info set ===", {
          name: user.user_metadata?.full_name || user.email || "",
          address: user.user_metadata?.address || "",
          city: user.user_metadata?.city || "",
          state: user.user_metadata?.state || "",
          zip: user.user_metadata?.zip || "",
        });

      } catch (error) {
        console.error("=== Error in loadData ===", error);
        toast({ 
          title: "Error", 
          description: "Failed to load tradelines or user info.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
        console.log("=== Loading finished ===");
      }
    };

    loadData();
  }, [user, navigate, location.state]);

  const handleProceed = () => {
    console.log("=== Proceed to Step 3 button clicked ===");
    console.log("Selected Tradelines count:", selectedTradelines.length);
    console.log("Selected Tradelines:", selectedTradelines);
    console.log("User Info:", userInfo);
    console.log("Letter content:", letter);

    // Validate required fields
    if (selectedTradelines.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one tradeline to dispute.",
        variant: "destructive"
      });
      return;
    }

    if (!userInfo.name || !userInfo.address || !userInfo.city || !userInfo.state || !userInfo.zip) {
      toast({
        title: "Validation Error", 
        description: "Please fill in all required user information fields.",
        variant: "destructive"
      });
      return;
    }

    // Navigate to dispute packet page with all necessary data
    navigate("/dispute-packet", {
      state: {
        selectedTradelines,
        userInfo,
        letter,
        allTradelines: tradelines
      }
    });
  };

  const handleGoBack = () => {
    navigate(-1); // Go back to previous page
  };

  // Only allow selection of negative tradelines
  const negativeTradelines = tradelines.filter((t) => t.is_negative);

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-background text-foreground py-10 px-4 md:px-10">
          <Card className="max-w-6xl mx-auto">
            <CardContent className="p-8 text-center">
              <p className="text-lg">Loading tradelines and user information...</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-background text-foreground py-10 px-4 md:px-10">
        <Card className="max-w-6xl mx-auto space-y-6">
          <CardHeader>
            <CardTitle className="text-2xl">Step 2: Draft Dispute Letter</CardTitle>
            <p className="text-muted-foreground">
              Select tradelines to dispute, enter your information, and review the generated letter.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Show message if no negative tradelines */}
            {negativeTradelines.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-lg text-muted-foreground">
                  No negative tradelines found to dispute.
                </p>
                <Button onClick={handleGoBack} className="mt-4">
                  Go Back
                </Button>
              </div>
            ) : (
              <>
                <TradelineList
                  tradelines={negativeTradelines}
                  selected={selectedTradelines}
                  setSelected={setSelectedTradelines}
                  onAddManual={() => toast({ 
                    title: "Info", 
                    description: "Manual tradeline addition is not available on this page. Please use the upload page." 
                  })}
                />

                <UserInfoForm userInfo={userInfo} onChange={setUserInfo} />

                <LetterEditor
                  userInfo={userInfo}
                  selectedTradelines={selectedTradelines}
                  letter={letter}
                  setLetter={setLetter}
                  setShowDocsSection={() => {}}
                />

                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleGoBack}>
                    Back
                  </Button>
                  <Button 
                    onClick={handleProceed} 
                    disabled={selectedTradelines.length === 0}
                    className="min-w-[200px]"
                  >
                    Proceed to Step 3 ({selectedTradelines.length} selected)
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default DisputeLetterPage;