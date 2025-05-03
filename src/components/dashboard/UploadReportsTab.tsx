
import { FileUploader } from "./FileUploader";
import { UploadTips } from "./UploadTips";

interface UploadReportsTabProps {
  onBackToOverview: () => void;
}

export function UploadReportsTab({ onBackToOverview }: UploadReportsTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <FileUploader />
      <UploadTips onBackToOverview={onBackToOverview} />
    </div>
  );
}
