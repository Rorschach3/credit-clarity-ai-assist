import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ParsedTradeline } from "@/utils/tradelineParser";
import { toast } from "@/components/ui/use-toast";
import { aiService } from "@/utils/ai-service";

interface UserInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

interface LetterEditorProps {
  userInfo: UserInfo;
  selectedTradelines: ParsedTradeline[];
  letter: string;
  setLetter: (val: string) => void;
  setShowDocsSection: (val: boolean) => void;
}

export const LetterEditor: React.FC<LetterEditorProps> = ({
  userInfo,
  selectedTradelines,
  letter,
  setLetter,
  setShowDocsSection,
}) => {
  const [isGenerating, setIsGenerating] = React.useState(false);

  const generateLetter = async () => {
    const { name, address, city, state, zip } = userInfo;

    if (!name || !address || !city || !state || !zip || selectedTradelines.length === 0) {
      toast({
        title: "Missing Info",
        description: "Please complete your info and select at least one tradeline.",
        variant: "destructive",
      });
      return;
    }

    const itemText = selectedTradelines
      .map(
        (t, i) =>
          `Item ${i + 1}: ${t.creditorName}\nAccount Number: ${t.accountNumber}\nReason: ${
            t.negativeReason || "This item is inaccurate or does not belong to me."
          }`
      )
      .join("\n\n");

    const prompt = `You are an expert credit dispute letter writer. Generate a professional, compliant, and persuasive dispute letter for the following user and tradelines. Use a respectful tone, reference FCRA Section 611, and include all necessary compliance language.\n\nName: ${name}\nAddress: ${address}\nCity: ${city}\nState: ${state}\nZip: ${zip}\n\nTradelines to Dispute:\n${itemText}`;

    setIsGenerating(true);
    setLetter("Generating letter...");
    try {
      const aiLetter = await aiService.chatCompletion(
        [
          {
            role: "system",
            content:
              "You are a credit expert and legal writer who drafts formal, persuasive, and FCRA-compliant dispute letters based on consumer credit reports.",
          },
          { role: "user", content: prompt },
        ],
        "gpt-3.5-turbo-16k",
        512
      );
      setLetter(aiLetter.trim());
    } catch (err) {
      toast({
        title: "AI Error",
        description: "Using fallback template instead.",
        variant: "destructive",
      });

      const fallback = `${name}\n${address}\n${city}, ${state} ${zip}\n\nTo Whom It May Concern,\n\nI am formally disputing the following items from my credit report:\n\n${itemText}\n\nUnder the Fair Credit Reporting Act (FCRA), Section 611, I request a thorough investigation within 30 days. Please correct or remove any inaccurate information and send me an updated report.\n\nSincerely,\n${name}`;
      setLetter(fallback);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([letter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dispute_letter.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`<pre>${letter}</pre>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={generateLetter}
        disabled={
          isGenerating ||
          selectedTradelines.length === 0 ||
          !userInfo.name ||
          !userInfo.address ||
          !userInfo.city ||
          !userInfo.state ||
          !userInfo.zip
        }
      >
        {isGenerating ? "Generating..." : "Generate Letter"}
      </Button>

      {isGenerating && (
        <div className="text-sm text-muted-foreground">
          Generating your letter, please wait...
        </div>
      )}

      {letter && (
        <>
          <Textarea
            rows={12}
            value={letter}
            onChange={(e) => setLetter(e.target.value)}
            className="font-mono"
          />
          <div className="flex gap-2">
            <Button onClick={handleDownload} variant="outline">
              Download
            </Button>
            <Button onClick={handlePrint} variant="outline">
              Print
            </Button>
            <Button onClick={() => setShowDocsSection(true)}>
              Add Identity Docs & Prepare Packet
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
