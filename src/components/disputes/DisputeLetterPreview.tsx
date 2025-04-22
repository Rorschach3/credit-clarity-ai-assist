
import React from 'react';
import { Button } from "@/components/ui/button";
import { Download, Send } from "lucide-react";
import { type Bureau } from "@/utils/bureau-constants";

interface DisputeLetterPreviewProps {
  letterContent: string;
}

export function DisputeLetterPreview({ letterContent }: DisputeLetterPreviewProps) {
  return (
    <div>
      <div className="bg-muted p-6 rounded-md mb-4 whitespace-pre-wrap font-mono text-sm">
        {letterContent}
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
  );
}

