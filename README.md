<div align="center">

![Credit Clarity Logo](https://i.ibb.co/21wJjHWr/Credit-Clarity-Ghost.png)
</div>

<h1 align="center"><span style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2C3E50;">CreditClarityAI</span></h1>

<p align="center"><em>AI-powered credit report analysis and dispute‐letter generation to improve your credit score.</em></p>

---

<div align="center">

** Table of Contents**

1. [Overview](#overview)
2. [Key Metrics](#key-metrics)
3. [Features](#features)
4. [Tech Stack](#tech-stack)
5. [Screenshots](#screenshots)
6. [Getting Started](#getting-started)
7. [Project Structure](#project-structure)
8. [FAQ Highlights](#faq-highlights)

</div>

---

## <span style="color: #16A085;">Overview</span>

<p>
Created by a former credit repair specialist, <strong>CreditClarityAI</strong> uses OCR + AI to:
</p>

<ul>
  <li> Identify credit‐report errors with high accuracy</li>
  <li> Generate customized, FCRA-compliant dispute letters</li>
  <li> Automate the credit-repair workflow</li>
</ul>


---


## <span style="color: #D35400;">Features</span>

-  <strong>Dispute Generator</strong>: Upload or enter report, AI drafts letters.
-  <strong>OCR Integration</strong>: Scan PDFs & images for errors.
-  <strong>Custom Templates</strong>: Review & edit letters pre-send.
-  <strong>Progress Dashboard</strong>: Track submissions, responses, score changes.

---

## <span style="color: #27AE60;">Tech Stack</span>

| Layer          | Technology                    |
| -------------- | ----------------------------- |
| Frontend       | React, Tailwind CSS           |
| Backend        | Flask (Python)                |
| OCR Processing | Tesseract, OpenCV             |
| AI / NLP       | PyTorch, Hugging Face         |
| Database       | PostgreSQL                    |
| Auth           | JWT / Flask-Login             |
| Deployment     | Docker, AWS Elastic Beanstalk |

---

## <span style="color: #34495E;">Screenshots</span>

<p align="center">
  <img src="./images/dashboard.png" alt="Dashboard" width="600"/>
  <br><em>Dashboard</em>
</p>
<p align="center">
  <img src="images/disputeGenerator.png" alt="Generator" width="600"/>
  <br><em>Dispute Generator</em>
</p>
<p align="center">
  <img src="images/disputes.png" alt="Disputes" width="600"/>
  <br><em>Disputes</em>
</p>

---

## <span style="color: #7F8C8D;">Getting Started</span>

<ol>
  <li>**Clone**  
    <pre><code>git clone https://github.com/rorschach3/credit-clarity-ai-assist.git
cd creditclarityai</code></pre>
  </li>
  <li>**Virtual Env**  
    <pre><code>python3 -m venv venv
source venv/bin/activate</code></pre>
  </li>
  <li>**Install**  
    <pre><code>pip install -r requirements.txt</code></pre>
  </li>
  <li>**Configure**  
    <pre><code>cp .env.example .env
# Fill in FLASK_SECRET_KEY, DATABASE_URL, OCR_SERVICE_KEY</code></pre>
  </li>
  <li>**Migrate DB**  
    <pre><code>flask db upgrade</code></pre>
  </li>
  <li>**Run**  
    <pre><code>flask run --host=0.0.0.0 --port=5000</code></pre>
  </li>
</ol>

> Open <a href="http://localhost:5000">localhost:5000</a> in your browser.

---

## <span style="color: #2E86C1;">Project Structure</span>

```text
creditclarityai/
├─ app/
│  ├─ templates/   # Jinja2 HTML
│  ├─ static/      # CSS, JS, images
│  ├─ ocr/         # OCR modules
│  ├─ ai/          # Model code
│  ├─ auth.py      # Auth logic
│  └─ disputes.py  # Dispute routes
├─ migrations/     # DB migrations
├─ tests/          # Unit & integration tests
├─ requirements.txt
├─ .env.example
└─ run.py          # App entry point
```

---

## <span style="color: #2C3E50;">FAQ Highlights</span>

> ### Why are dispute letters effective?
>
> Under the FCRA, bureaus must investigate disputes within 30 days. If they do not verify within 30 days they must remove inaccuracies.

> ### How does AI boost success?
>
> Trained on thousands of letters, our models optimize tone, legal wording, and proof patterns.

> ### What can be disputed?
>
> Late payments, collections, charge-offs, repossessions, bankruptcies, student loans, auto loans, mortgages, child support.

For full FAQs, see [`faq.html`](app/templates/faq.html)

------------------------
CreditReportUploadPage.tsx
TradelinesPage.tsx
DisputeLetterPage.tsx
DisputePacketPage.tsx
DisputeWizardPage.tsx