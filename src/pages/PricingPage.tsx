
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const plans = [
    {
      name: "Basic",
      description: "For individuals with a few negative items to dispute",
      price: billingCycle === "monthly" ? 19.99 : 199.9,
      features: [
        "Upload 1 credit bureau report",
        "AI credit report analysis",
        "Up to 5 dispute letters",
        "Standard mail delivery",
        "Email support"
      ],
      recommended: false,
      cta: "Get Started"
    },
    {
      name: "Premium",
      description: "Our most popular plan for comprehensive credit repair",
      price: billingCycle === "monthly" ? 39.99 : 399.9,
      features: [
        "Upload all 3 credit bureau reports",
        "Advanced AI credit report analysis",
        "Unlimited dispute letters",
        "Priority mail delivery with tracking",
        "Response validation assistance",
        "Priority email & chat support"
      ],
      recommended: true,
      cta: "Get Started"
    },
    {
      name: "Enterprise",
      description: "For professionals managing multiple credit profiles",
      price: billingCycle === "monthly" ? 99.99 : 999.9,
      features: [
        "Everything in Premium",
        "Manage up to 5 credit profiles",
        "Custom dispute letter templates",
        "Advanced credit score tracking",
        "Certified mail delivery",
        "Dedicated account manager",
        "Phone support"
      ],
      recommended: false,
      cta: "Contact Sales"
    }
  ];

  const handleSubscribe = (planName: string) => {
    toast.info(`Please connect Supabase and Stripe to enable ${planName} plan subscription.`);
  };

  return (
    <div className="py-16 px-4 container">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
        <p className="text-xl text-gray-600 mb-8">
          Choose the plan that fits your credit repair needs
        </p>

        <div className="inline-flex items-center p-1 bg-gray-100 rounded-lg mb-8">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-2 rounded-md ${
              billingCycle === "monthly" 
                ? "bg-white shadow-sm text-brand-600" 
                : "text-gray-600"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-4 py-2 rounded-md ${
              billingCycle === "yearly" 
                ? "bg-white shadow-sm text-brand-600" 
                : "text-gray-600"
            }`}
          >
            Yearly <span className="text-xs text-green-600 font-medium ml-1">Save 17%</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan, index) => (
          <Card 
            key={index} 
            className={`relative ${
              plan.recommended ? "border-brand-600 shadow-lg" : "border-gray-200"
            }`}
          >
            {plan.recommended && (
              <div className="absolute -top-4 left-0 right-0 mx-auto w-max bg-brand-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <p className="text-gray-600 mt-2">{plan.description}</p>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <p className="text-4xl font-bold">${plan.price.toFixed(2)}</p>
                <p className="text-gray-500">per {billingCycle === "monthly" ? "month" : "year"}</p>
              </div>
              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {plan.name === "Enterprise" ? (
                <Link to="/contact" className="w-full">
                  <Button className="w-full" variant={plan.recommended ? "default" : "outline"}>
                    {plan.cta}
                  </Button>
                </Link>
              ) : (
                <Button 
                  className="w-full" 
                  variant={plan.recommended ? "default" : "outline"}
                  onClick={() => handleSubscribe(plan.name)}
                >
                  {plan.cta}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="max-w-3xl mx-auto mt-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mt-8">
          <div>
            <h3 className="font-semibold text-lg mb-2">How does the service work?</h3>
            <p className="text-gray-600">
              Upload your credit reports, and our AI will analyze them to identify errors. We then generate and mail professionally formatted dispute letters to credit bureaus on your behalf.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">How long does credit repair take?</h3>
            <p className="text-gray-600">
              Results vary, but most customers see improvements within 30-45 days after dispute letters are sent. Comprehensive credit repair may take 3-6 months.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">Can I cancel my subscription?</h3>
            <p className="text-gray-600">
              Yes, you can cancel your subscription at any time from your account settings. There are no long-term contracts or cancellation fees.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">Is there a guarantee?</h3>
            <p className="text-gray-600">
              We offer a 30-day money-back guarantee if you're not satisfied with our service. However, we cannot guarantee specific credit score increases as results vary by individual.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
