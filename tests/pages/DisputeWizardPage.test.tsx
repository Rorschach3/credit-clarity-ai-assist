import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock the AI service to control outputs
jest.mock("@/services/aiService", () => ({
  analyzeDisputeText: jest.fn().mockResolvedValue({
    accounts: [
      { creditorName: "CAPITAL ONE", accountNumber: "1234XXXX", status: "collection", balance: 0, dateOpened: "", isNegative: true, negativeReason: "Wrong" }
    ],
    summary: ""
  }),
  generateDisputeLetter: jest.fn().mockResolvedValue({ letter: "I am formally disputing the following items: CAPITAL ONE " }),
  saveTradelines: jest.fn().mockResolvedValue(undefined)
}));

import DisputeWizardPage from "@/app/dispute-wizard/page";
import { analyzeDisputeText, generateDisputeLetter, saveTradelines } from "@/services/aiService";

describe("DisputeWizardPage integration flow", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("processes a PDF file, shows extracted accounts, and generates a dispute letter", async () => {
    render(<DisputeWizardPage />);

    // Simulate uploading a PDF file
    const file = new File(["dummy content"], "report.pdf", { type: "application/pdf" });
    const fileInput = screen.getByLabelText(/upload credit report/i);
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Wait for analyzeDisputeText to be called and accounts rendered
    await waitFor(() => {
      expect(analyzeDisputeText).toHaveBeenCalled();
      expect(screen.getByText("CAPITAL ONE")).toBeInTheDocument();
    });

    // Fill in user info
    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: "John Doe" }
    });
    fireEvent.change(screen.getByLabelText(/address/i), {
      target: { value: "123 Main St" }
    });

    // Select the account
    fireEvent.click(screen.getByText("CAPITAL ONE"));

    // Click generate letter
    fireEvent.click(screen.getByRole("button", { name: /generate letter/i }));

    // saveTradelines and generateDisputeLetter should be called
    await waitFor(() => {
      expect(saveTradelines).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ accountNumber: "1234XXXX" })
        ]),
        expect.any(String)
      );
      expect(generateDisputeLetter).toHaveBeenCalled();
    });

    // The generated letter should appear
    const letterBox = screen.getByRole("textbox", { name: /generated letter/i });
    expect(letterBox).toHaveValue(expect.stringContaining("I am formally disputing the following items: CAPITAL ONE"));
  });
});
