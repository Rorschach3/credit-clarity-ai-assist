
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type NegativeItem } from "@/components/document/DocumentScanner";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, Send, Download, Eye } from "lucide-react";

interface DisputeLetterGeneratorProps {
  items: NegativeItem[];
  onComplete: () => void;
}

type Bureau = 'Experian' | 'TransUnion' | 'Equifax';

const bureauAddresses: Record<Bureau, string> = {
  'Experian': 'Experian\nP.O. Box 4500\nAllen, TX 75013',
  'TransUnion': 'TransUnion LLC\nConsumer Dispute Center\nP.O. Box 2000\nChester, PA 19016',
  'Equifax': 'Equifax Information Services LLC\nP.O. Box 740256\nAtlanta, GA 30374'
};

export function DisputeLetterGenerator({ items, onComplete }: DisputeLetterGeneratorProps) {
  const [activeTab, setActiveTab] = useState<Bureau>('Experian');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [letters, setLetters] = useState<Record<Bureau, string | null>>({
    'Experian': null,
    'TransUnion': null,
    'Equifax': null
  });
  const { toast } = useToast();

  // Get all bureaus represented in the selected items
  const bureaus = Array.from(new Set(
    items.flatMap(item => item.bureaus)
  )).filter(bureau => 
    bureau === 'Experian' || bureau === 'TransUnion' || bureau === 'Equifax'
  ) as Bureau[];

  const generateLetter = (bureau: Bureau) => {
    setIsGenerating(true);
    
    // Items to dispute for this bureau
    const bureauItems = items.filter(item => item.bureaus.includes(bureau));
    
    // Generate the letter content
    const currentDate = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    const letterContent = `${currentDate}

${bureauAddresses[bureau]}

Re: Request for Investigation of Items on Credit Report

To Whom It May Concern:

I am writing to dispute the following information in my credit report. The items I dispute are marked by an "X" below.

${bureauItems.map((item, index) => `
X Item ${index + 1}: ${item.creditorName}
Account Number: ${item.accountNumber}
Reason for Dispute: This information is inaccurate because I do not recognize this account. Please investigate this matter and remove the inaccurate information from my credit report.
`).join('\n')}

Under the Fair Credit Reporting Act, you are required to investigate these disputes and provide me with the results of your investigation. If you cannot verify these items, they must be removed from my credit report.

Please send me notification of the results of your investigation.

Sincerely,

[Your Name]
[Your Address]
[Your City, State, ZIP]
[Your Social Security Number]
`;

    // Update the letters state with the generated content
    setLetters(prev => ({
      ...prev,
      [bureau]: letterContent
    }));
    
    setIsGenerating(false);
  };

  // Generate letters for all selected bureaus at once
  const generateAllLetters = () => {
    bureaus.forEach(bureau => {
      if (!letters[bureau]) {
        generateLetter(bureau);
      }
    });
  };

  const saveDisputes = async () => {
    setIsSaving(true);
    
    try {
      // Save each letter to the disputes table
      const promises = bureaus.map(async (bureau) => {
        const letter = letters[bureau];
        if (!letter) return null;
        
        const { data, error } = await supabase
          .from('disputes')
          .insert({
            credit_bureau: bureau,
            mailing_address: bureauAddresses[bureau],
            letter_content: letter,
            status: 'created'
          })
          .select();
        
        if (error) throw error;
        return data;
      });
      
      await Promise.all(promises);
      
      toast({
        title: "Disputes Saved",
        description: "Your dispute letters have been saved successfully.",
      });
      
      // Call the onComplete callback to notify the parent component
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

  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <CardTitle>Dispute Letters</CardTitle>
        <CardDescription>
          Review and customize your dispute letters for each credit bureau
        </CardDescription>
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
                variant="outline" 
                onClick={generateAllLetters}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Generate All Letters
                  </>
                )}
              </Button>
              
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
                    Save Dispute Letters
                  </>
                )}
              </Button>
            </div>
            
            <Tabs defaultValue={bureaus[0]} value={activeTab} onValueChange={(value) => setActiveTab(value as Bureau)}>
              <TabsList className="w-full">
                {bureaus.map(bureau => (
                  <TabsTrigger 
                    key={bureau} 
                    value={bureau}
                    className="flex-1"
                  >
                    {bureau}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {bureaus.map(bureau => (
                <TabsContent key={bureau} value={bureau} className="mt-4">
                  {!letters[bureau] ? (
                    <div className="flex flex-col items-center justify-center p-8 border rounded-md">
                      <p className="text-center text-muted-foreground mb-4">
                        Generate a dispute letter for {bureau} based on the selected items
                      </p>
                      <Button 
                        onClick={() => generateLetter(bureau)}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating
                          </>
                        ) : (
                          "Generate Letter"
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="border rounded-md p-4">
                      <div className="bg-muted p-6 rounded-md mb-4 whitespace-pre-wrap font-mono text-sm">
                        {letters[bureau]}
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button variant="outline" size="sm">
                          <Send className="h-4 w-4 mr-2" />
                          Send
                        </Button>
                      </div>
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
