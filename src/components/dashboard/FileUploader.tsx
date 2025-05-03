
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useState } from "react";

export function FileUploader() {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    
    // Simulate file upload and processing
    setTimeout(() => {
      setIsUploading(false);
      toast.success("Credit report uploaded successfully!");
      toast("AI analysis in progress...", {
        duration: 3000,
      });
      
      // Simulate AI analysis completion
      setTimeout(() => {
        toast.success("AI analysis complete! 8 negative items found.");
      }, 3000);
    }, 2000);
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Upload Credit Reports</CardTitle>
        <CardDescription>
          Upload your credit reports from all three major bureaus for AI analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Drag and drop your files here</h3>
          <p className="text-gray-500 mb-4">
            Supported file types: PDF, JPG, PNG
          </p>
          <div>
            <label htmlFor="file-upload">
              <Button 
                disabled={isUploading}
                className="cursor-pointer"
              >
                {isUploading ? "Uploading..." : "Browse Files"}
              </Button>
              <input 
                id="file-upload" 
                type="file" 
                className="hidden" 
                accept=".pdf,.jpg,.jpeg,.png" 
                onChange={handleFileUpload}
                multiple
              />
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
