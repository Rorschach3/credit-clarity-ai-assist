# PDF Trade Line Extraction Guide

## Overview
This module is responsible for parsing credit report PDFs (from Equifax, Experian, TransUnion) and extracting individual trade lines (accounts, collections, inquiries).

## Workflow for AI Agents
1. **Locate Extraction Logic:** 
   - PDF parsing logic should be located in `src/utils/pdfParser` or similar.
2. **Handling Parsing Tools:**
   - Utilize the designated PDF parsing library (e.g., `pdf2json`, `pdfminer`, or OCR tools if dealing with scanned documents).
3. **Data Structuring:**
   - Extracted trade lines MUST be mapped to a standardized JSON schema.
   - Required fields: `Creditor Name`, `Account Number` (often partially masked), `Balance`, `Account Status`, `Date Opened`, and `Bureau`.
4. **Error Handling:**
   - If a PDF is password-protected or unreadable, throw a specific `PDFParsingError` and prompt the user.
   - Flag any trade lines with missing crucial data (like Account Status) for manual review.