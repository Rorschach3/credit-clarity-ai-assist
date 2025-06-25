import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import CreditReportUploadPage from "@/pages/CreditReportUploadPage";
import { pdfToImages } from "@/utils/pdfToImage";
import { parseTradelinesFromText, saveTradelinesToDatabase } from "@/utils/tradelineParser";
import { createWorker } from "tesseract.js";

// Mock dependencies
jest.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { id: "test-user-id", email: "test@example.com" }
  })
}));

jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn()
}));

jest.mock("@/utils/pdfToImage", () => ({
  pdfToImages: jest.fn()
}));

jest.mock("@/utils/tradelineParser", () => ({
  parseTradelinesFromText: jest.fn(),
  saveTradelinesToDatabase: jest.fn()
}));

// Mock tesseract.js
jest.mock("tesseract.js", () => ({
  createWorker: jest.fn(() => ({
    recognize: jest.fn(() => Promise.resolve({ data: { text: "mocked OCR text" } })),
    terminate: jest.fn()
  }))
}));

describe("CreditReportUploadPage", () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    (pdfToImages as jest.Mock).mockResolvedValue(["image1.png"]);
    (parseTradelinesFromText as jest.Mock).mockResolvedValue([
      { id: "1", creditor_name: "Creditor A", account_number: "123", account_balance: "1000", account_status: "Open" }
    ]);
    (saveTradelinesToDatabase as jest.Mock).mockResolvedValue(undefined);
  });

  it("should render the credit report upload page correctly", () => {
    render(<CreditReportUploadPage />);
    expect(screen.getByText("Step 1: Upload or Add Tradelines")).toBeInTheDocument();
    expect(screen.getByLabelText("Upload Credit Report (PDF)")).toBeInTheDocument();
    expect(screen.getByText("+ Add Tradeline Manually")).toBeInTheDocument();
    expect(screen.getByText("No tradelines found.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Proceed to Step 2" })).toBeDisabled();
  });

  it("should handle PDF file upload and OCR processing", async () => {
    render(<CreditReportUploadPage />);

    const file = new File(["dummy pdf content"], "report.pdf", { type: "application/pdf" });
    const input = screen.getByLabelText("Upload Credit Report (PDF)");

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText(/Processing with OCR.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(pdfToImages).toHaveBeenCalledWith(expect.any(ArrayBuffer));
      expect(createWorker).toHaveBeenCalledWith("eng");
      expect((createWorker as jest.Mock).mock.results[0].value.recognize).toHaveBeenCalledWith("image1.png");
      expect(parseTradelinesFromText).toHaveBeenCalledWith("mocked OCR text\n", "test-user-id");
      expect(saveTradelinesToDatabase).toHaveBeenCalledWith(
        [{ id: "1", creditor_name: "Creditor A", account_number: "123", account_balance: "1000", account_status: "Open" }],
        "test-user-id"
      );
      expect(screen.getByText("Upload complete")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Creditor Name")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Creditor A")).toBeInTheDocument();
    });
  });

  it("should open and close the manual tradeline modal", async () => {
    render(<CreditReportUploadPage />);

    const addButton = screen.getByText("+ Add Tradeline Manually");
    fireEvent.click(addButton);

    expect(screen.getByText("Add Manual Tradeline")).toBeInTheDocument();

    const closeButton = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText("Add Manual Tradeline")).not.toBeInTheDocument();
    });
  });

  it("should add a manual tradeline", async () => {
    render(<CreditReportUploadPage />);

    fireEvent.click(screen.getByText("+ Add Tradeline Manually"));

    fireEvent.change(screen.getByLabelText("Creditor Name"), { target: { value: "Manual Creditor" } });
    fireEvent.change(screen.getByLabelText("Account Number"), { target: { value: "9876" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Tradeline" }));

    await waitFor(() => {
      expect(screen.getByDisplayValue("Manual Creditor")).toBeInTheDocument();
      expect(saveTradelinesToDatabase).toHaveBeenCalledTimes(1); // Initial save after adding
    });
  });

  it("should update a tradeline", async () => {
    // First, simulate an upload to get tradelines
    render(<CreditReportUploadPage />);
    const file = new File(["dummy pdf content"], "report.pdf", { type: "application/pdf" });
    const input = screen.getByLabelText("Upload Credit Report (PDF)");
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(screen.getByDisplayValue("Creditor A")).toBeInTheDocument());

    const creditorInput = screen.getByDisplayValue("Creditor A");
    fireEvent.change(creditorInput, { target: { value: "Updated Creditor" } });

    await waitFor(() => {
      expect(screen.getByDisplayValue("Updated Creditor")).toBeInTheDocument();
      // Expect saveTradelinesToDatabase to be called again due to useEffect on tradelines change
      expect(saveTradelinesToDatabase).toHaveBeenCalledTimes(2);
    });
  });

  it("should delete a tradeline", async () => {
    // First, simulate an upload to get tradelines
    render(<CreditReportUploadPage />);
    const file = new File(["dummy pdf content"], "report.pdf", { type: "application/pdf" });
    const input = screen.getByLabelText("Upload Credit Report (PDF)");
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(screen.getByDisplayValue("Creditor A")).toBeInTheDocument());

    const deleteButton = screen.getByRole("button", { name: "Delete" });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.queryByDisplayValue("Creditor A")).not.toBeInTheDocument();
      expect(screen.getByText("No tradelines found.")).toBeInTheDocument();
      expect(saveTradelinesToDatabase).toHaveBeenCalledTimes(2); // Called again after deletion
    });
  });

  it("should enable proceed button when tradelines are selected", async () => {
    render(<CreditReportUploadPage />);
    const file = new File(["dummy pdf content"], "report.pdf", { type: "application/pdf" });
    const input = screen.getByLabelText("Upload Credit Report (PDF)");
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(screen.getByDisplayValue("Creditor A")).toBeInTheDocument());

    const checkbox = screen.getByLabelText("Select for Dispute");
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Proceed to Step 2" })).toBeEnabled();
    });
  });

  it("should navigate to dispute-letter page on proceed", async () => {
    const mockNavigate = jest.fn();
    jest.mock("react-router-dom", () => ({
      useNavigate: () => mockNavigate
    }));
    render(<CreditReportUploadPage />);

    const file = new File(["dummy pdf content"], "report.pdf", { type: "application/pdf" });
    const input = screen.getByLabelText("Upload Credit Report (PDF)");
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(screen.getByDisplayValue("Creditor A")).toBeInTheDocument());

    const checkbox = screen.getByLabelText("Select for Dispute");
    fireEvent.click(checkbox);

    const proceedButton = screen.getByRole("button", { name: "Proceed to Step 2" });
    fireEvent.click(proceedButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dispute-letter");
    });
  });
});