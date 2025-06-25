
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
        // Fetch tradelines for user from Supabase
        const userTradelines = await fetchUserTradelines(user.id);
        console.log("=== Fetched tradelines from DB ===", userTradelines);
        setTradelines(userTradelines);

        // Get selected tradeline IDs from navigation state
        const { selectedTradelineIds } = (location.state || {}) as { selectedTradelineIds?: string[] };
        console.log("=== Selected IDs from navigation ===", selectedTradelineIds);
        
        if (selectedTradelineIds && selectedTradelineIds.length > 0) {
          // Filter fetched tradelines based on selected IDs
          const preSelected = userTradelines.filter(tl => {
            console.log(`Checking tradeline ${tl.id} against selected IDs`);
            return selectedTradelineIds.includes(tl.id || '');
          });
          console.log("=== Pre-selected tradelines ===", preSelected);
          setSelectedTradelines(preSelected);
        } else {
          console.log("=== No selected IDs found in navigation state ===");
        }

        // Autofill user info from Supabase profile
        setUserInfo({
          name: user.email || "",
          address: "",
          city: "",
          state: "",
          zip: "",
        });
        console.log("User info set:", {
          name: user.email || "",
          address: "",
          city: "",
          state: "",
          zip: "",
        });

      } catch (error) {
        console.error("=== Error in loadData ===", error);
        toast({ title: "Error", description: "Failed to load tradelines or user info." });
      } finally {
        setLoading(false);
        console.log("Loading finished.");
      }
    };

    loadData();
  }, [user, navigate, location.state]);

  const handleProceed = () => {
    console.log("Proceed to Step 3 button clicked.");
    console.log("Selected Tradelines length:", selectedTradelines.length);
    console.log("Selected Tradelines:", selectedTradelines);
    // Navigate to dispute packet page
    navigate("/dispute-packet");
  };

  // Only allow selection of negative tradelines
  const negativeTradelines = tradelines.filter((t) => t.is_negative);

  return (
    <MainLayout>
      <div className="min-h-screen bg-background text-foreground py-10 px-4 md:px-10">
        <Card className="max-w-6xl mx-auto space-y-6">
          <CardHeader>
            <CardTitle className="text-2xl">Step 2: Draft Dispute Letter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <p>Loading...</p>
            ) : (
              <>
                <TradelineList
                  tradelines={negativeTradelines}
                  selected={selectedTradelines}
                  setSelected={setSelectedTradelines}
                  onAddManual={() => toast({ title: "Info", description: "Manual add not available here." })}
                />

                <UserInfoForm userInfo={userInfo} onChange={setUserInfo} />

                <LetterEditor
                  userInfo={userInfo}
                  selectedTradelines={selectedTradelines}
                  letter={letter}
                  setLetter={setLetter}
                  setShowDocsSection={() => {}}
                />

                <div className="flex justify-end space-x-4">
                  <Button onClick={handleProceed} disabled={selectedTradelines.length === 0}>
                    Proceed to Step 3 ({selectedTradelines.length})
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