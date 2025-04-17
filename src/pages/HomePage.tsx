
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Upload, 
  FileSearch, 
  MailOpen, 
  ArrowRight,
  CheckCircle,
  Award,
  RefreshCw 
} from "lucide-react";

export default function HomePage() {
  const features = [
    {
      icon: <Upload className="h-6 w-6 text-brand-600" />,
      title: "Upload Credit Reports",
      description: "Easily upload your credit reports from all three major bureaus."
    },
    {
      icon: <FileSearch className="h-6 w-6 text-brand-600" />,
      title: "AI Analysis",
      description: "Our AI analyses your reports to identify errors and negative items."
    },
    {
      icon: <FileText className="h-6 w-6 text-brand-600" />,
      title: "Generate Dispute Letters",
      description: "Automatically generate customized dispute letters for each bureau."
    },
    {
      icon: <MailOpen className="h-6 w-6 text-brand-600" />,
      title: "Mail Service",
      description: "We print and mail your dispute letters directly to credit bureaus."
    }
  ];

  const testimonials = [
    {
      quote: "Using CreditClarityAI helped me remove 3 incorrect collections and raised my score by 96 points!",
      author: "Sarah J.",
      title: "Verified Customer"
    },
    {
      quote: "The AI found errors I never would have spotted. Within 45 days my credit score jumped from 610 to 742.",
      author: "Michael T.",
      title: "Verified Customer"
    },
    {
      quote: "So much easier than trying to do this myself. Worth every penny for the stress it saved me.",
      author: "Rebecca L.",
      title: "Verified Customer"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-brand-900 to-brand-700 text-white">
        <div className="container px-4 mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Fix Your Credit Score with AI-Powered Precision
            </h1>
            <p className="text-xl mb-8 text-brand-100">
              Upload your credit reports, and our AI will identify errors and generate professional dispute letters to help improve your credit score.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/20">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="container px-4 mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-gray-600">
              Our simple 4-step process leverages AI to help improve your credit score
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-4 bg-brand-50 w-12 h-12 rounded-full flex items-center justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-gray-50">
        <div className="container px-4 mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose CreditClarityAI</h2>
            <p className="text-lg text-gray-600">
              Our AI-powered platform offers advantages traditional credit repair services can't match
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg border border-gray-200">
              <CheckCircle className="h-10 w-10 text-brand-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Accuracy & Precision</h3>
              <p className="text-gray-600">
                Our AI analyzes every detail of your credit reports to identify errors that humans might miss.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg border border-gray-200">
              <Award className="h-10 w-10 text-brand-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Legal Expertise</h3>
              <p className="text-gray-600">
                AI-generated dispute letters use legally sound language based on consumer protection laws.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg border border-gray-200">
              <RefreshCw className="h-10 w-10 text-brand-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Fast Results</h3>
              <p className="text-gray-600">
                Customers typically see improvements in their credit scores within 30-45 days of disputes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-white">
        <div className="container px-4 mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What Our Customers Say</h2>
            <p className="text-lg text-gray-600">
              Real results from real people who improved their credit scores
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 p-8 rounded-lg">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-sm text-gray-500">{testimonial.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand-900 text-white">
        <div className="container px-4 mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Improve Your Credit Score?</h2>
            <p className="text-xl mb-8">
              Join thousands of satisfied customers who have improved their credit and financial future.
            </p>
            <Link to="/signup">
              <Button size="lg" className="bg-white text-brand-900 hover:bg-gray-100">
                Get Started Today
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
