import { parseAccountNumbers } from "@/utils/ocr-parser"; // if you're testing just account extraction
// or
// import { parsePdfDocument } from "@/utils/pdf-parser"; // if this function supports raw string test

describe("parseAccountNumbers", () => {
  it("extracts various account formats", () => {
    const input = `
      Account + 517805XXXXXXXXXX
      Account Number 627804XXXX
      Some other number: 123456789
    `;

    const result = parseAccountNumbers(input);

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          normalized: expect.stringMatching(/^517805/),
        }),
        expect.objectContaining({
          normalized: expect.stringMatching(/^627804/),
        }),
      ])
    );
  });

  it("returns empty array for text without accounts", () => {
    const result = parseAccountNumbers("no relevant data");
    expect(result).toEqual([]);
  });

  it("handles multiple accounts in one block", () => {
    const input = `
      CAPITAL ONE
      Account Number: 123456XXXX

      RECOVERY ONE
      Account #: 987654XXXX
    `;

    const result = parseAccountNumbers(input);
    expect(result.length).toBeGreaterThanOrEqual(2);
  });
});
