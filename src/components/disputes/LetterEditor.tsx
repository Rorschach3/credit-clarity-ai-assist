import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ParsedTradeline } from "@/utils/tradelineParser";

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
