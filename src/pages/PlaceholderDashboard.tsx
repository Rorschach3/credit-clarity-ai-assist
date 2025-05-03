
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  FileText, 
  Eye, 
  Mail, 
  CreditCard, 
  BarChart4, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Settings 
} from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/App";

export default function PlaceholderDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isUploading, setIsUploading] = useState(false);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  const { user } = useAuth();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    
    // Simulate file upload and processing
    setTimeout(() => {
      setIsUploading(false);
      toast.success("Credit report uploaded successfully!");
      toast("AI analysis in progress...", {
        duration: 3000,
      });
      
      // Simulate AI analysis completion
      setTimeout(() => {
        toast.success("AI analysis complete! 8 negative items found.");
      }, 3000);
    }, 2000);
  };

  const handleManageSubscription = async () => {
    if (!user) {
      toast.error("Please log in to manage your subscription");
      return;
    }

    try {
      setIsManagingSubscription(true);
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw new Error(error.message);
      if (!data?.url) throw new Error("No portal URL returned");
      
      // Redirect to Stripe Customer Portal
      window.location.href = data.url;
    } catch (error) {
      console.error('Error creating customer portal session:', error);
      toast.error("Could not open subscription management. Please try again.");
    } finally {
      setIsManagingSubscription(false);
    }
  };

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
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Experian</CardTitle>
                <CardDescription>Last updated: 14 days ago</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end space-x-2">
                  <span className="text-3xl font-bold text-brand-600">{creditScores.experian}</span>
                  <span className="text-sm text-green-600 pb-1">+12 pts</span>
                </div>
                <Progress value={65} className="h-2 mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">TransUnion</CardTitle>
                <CardDescription>Last updated: 14 days ago</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end space-x-2">
                  <span className="text-3xl font-bold text-brand-600">{creditScores.transunion}</span>
                  <span className="text-sm text-green-600 pb-1">+8 pts</span>
                </div>
                <Progress value={66} className="h-2 mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Equifax</CardTitle>
                <CardDescription>Last updated: 14 days ago</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end space-x-2">
                  <span className="text-3xl font-bold text-brand-600">{creditScores.equifax}</span>
                  <span className="text-sm text-green-600 pb-1">+15 pts</span>
                </div>
                <Progress value={67} className="h-2 mt-2" />
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="bg-green-100 p-2 rounded-full">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Dispute letter sent to Experian</p>
                      <p className="text-sm text-gray-500">3 days ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="bg-yellow-100 p-2 rounded-full">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium">TransUnion requested additional information</p>
                      <p className="text-sm text-gray-500">5 days ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Equifax report uploaded</p>
                      <p className="text-sm text-gray-500">1 week ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Dispute Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Items</span>
                    <span className="font-medium">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Disputed</span>
                    <span className="font-medium">8</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Removed</span>
                    <span className="font-medium text-green-600">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">In Progress</span>
                    <span className="font-medium text-yellow-600">5</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="upload">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Upload Credit Reports</CardTitle>
                <CardDescription>
                  Upload your credit reports from all three major bureaus for AI analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Drag and drop your files here</h3>
                  <p className="text-gray-500 mb-4">
                    Supported file types: PDF, JPG, PNG
                  </p>
                  <div>
                    <label htmlFor="file-upload">
                      <Button 
                        disabled={isUploading}
                        className="cursor-pointer"
                      >
                        {isUploading ? "Uploading..." : "Browse Files"}
                      </Button>
                      <input 
                        id="file-upload" 
                        type="file" 
                        className="hidden" 
                        accept=".pdf,.jpg,.jpeg,.png" 
                        onChange={handleFileUpload}
                        multiple
                      />
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Upload Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-1">Get Official Reports</h3>
                    <p className="text-sm text-gray-600">
                      Download official reports from annualcreditreport.com or directly from each bureau.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-1">Complete Reports</h3>
                    <p className="text-sm text-gray-600">
                      Make sure to upload the full report, including all pages.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-1">High Quality Images</h3>
                    <p className="text-sm text-gray-600">
                      If uploading scans or photos, ensure they are clear and readable.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={() => setActiveTab("overview")} className="w-full">
                  Back to Overview
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="disputes">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Dispute Letters</CardTitle>
                <CardDescription>
                  View and manage dispute letters generated by our AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Bureau</th>
                        <th className="text-left py-3 px-4">Company</th>
                        <th className="text-left py-3 px-4">Type</th>
                        <th className="text-left py-3 px-4">Amount</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {disputeItems.map((item, i) => (
                        <tr key={i} className="border-b">
                          <td className="py-3 px-4">{item.bureau}</td>
                          <td className="py-3 px-4">{item.company}</td>
                          <td className="py-3 px-4">{item.type}</td>
                          <td className="py-3 px-4">{item.amount}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              item.status === "Removed" ? "bg-green-100 text-green-800" :
                              item.status === "Disputed" ? "bg-blue-100 text-blue-800" :
                              item.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Mail className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Mail Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-1">Ready to Send</h3>
                    <p className="text-sm flex justify-between">
                      <span>Experian</span>
                      <Button variant="outline" size="sm">Send Now</Button>
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-1">In Transit</h3>
                    <p className="text-sm flex items-center justify-between">
                      <span>TransUnion</span>
                      <span className="text-yellow-600 flex items-center">
                        <Clock className="h-3 w-3 mr-1" /> 2 days
                      </span>
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-1">Delivered</h3>
                    <p className="text-sm flex items-center justify-between">
                      <span>Equifax</span>
                      <span className="text-green-600 flex items-center">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Apr 12
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={() => setActiveTab("overview")} className="w-full">
                  Back to Overview
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="tracking">
          <Card>
            <CardHeader>
              <CardTitle>Credit Score Progress</CardTitle>
              <CardDescription>
                Track your credit score improvements over time
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80 flex items-center justify-center">
              <div className="text-center">
                <BarChart4 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Credit History Charts</h3>
                <p className="text-gray-500 mb-4">
                  Your credit score history will appear here once you've uploaded your reports
                </p>
                <Button onClick={() => setActiveTab("upload")}>
                  Upload Reports
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>
                Manage your subscription and payment methods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 p-4 border rounded-lg mb-6">
                <div className="bg-gray-100 p-2 rounded">
                  <CreditCard className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium">Credit Card ending in 4242</p>
                  <p className="text-sm text-gray-500">Expires 12/25</p>
                </div>
                <Button variant="outline" size="sm" className="ml-auto">
                  Update
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Plan</span>
                  <span className="font-medium">Premium Monthly</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price</span>
                  <span className="font-medium">$39.99/month</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Next Billing Date</span>
                  <span className="font-medium">May 15, 2025</span>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t flex flex-col gap-3">
                <Button 
                  variant="default" 
                  className="w-full"
                  onClick={handleManageSubscription}
                  disabled={isManagingSubscription}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  {isManagingSubscription ? "Loading..." : "Manage Subscription"}
                </Button>
                <Button variant="outline" className="w-full">
                  Cancel Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
