
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Overview } from "@/components/dashboard/Overview";
import { UploadReportsTab } from "@/components/dashboard/UploadReportsTab";
import { DisputesTab } from "@/components/dashboard/DisputesTab";
import { CreditScoreProgress } from "@/components/dashboard/CreditScoreProgress";
import { BillingInfo } from "@/components/dashboard/BillingInfo";

export default function PlaceholderDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const creditScores = {
    experian: 645,
    transunion: 658,
    equifax: 672
  };

  const disputeItems = [
    {
      bureau: "Experian",
      company: "Collection Agency A",
      type: "Collection Account",
      amount: "$1,245",
      status: "Pending"
    },
    {
      bureau: "TransUnion",
      company: "Bank XYZ",
      type: "Late Payment",
      amount: "$89",
      status: "Disputed"
    },
    {
      bureau: "Equifax",
      company: "Credit Card Company",
      type: "Charge-off",
      amount: "$3,500",
      status: "Verified"
    },
    {
      bureau: "Experian",
      company: "Collection Agency B",
      type: "Collection Account",
      amount: "$567",
      status: "Removed"
    }
  ];

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Your Credit Dashboard</h1>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="upload">Upload Reports</TabsTrigger>
          <TabsTrigger value="disputes">Dispute Letters</TabsTrigger>
          <TabsTrigger value="tracking">Progress Tracking</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <Overview creditScores={creditScores} />
        </TabsContent>
        
        <TabsContent value="upload">
          <UploadReportsTab onBackToOverview={() => setActiveTab("overview")} />
        </TabsContent>
        
        <TabsContent value="disputes">
          <DisputesTab 
            disputeItems={disputeItems} 
            onBackToOverview={() => setActiveTab("overview")} 
          />
        </TabsContent>
        
        <TabsContent value="tracking">
          <CreditScoreProgress onUploadReports={() => setActiveTab("upload")} />
        </TabsContent>
        
        <TabsContent value="billing">
          <BillingInfo />
        </TabsContent>
      </Tabs>
    </div>
  );
}
