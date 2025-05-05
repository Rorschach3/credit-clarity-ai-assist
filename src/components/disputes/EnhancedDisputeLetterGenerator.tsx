
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { NegativeItem } from "@/types/document";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/schema";
import { Loader2, Save, Bot, CheckCircle, RefreshCw, AlertCircle, Info } from "lucide-react";
import { type Bureau, bureauAddresses } from "@/utils/bureau-constants";
import { Progress } from "@/components/ui/progress";
import { aiService, GeneratedLetter } from "@/utils/ai-service";
import { DisputeLetterPreview } from "./DisputeLetterPreview";
import { useAuth } from "@/App";

interface EnhancedDisputeLetterGeneratorProps {
  items: NegativeItem[];
  onComplete: () => void;
}

// Temporary default user ID until authentication is implemented
const TEMP_USER_ID = '00000000-0000-0000-0000-000000000000';

export function EnhancedDisputeLetterGenerator({ items, onComplete }: EnhancedDisputeLetterGeneratorProps) {
  const [activeTab, setActiveTab] = useState<Bureau>('Experian');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [letters, setLetters] = useState<Record<Bureau, string | null>>({
    'Experian': null,
    'TransUnion': null,
    'Equifax': null
  });
  const [letterQuality, setLetterQuality] = useState<Record<Bureau, number>>({
    'Experian': 0,
    'TransUnion': 0,
    'Equifax': 0
  });
  const [letterSuggestions, setLetterSuggestions] = useState<Record<Bureau, string[]>>({
    'Experian': [],
    'TransUnion': [],
    'Equifax': []
  });
  const [generationProgress, setGenerationProgress] = useState(0);
  const [personalInfo, setPersonalInfo] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Get all bureaus represented in the selected items
  const bureaus = Array.from(new Set(
    items.flatMap(item => item.bureaus)
  )).filter(bureau => 
    bureau === 'Experian' || bureau === 'TransUnion' || bureau === 'Equifax'
  ) as Bureau[];

  // Fetch user personal info from the database
  useEffect(() => {
    const fetchPersonalInfo = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("user_personal_info")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error fetching personal info:", error);
          return;
        }

        if (data) {
          // Format user data for the letter generation
          setPersonalInfo({
            fullName: data.full_name,
            address: data.address,
            city: data.city,
            state: data.state,
            zip: data.zip,
            phone: data.phone || undefined,
            email: data.email,
            ssnLastFour: data.ssn_last_four || undefined
          });
        }
      } catch (error) {
        console.error("Error in fetching personal info:", error);
      }
    };

    fetchPersonalInfo();
  }, [user]);

  const generateLetter = async (bureau: Bureau) => {
    setIsGenerating(true);
    setGenerationProgress(10);
    
    try {
      // Items to dispute for this bureau
      const bureauItems = items.filter(item => item.bureaus.includes(bureau));
      
      setGenerationProgress(30);
      
      // Generate the letter content using AI
      const generatedLetter = await aiService.generateDisputeLetter(bureauItems, bureau, personalInfo);
      setGenerationProgress(70);
      
      // Update the letter and quality score
      setLetters(prev => ({
        ...prev,
        [bureau]: generatedLetter.content
      }));

      setLetterQuality(prev => ({
        ...prev,
        [bureau]: generatedLetter.qualityScore
      }));

      setLetterSuggestions(prev => ({
        ...prev,
        [bureau]: generatedLetter.suggestions
      }));
      
      setGenerationProgress(100);
      toast({
        title: "Letter Generated",
        description: `Dispute letter for ${bureau} has been created successfully.`,
      });
    } catch (error) {
      console.error("Error generating letter:", error);
      toast({
        title: "Generation Failed",
        description: "There was an error creating your dispute letter. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const reviewLetter = async (bureau: Bureau) => {
    if (!letters[bureau]) return;
    
    setIsReviewing(true);
    
    try {
      const reviewedLetter = await aiService.reviewDisputeLetter(letters[bureau]!, bureau);
      
      setLetters(prev => ({
        ...prev,
        [bureau]: reviewedLetter.content
      }));
      
      setLetterQuality(prev => ({
        ...prev,
        [bureau]: reviewedLetter.qualityScore
      }));
      
      setLetterSuggestions(prev => ({
        ...prev,
        [bureau]: reviewedLetter.suggestions
      }));
      
      toast({
        title: "Letter Review Complete",
        description: "Your dispute letter has been reviewed and optimized.",
      });
    } catch (error) {
      console.error("Error reviewing letter:", error);
      toast({
        title: "Review Failed",
        description: "There was an error reviewing your dispute letter.",
        variant: "destructive"
      });
    } finally {
      setIsReviewing(false);
    }
  };

  const saveDisputes = async () => {
    setIsSaving(true);
    
    try {
      const promises = bureaus.map(async (bureau) => {
        const letter = letters[bureau];
        if (!letter) return null;
        
        const { data, error } = await supabase
          .from(Tables.disputes)
          .insert({
            credit_bureau: bureau,
            mailing_address: bureauAddresses[bureau],
            letter_content: letter,
            status: 'created',
            user_id: user?.id || TEMP_USER_ID
          })
          .select();
        
        if (error) throw error;
        return data;
      });
      
      await Promise.all(promises);
      
      toast({
        title: "Disputes Saved",
        description: "Your AI-optimized dispute letters have been saved successfully.",
      });
      
      onComplete();
    } catch (error) {
      console.error("Error saving disputes:", error);
      toast({
        title: "Error",
        description: "There was an error saving your dispute letters.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-700 bg-green-100';
    if (score >= 75) return 'text-yellow-700 bg-yellow-100';
    return 'text-red-700 bg-red-100';
  };

  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              AI-Enhanced Dispute Letters
              <Badge variant="outline" className="bg-blue-100 text-blue-800 ml-2">
                <Bot className="h-3 w-3 mr-1" />
                AI Powered
              </Badge>
            </CardTitle>
            <CardDescription>
              Review and customize your AI-generated dispute letters for each credit bureau
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {bureaus.length === 0 ? (
          <div className="text-center p-6">
            <p className="text-muted-foreground">
              No credit bureaus to dispute with. Please select items that have bureau reporting.
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <Button 
                onClick={saveDisputes}
                disabled={isSaving || bureaus.some(bureau => !letters[bureau])}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save All Dispute Letters
                  </>
                )}
              </Button>
            </div>
            
            {!personalInfo && (
              <Alert variant="default" className="mb-4 bg-amber-50 border-amber-200 text-amber-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  We're using default personal information in your letter. For a more personalized letter, 
                  please go back and complete your personal information.
                </AlertDescription>
              </Alert>
            )}
            
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Bureau)} className="w-full">
              <TabsList className="grid" style={{ gridTemplateColumns: `repeat(${bureaus.length}, 1fr)` }}>
                {bureaus.map(bureau => (
                  <TabsTrigger key={bureau} value={bureau} className="flex items-center gap-1">
                    {bureau}
                    {letterQuality[bureau] > 0 && (
                      <Badge className={`ml-2 ${getQualityColor(letterQuality[bureau])}`}>
                        {letterQuality[bureau]}%
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              {bureaus.map(bureau => (
                <TabsContent key={bureau} value={bureau} className="space-y-4">
                  {!letters[bureau] ? (
                    <div className="text-center py-8">
                      {isGenerating ? (
                        <div className="space-y-4">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                          <div>
                            <p className="font-medium">Generating your dispute letter</p>
                            <p className="text-sm text-muted-foreground">
                              Our AI is crafting a personalized letter for {bureau}
                            </p>
                          </div>
                          <Progress value={generationProgress} className="w-64 mx-auto" />
                        </div>
                      ) : (
                        <>
                          <Button onClick={() => generateLetter(bureau)}>
                            <Bot className="mr-2 h-4 w-4" />
                            Generate {bureau} Letter
                          </Button>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Click to create an AI-optimized dispute letter
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {letterQuality[bureau] > 0 && (
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`px-2 py-1 rounded text-xs font-medium flex items-center ${getQualityColor(letterQuality[bureau])}`}>
                            {letterQuality[bureau] >= 90 ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : letterQuality[bureau] >= 75 ? (
                              <AlertCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <AlertCircle className="h-3 w-3 mr-1" />
                            )}
                            Quality Score: {letterQuality[bureau]}%
                          </div>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-xs h-7 px-2"
                            onClick={() => reviewLetter(bureau)}
                            disabled={isReviewing}
                          >
                            {isReviewing ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3 w-3 mr-1" />
                            )}
                            Review & Improve
                          </Button>
                        </div>
                      )}

                      {letterSuggestions[bureau] && letterSuggestions[bureau].length > 0 && (
                        <Alert className="bg-yellow-50 border-yellow-200 mb-3">
                          <div className="flex flex-col gap-1">
                            <p className="font-medium text-yellow-800">AI Suggestions:</p>
                            <ul className="text-sm list-disc pl-5">
                              {letterSuggestions[bureau].map((suggestion, idx) => (
                                <li key={idx} className="text-yellow-800">{suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        </Alert>
                      )}

                      <DisputeLetterPreview 
                        letterContent={letters[bureau]!} 
                        bureau={bureau}
                      />
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
}
