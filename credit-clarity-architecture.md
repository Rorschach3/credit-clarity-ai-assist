# Credit Clarity Architecture Overview

## 1. System Architecture

```mermaid
graph TD
    A[React Frontend] --> B[AWS CloudFront]
    B --> C[Supabase Services]
    C --> D[PostgreSQL Database]
    C --> E[AI Processing Functions]
    E --> F[AWS S3 (Encrypted Storage)]
    C --> G[Auth & RBAC]
    G --> H[TOTP/JWT]
    E --> I[3rd Party Credit Bureaus]
    F --> J[Dispute Generation]
    
    style A fill:#61dafb,stroke:#333
    style B fill:#ff9900,stroke:#333
    style C fill:#3ecf8e,stroke:#333
    style E fill:#ff6b6b,stroke:#333
```

## 2. Technology Stack

| Component        | Technologies                                                                     |
|------------------|---------------------------------------------------------------------------------|
| **Frontend**     | React 19, TypeScript 5, Vite 5, Tailwind CSS 3, Shadcn UI                       |
| **State**        | React Context, Zustand                                                          |
| **Backend**      | Supabase Edge Functions, PostgreSQL 15, Zod                                        |
| **AI/ML**        | Supabase Functions, TensorFlow.js, Custom NLP Models                            |
| **Security**     | AWS WAF, GuardDuty, Supabase RLS, AES-256 (KMS), HMAC-SHA256                    |
| **Compliance**   | FCRA, SOC 2 Controls, Encrypted Audit Logs                                      |
| **Infrastructure**| CloudFront, S3, Supabase Dedicated Cluster                                     |

## 3. Data Flow Architecture

```mermaid
sequenceDiagram

## 4. Feature Replication Plan

### Page Architecture
```mermaid
graph TD
    A[Landing Page] --> B[Pricing]
    A --> C[Features]
    A --> D[Blog]
    B --> E[Signup]
    E --> F[Dashboard]
    F --> G[Dispute Center]
    F --> H[Credit Monitoring]
    G --> I[Letter Generator]
    G --> J[Document Upload]
    G --> K[Status Tracking]
    
    style A fill:#4CAF50
    style F fill:#2196F3
```

### Component Gap Analysis

Beast Feature               | Existing Component               | Required Changes |
|-----------------------------|-----------------------------------|------------------|
Animated Pricing Tiers      | [`PricingPage.tsx`](src/pages/PricingPage.tsx:1) | Add transition effects, conditional tier highlighting |
Dispute Workflow Wizard      | [`StepIndicator.tsx`](src/components/disputes/StepIndicator.tsx:1) | Implement 5-step process with progress persistence |
Live Credit Score Simulator  | [`CreditScoreCard.tsx`](src/components/dashboard/CreditScoreCard.tsx:1) | Add interactive slider control |
Document AI Analysis         | [`EnhancedDocumentScanner.tsx`](src/components/document/EnhancedDocumentScanner.tsx:1) | Integrate PDF text extraction |

### Implementation Roadmap

#### Phase 1 - Core Pages (Weeks 1-2)
1. Create marketing pages in [`src/pages`](src/pages/):
   - `/landing` with hero section and instructions
   - `/blog` with dynamic content loading
   - `/faqs` with collapsible sections
   - `/about` with team bios and contact info
   - `/pricing` with tier toggles

2. Enhance [`DisputeGeneratorPage.tsx`](src/pages/DisputeGeneratorPage.tsx:1) with:
   - Multi-bureau dispute tracking
   - Template library system

#### Phase 2 - Dashboard Features (Weeks 3-4)
1. Build credit monitoring hub in [`DashboardPage.tsx`](src/pages/DashboardPage.tsx:1):
   ```mermaid
   flowchart LR
   A[Score Summary] --> B[Negative Items]
   A --> C[Action Plan]
   B --> D[Dispute Status]
   C --> E[Recommended Letters]
   ```

2. Add AI recommendation engine in [`ai-service.ts`](src/utils/ai-service.ts:1)

#### Phase 3 - Compliance (Post-MVP)
1. Implement FCRA requirements from [`20250520120000_add_fcra_compliance.sql`](supabase/migrations/20250520120000_add_fcra_compliance.sql:1)
2. Add audit trails in [`AuditLog.tsx`](src/components/admin/AuditLog.tsx:1)
