
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, AlertCircle, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { NegativeItem } from "@/types/document";
import { DisputeAnalysis } from "@/utils/ai-service";

interface EnhancedNegativeItemsListProps {
  items: NegativeItem[];
  analysis?: DisputeAnalysis;
  onGenerateDisputes: (items: NegativeItem[]) => void;
}

export function EnhancedNegativeItemsList({ 
  items, 
  analysis,
  onGenerateDisputes 
}: EnhancedNegativeItemsListProps) {
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [showRecommendationsOnly, setShowRecommendationsOnly] = useState(false);

  // Initialize with AI recommendations if available
  useState(() => {
    if (analysis?.recommendedDisputes) {
      const initialSelected: Record<string, boolean> = {};
      analysis.recommendedDisputes.forEach(item => {
        initialSelected[item.id] = true;
      });
      setSelectedItems(initialSelected);
    }
  });

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleGenerateDisputes = () => {
    const itemsToDispute = items.filter(item => selectedItems[item.id]);
    onGenerateDisputes(itemsToDispute);
  };

  const getRecommendedReason = (itemId: string) => {
    if (!analysis?.recommendedDisputes) return null;
    
    const recommendedItem = analysis.recommendedDisputes.find(item => item.id === itemId);
    return recommendedItem?.recommendedReason || null;
  };

  const selectedCount = Object.values(selectedItems).filter(Boolean).length;
  
  // Filter items based on recommendations if filter is active
  const displayedItems = showRecommendationsOnly && analysis
    ? items.filter(item => 
        analysis.recommendedDisputes.some(rec => rec.id === item.id)
      )
    : items;

  if (items.length === 0) {
    return null;
  }

  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Negative Items Found
              {analysis && (
                <Badge variant="outline" className="bg-blue-100 text-blue-800 ml-2">
                  <Bot className="h-3 w-3 mr-1" />
                  AI Enhanced
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Select the items you want to dispute on your credit report
            </CardDescription>
          </div>
          
          {analysis?.recommendedDisputes && analysis.recommendedDisputes.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRecommendationsOnly(!showRecommendationsOnly)}
              className="text-xs h-8"
            >
              {showRecommendationsOnly ? "Show All Items" : "Show AI Recommendations Only"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {analysis && (
          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <Bot className="h-4 w-4" />
            <AlertDescription>
              Our AI has analyzed your report and identified {analysis.recommendedDisputes.length} items 
              with high dispute potential. These items are pre-selected below.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {displayedItems.map((item) => {
            const isAiRecommended = analysis?.recommendedDisputes?.some(rec => rec.id === item.id);
            const recommendedReason = getRecommendedReason(item.id);
            
            return (
              <div 
                key={item.id} 
                className={`flex items-start p-4 rounded-lg border ${
                  selectedItems[item.id] 
                    ? 'border-primary bg-primary/5' 
                    : isAiRecommended 
                      ? 'border-blue-200 bg-blue-50/30'
                      : 'border-gray-200'
                }`}
              >
                <Checkbox 
                  id={`item-${item.id}`}
                  checked={!!selectedItems[item.id]}
                  onCheckedChange={() => toggleItem(item.id)}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <div className="flex flex-wrap justify-between gap-2 mb-2">
                    <div className="flex items-center">
                      <label 
                        htmlFor={`item-${item.id}`}
                        className="font-medium cursor-pointer"
                      >
                        {item.creditorName}
                      </label>
                      {isAiRecommended && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge className="ml-2 bg-blue-100 text-blue-800 border-blue-200 flex items-center">
                                <Bot className="h-3 w-3 mr-1" />
                                AI Recommended
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs text-sm">
                                Our AI system recommends disputing this item because it has a high likelihood of success.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">
                      {item.reason}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Account: {item.accountNumber}
                  </p>

                  {recommendedReason && (
                    <div className="mt-2 flex items-start gap-2 text-sm border-t border-blue-100 pt-2">
                      <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-blue-700">AI Recommended Dispute Reason: </span>
                        <span>{recommendedReason}</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mt-2">
                    <div>
                      <span className="text-muted-foreground">Amount:</span> {item.amount}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date Reported:</span> {item.dateReported}
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Bureaus:</span>{" "}
                      <div className="inline-flex flex-wrap gap-1 mt-1">
                        {item.bureaus.map(bureau => (
                          <Badge key={bureau} variant="secondary" className="text-xs">
                            {bureau}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          <div className="flex justify-between items-center mt-6 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {selectedCount} of {items.length} items selected
            </p>
            <Button 
              onClick={handleGenerateDisputes}
              disabled={selectedCount === 0}
            >
              Generate Dispute Letters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
