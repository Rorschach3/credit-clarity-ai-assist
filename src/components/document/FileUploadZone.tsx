
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadZoneProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
}

export function FileUploadZone({ file, onFileChange }: FileUploadZoneProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const selectedFile = e.target.files[0];
    
    if (selectedFile.type !== 'application/pdf' && 
        !selectedFile.type.includes('image/')) {
      return;
    }
    
    onFileChange(selectedFile);
  };

  if (!file) {
    return (
      <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6">
        <FileText className="h-10 w-10 text-gray-400 mb-4" />
        <p className="text-sm text-gray-500">
          Drag and drop your credit report PDF or click to browse
        </p>
        <input
          id="file-upload"
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
        />
        <label htmlFor="file-upload" className="mt-4">
          <Button variant="outline" className="cursor-pointer">
            Select File
          </Button>
        </label>
      </div>
    );
  }

  return (
    <div className="w-full text-center">
      <div className="flex items-center justify-center mb-2">
        <FileText className="h-6 w-6 text-primary mr-2" />
        <span className="font-medium">{file.name}</span>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        {Math.round(file.size / 1024)} KB
      </p>
      <div className="flex justify-center gap-2">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onFileChange(null)}
        >
          Change
        </Button>
      </div>
    </div>
  );
}
