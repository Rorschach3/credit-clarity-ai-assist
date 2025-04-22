
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SubscriptionPromptProps {
  onSubscribe: () => void;
}

export function SubscriptionPrompt({ onSubscribe }: SubscriptionPromptProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Subscription Required</CardTitle>
        <CardDescription>
          Upload and analyze your credit reports with our AI-powered system
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Lock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
        <p className="text-gray-600 mb-4">
          Subscribe to access our AI-powered credit report analysis
        </p>
        <Button onClick={onSubscribe}>
          Subscribe Now
        </Button>
      </CardContent>
    </Card>
  );
}
