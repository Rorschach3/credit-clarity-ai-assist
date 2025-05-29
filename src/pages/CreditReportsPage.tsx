"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  ChangeEvent,
  useRef,
} from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { createWorker, Worker } from "tesseract.js";

import { Navbar } from "@/components/layout/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";



import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

import CreditReportViewer from "@/components/CreditReportViewer";
import { CreditReport } from "@/types/document";
import { pdfToImages } from "@/utils/pdfToImage";
import { parseTradelinesFromText, ParsedTradeline, saveTradelinesToDatabase } from "@/utils/tradelineParser";
interface LocalCreditReport extends CreditReport {
  parsedTradelines?: ParsedTradeline[];
}

const BUREAUS = ["Equifax", "Experian", "TransUnion"] as const;

const inferBureauFromFileName = (fileName: string): string => {
  const lower = fileName.toLowerCase();
  if (lower.includes("equifax")) return "Equifax";
  if (lower.includes("experian")) return "Experian";
  if (lower.includes("transunion")) return "TransUnion";
  return "Unknown";
};

export const CreditReportsPage = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<LocalCreditReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bureauFilter, setBureauFilter] = useState<string>("All");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBureau, setPreviewBureau] = useState<string>("");
  const [previewOcrText, setPreviewOcrText] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analyzedReport, setAnalyzedReport] = useState<LocalCreditReport | null>(null);
  const workerRef = useRef<Worker | null>(null);

  // Initialize OCR worker
  useEffect(() => {
    const initializeWorker = async () => {
      const worker = await createWorker();
      workerRef.current = worker;
      return () => {
        worker.terminate();
      };
    };

    initializeWorker();
  }, []);

  // Fetch reports from the API/database
  useEffect(() => {
    const fetchReports = async () => {
      try {
        console.log("User object in CreditReportsPage:", user);
        if (!user) {
          setReports([]);
          setLoading(false);
          return;
        }
        console.log("Supabase client config:", supabase);
        const { data, error } = await supabase
          .from('credit_reports')
          .select('id, user_id, file_path, file_name, upload_date, status, error_message')
          .eq('user_id', user.id);
        if (error) throw error;
        if (!data) {
          setReports([]);
          setLoading(false);
          return;
        }
        // Map data to LocalCreditReport type with required fields
        const mappedReports = data.map((report) => ({
          id: report.id,
          bureau: inferBureauFromFileName(report.file_name),
          uploadDate: report.upload_date,
          fileUrl: report.file_path,
          fileName: report.file_name,
        }));
        setReports(mappedReports);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching credit reports:", err);
        setError("Failed to load credit reports");
        setLoading(false);
      }
    };

    fetchReports();
  }, [user]);

  const filteredReports = useMemo(() => {
    if (bureauFilter === "All") return reports;
    return reports.filter(report => report.bureau === bureauFilter);
  }, [reports, bureauFilter]);

  const handleAnalyzeReport = async (report: LocalCreditReport) => {
    setUploadProgress(0);
    setUploading(true);
    try {
      // Fetch the PDF file as ArrayBuffer
      const response = await fetch(report.fileUrl);
      const arrayBuffer = await response.arrayBuffer();

      // Convert PDF to images
      const images = await pdfToImages(arrayBuffer);
      let combinedText = '';

      setUploadProgress(25);

      for (let i = 0; i < images.length; i++) {
        const { data: { text } } = await workerRef.current!.recognize(images[i]);
        combinedText += text + '\n\n';
        setUploadProgress(25 + (50 * (i + 1) / images.length));
      }

      console.log("Combined OCR text from PDF images:", combinedText);

      setUploadProgress(80);

      // Parse tradelines using the enhanced parser
      const tradelines = parseTradelinesFromText(combinedText);
      setAnalyzedReport({
        ...report,
        parsedTradelines: tradelines,
      });

      // Save tradelines to database
      if (user) {
        await saveTradelinesToDatabase(tradelines, user.id);
        toast.success("Tradelines saved to database!");
      } else {
        toast.error("User not authenticated. Tradelines not saved.");
      }
    } catch (error) {
      console.error("Error analyzing report:", error);
      toast.error("Failed to analyze credit report.");
    } finally {
      setUploading(false);
    }
  };

  const handleClosePreview = () => {
    setPreviewUrl(null);
    setPreviewBureau("");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Navbar />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Credit Reports</h1>
        <Select value={bureauFilter} onValueChange={setBureauFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by bureau" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Bureaus</SelectItem>
            {BUREAUS.map((bureau) => (
              <SelectItem key={bureau} value={bureau}>
                {bureau}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p>Loading your precious credit reports...</p>
      ) : error ? (
        <p className="text-red-600">Error: {error}</p>
      ) : filteredReports.length === 0 ? (
        <p>No credit reports found. Time to upload some!</p>
      ) : (
        <ul className="space-y-4">
          {filteredReports.map((report: LocalCreditReport) => (
            <li
              key={report.id}
              className="p-4 border rounded hover:shadow cursor-pointer flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2"
            >
              <div
                className="flex-1"
                onClick={() => {
                  setPreviewUrl(report.fileUrl);
                  setPreviewBureau(report.bureau);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setPreviewUrl(report.fileUrl);
                    setPreviewBureau(report.bureau);
                  }
                }}
                aria-label={`Preview credit report ${report.fileName} from ${report.bureau}`}
              >
                <p className="font-semibold">{report.fileName}</p>
                <p className="text-sm text-muted-foreground">
                  {report.bureau} - Uploaded on {format(new Date(report.uploadDate), "PPP")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setPreviewUrl(report.fileUrl);
                    setPreviewBureau(report.bureau);
                  }}
                  aria-label={`Preview credit report ${report.fileName}`}
                >
                  Preview
                </Button>
                <a
                  href={report.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="btn btn-ghost"
                  aria-label={`Download credit report ${report.fileName}`}
                >
                  <Button variant="ghost">Download</Button>
                </a>
                <Button
                  variant="ghost"
                  onClick={() => handleAnalyzeReport(report)}
                  aria-label={`Analyze credit report ${report.fileName}`}
                >
                  Analyze
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {uploading && (
        <div className="mt-4">
          <p>Processing report...</p>
          <Progress value={uploadProgress} className="mt-2" />
        </div>
      )}

      {analyzedReport?.parsedTradelines && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Detected Tradelines</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analyzedReport.parsedTradelines.map((tl, index) => (
              <div
                key={index}
                className={`border p-4 rounded shadow hover:shadow-md transition ${tl.isNegative ? 'border-red-500 bg-[rgba(255,255,255,0.08)]' : 'border-green-500 bg-green-50'
                  }`}
              >
                <h3 className="text-lg font-semibold mb-2">{tl.creditorName}</h3>
                <p><strong>Account #:</strong> {tl.accountNumber}</p>
                <p><strong>Status:</strong> {tl.status}</p>
                <p><strong>Negative:</strong> {tl.isNegative ? 'Yes' : 'No'}</p>
                {tl.isNegative && (
                  <p className="text-sm text-red-600">
                    <strong>Reason:</strong> {tl.negativeReason}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}


      {previewUrl && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2"></h2>
            Previewing: {previewBureau} Report
          <CreditReportViewer
            fileUrl={previewUrl}
            bureau={previewBureau}
            onClose={handleClosePreview}
            ocrText={previewOcrText}
          />
        </div>
      )}
    </div>
  );
};

export default CreditReportsPage;
