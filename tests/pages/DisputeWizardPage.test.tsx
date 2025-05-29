import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect';
import DisputeWizardPage from "@/pages/DisputeWizardPage";
import "@testing-library/jest-dom";

describe("DisputeWizardPage integration flow", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders parsed tradelines and generates a dispute letter", async () => {
    render(<DisputeWizardPage />);

    const inputText = `
      CAPITAL ONE
      Account #: 1234XXXX
      Status: Collection
      Reason: Wrong
    `;

    const creditReportInput = screen.getByLabelText(/credit report text/i);
    fireEvent.change(creditReportInput, { target: { value: inputText } });

    fireEvent.click(screen.getByRole("button", { name: /parse tradelines/i }));

    await waitFor(() => {
      expect(screen.getByText(/CAPITAL ONE/)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: "John Doe" },
    });

    fireEvent.change(screen.getByLabelText(/your address/i), {
      target: { value: "123 Main St" },
    });

    const addButton = screen.getByRole("button", { name: /add/i });
    fireEvent.click(addButton);

    fireEvent.click(screen.getByRole("button", { name: /generate letter/i }));

    const output = await screen.findByLabelText(/generated dispute letter/i);
    expect((output as HTMLInputElement).value).toMatch(/I am formally disputing the following/i);
    expect((output as HTMLInputElement).value).toMatch(/CAPITAL ONE/);
    expect((output as HTMLInputElement).value).toMatch(/1234XXXX/);
    expect((output as HTMLInputElement).value).toMatch(/Wrong/);
  });
});
