# Testing Strategies for Credit Dispute Web Application

This document outlines potential testing strategies to ensure the correct functionality of the key functions and pages within the credit dispute web application.

## 1. Unit Tests

Unit tests focus on individual functions or modules in isolation.

*   **`src/utils/ocr-parser.ts` (OCR Parsing):**
    *   **`parseAccountNumbers`:**
        *   Test with various credit report text snippets containing different account number formats (e.g., "Account + 517805XXXXXXXXXX", "Account Number 627804XXXX", "517805XXXXXXXXXX").
        *   Test with empty input text.
        *   Test with text containing no account numbers.
        *   Test with multiple account numbers in the same text.
        *   Test with account numbers containing special characters or whitespace.
        *   Test that the function correctly extracts the raw, normalized, and context properties.
*   **`src/utils/tradelineParser.ts` (Tradeline Parsing):**
    *   **`sanitizeText`:**
        *   Test with text containing various date formats (e.g., "7/23/24", "2024-07-23", "Report Date: 07/23/2024").
        *   Test with text containing source attribution phrases (e.g., "Experian", "TransUnion", "Equifax").
        *   Test with text containing zero-width characters or non-printable characters.
        *   Test that the function correctly removes all specified patterns.
    *   **`parseTradelinesFromText`:**
        *   Test with various credit report text snippets containing different tradeline formats.
        *   Test with empty input text.
        *   Test with text containing no tradelines.
        *   Test with multiple tradelines in the same text.
        *   Test with tradelines containing missing or invalid data (e.g., missing account number, missing status).
        *   Test that the function correctly extracts creditor name, account number, status, negativity, balance, and date opened.
        *   Test that the function correctly infers negativity based on status and reason.
    *   **`saveTradelinesToDatabase`:**
        *   This function interacts with the database, so it's best tested with integration tests (see below). However, you can unit test the function's logic by mocking the `supabase` client and verifying that it's called with the correct parameters.
*   **`src/components/disputes/EnhancedDisputeLetterGenerator.tsx` (Letter Generation):**
    *   While the component itself is more suited for integration tests, you can unit test any pure functions within it that generate the letter content based on selected tradelines.

## 2. Integration Tests

Integration tests verify the interactions between different modules or services.

*   **PDF Upload and Parsing Flow:**
    *   Test the entire flow from PDF upload to tradeline parsing and database saving.
    *   Upload various sample credit report PDF files.
    *   Verify that the tradelines are correctly extracted, parsed, and saved to the database.
    *   Verify that any errors during the process are correctly handled and displayed to the user.
*   **Single-Page Dispute Flow (`src/pages/DisputeWizardPage.tsx`):**
    *   Test the entire user flow on the `DisputeWizardPage`:
        *   Input credit report text.
        *   Verify that the tradelines are correctly displayed.
        *   Select tradelines for dispute.
        *   Enter user information (name, address).
        *   Generate the dispute letter.
        *   Verify that the generated letter contains the correct information and formatting.
        *   Test with different combinations of selected tradelines.
        *   Test with missing user information.
*   **Database Interaction:**
    *   Test that the `saveTradelinesToDatabase` function correctly saves tradelines to the database.
    *   Verify that the data is stored in the correct format and with the correct values.
    *   Test with different user IDs.
    *   Test with invalid data to ensure that the database constraints are enforced.

## 3. End-to-End (E2E) Tests

E2E tests simulate real user scenarios to ensure the entire application works as expected from a user's perspective.

*   Use a tool like Cypress or Playwright to simulate a real user interacting with the application.
*   Test the entire credit dispute process from start to finish:
    *   Navigate to the `DisputeWizardPage`.
    *   Upload a credit report PDF.
    *   Select tradelines to dispute.
    *   Enter user information.
    *   Generate the dispute letter.
    *   Verify that the letter is displayed correctly.
    *   Verify that the tradelines are saved to the database.
    *   Verify that the user can download the generated letter.

## 4. Component Tests

Component tests focus on rendering and behavior of individual UI components.

*   Use a tool like React Testing Library to test individual React components in isolation.
*   Test that the components render correctly with different props.
*   Test that the components handle user interactions correctly (e.g., button clicks, form submissions).
*   Test that the components update their state correctly.

## 5. Mocking and Stubbing

Mocking and stubbing are techniques used to isolate units of code and test them in isolation by replacing dependencies with controlled substitutes.

*   Mock external dependencies such as the Supabase client, the OCR service, and the file system.
*   Stub out complex functions to return predefined values.

## 6. Test Data

*   Create a comprehensive set of test data that covers all possible scenarios and edge cases.
*   Include valid and invalid data, as well as data with missing or incomplete information.
*   Use realistic credit report text snippets and PDF files.

## 7. Test Coverage

*   Aim for high test coverage to ensure that all parts of the application are thoroughly tested.
*   Use a code coverage tool to measure the percentage of code that is covered by tests.

By implementing these testing strategies, you can ensure that the credit dispute web application is robust, reliable, and provides a seamless user experience.