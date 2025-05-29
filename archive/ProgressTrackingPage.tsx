import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ProgressTrackingPage() {
  const [activeTab, setActiveTab] = React.useState("progressTracking");

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="p-4 border-b border-gray-700">
        <nav className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="space-x-6">
            <a href="/" className="hover:underline">Home</a>
            <a href="/about" className="hover:underline">About</a>
            <a href="/pricing" className="hover:underline">Pricing</a>
            <a href="/faq" className="hover:underline">FAQ</a>
            <a href="/contact" className="hover:underline">Contact</a>
            <a href="/dispute-generator" className="hover:underline">Dispute Generator</a>
          </div>
          <div>
            <button className="border border-gray-600 rounded px-3 py-1 hover:bg-gray-700">Account</button>
          </div>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Your Credit Dashboard</h1>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="uploadReports">Upload Reports</TabsTrigger>
            <TabsTrigger value="disputeLetters">Dispute Letters</TabsTrigger>
            <TabsTrigger value="progressTracking">Progress Tracking</TabsTrigger>
            <TabsTrigger value="disputeLetterGenerator">Dispute Letter Generator</TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === "progressTracking" && (
          <Card className="border border-gray-700">
            <CardHeader>
              <CardTitle>Credit Score Progress</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto mb-4 h-12 w-12 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6m4 6v-4m4 4v-2" />
              </svg>
              <p className="text-gray-400 mb-4">Credit History Charts</p>
              <p className="text-gray-500 mb-6">Your credit score history will appear here once you've uploaded your reports</p>
              <Button onClick={() => window.location.href = "/upload-reports"}>Upload Reports</Button>
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="bg-gray-800 text-gray-400 py-8 mt-20">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-6">
          <div>
            <h3 className="font-semibold mb-4">PRODUCT</h3>
            <ul className="space-y-2">
              <li><a href="/pricing" className="hover:underline">Pricing</a></li>
              <li><a href="/features" className="hover:underline">Features</a></li>
              <li><a href="/testimonials" className="hover:underline">Testimonials</a></li>
              <li><a href="/faq" className="hover:underline">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">COMPANY</h3>
            <ul className="space-y-2">
              <li><a href="/about" className="hover:underline">About Us</a></li>
              <li><a href="/contact" className="hover:underline">Contact</a></li>
              <li><a href="/privacy-policy" className="hover:underline">Privacy Policy</a></li>
              <li><a href="/terms-of-service" className="hover:underline">Terms of Service</a></li>
            </ul>
          </div>
          <div className="col-span-2 text-center md:text-left">
            <p>Helping you improve your credit score through AI-powered credit report analysis and dispute letter generation.</p>
            <div className="flex justify-center md:justify-start space-x-4 mt-4">
              <a href="https://twitter.com" aria-label="Twitter" className="hover:text-white">Twitter</a>
              <a href="https://linkedin.com" aria-label="LinkedIn" className="hover:text-white">LinkedIn</a>
              <a href="https://facebook.com" aria-label="Facebook" className="hover:text-white">Facebook</a>
            </div>
            <p className="mt-6 text-sm text-gray-500">&copy; 2025 CreditClarityAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}