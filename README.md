<div align="center">

![Credit Clarity Logo](https://i.ibb.co/HD1HjjhN/031144832693.png)

</div>

<h1 align="center"><span style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2C3E50;">CreditClarityAI</span></h1>

<p align="center"><em>AI-powered credit report analysis and dispute‐letter generation to improve your credit score.</em></p>

---

<div align="center">

**🔗 Table of Contents**

1. [Overview](#overview)
2. [Navigation & Pages](#navigation--pages)
3. [Key Metrics](#key-metrics)
4. [Core Values](#core-values)
5. [Features](#features)
6. [Tech Stack](#tech-stack)
7. [Screenshots](#screenshots)
8. [Getting Started](#getting-started)
9. [Project Structure](#project-structure)
10. [Team](#team)
11. [FAQ Highlights](#faq-highlights)
12. [Footer & Legal](#footer--legal)

</div>

---

## <span style="color: #16A085;">Overview</span>

<p>
Founded in 2024 by a former credit analyst, <strong>CreditClarityAI</strong> uses OCR + AI to:
</p>

<ul>
  <li>🔍 Identify credit‐report errors with high accuracy</li>
  <li>✉️ Generate customized, FCRA-compliant dispute letters</li>
  <li>⚙️ Automate the credit-repair workflow</li>
</ul>

---

## <span style="color: #2980B9;">Navigation & Pages</span>

| **Menu Item**     | **Description**                           |
| ----------------- | ----------------------------------------- |
| Home              | Mission statement + “Get Started” CTA     |
| About             | Our story & founding principles           |
| Pricing           | Subscription tiers & comparisons          |
| FAQ               | Common questions & answers                |
| Contact           | Support form & contact details            |
| Dispute Generator | Upload report → AI drafts dispute letters |
| Account           | Dashboard: manage disputes & view history |

<hr>

## <span style="color: #C0392B;">Key Metrics</span>

<br>

<p align="center">
  <strong style="font-size:1.2em;">15,000+</strong> Customers Served  |  
  <strong style="font-size:1.2em;">85%</strong> Success Rate  |  
  <strong style="font-size:1.2em;">68</strong> Avg. Score Increase
</p>

---

## <span style="color: #8E44AD;">Core Values</span>

<blockquote style="border-left: 4px solid #8E44AD; padding-left:1em;">
<p><strong>Transparency</strong><br>Upfront on capabilities, pricing & no hidden fees.</p>
<p><strong>Education</strong><br>Empower users with credit-repair & financial literacy.</p>
<p><strong>Customer Success</strong><br>Measure success by real score improvements.</p>
</blockquote>

---

## <span style="color: #D35400;">Features</span>

* 🛠️ <strong>Dispute Generator</strong>: Upload or enter report, AI drafts letters.
* 📄 <strong>OCR Integration</strong>: Scan PDFs & images for errors.
* ✍️ <strong>Custom Templates</strong>: Review & edit letters pre-send.
* 📊 <strong>Progress Dashboard</strong>: Track submissions, responses, score changes.

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
  <img src="images/home.png" alt="Home Page" width="600"/>
  <br><em>Home</em>
</p>
<p align="center">
  <img src="images/dispute-generator.png" alt="Generator" width="600"/>
  <br><em>Dispute Generator</em>
</p>
<p align="center">
  <img src="images/dashboard.png" alt="Dashboard" width="600"/>
  <br><em>User Dashboard</em>
</p>

---

## <span style="color: #7F8C8D;">Getting Started</span>

<ol>
  <li>**Clone**  
    <pre><code>git clone https://github.com/your-username/creditclarityai.git
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

## <span style="color: #E74C3C;">Team</span>

| Name             | Role                     |
| ---------------- | ------------------------ |
| Jane Cooper      | CEO & Founder            |
| Robert Fox       | CTO                      |
| Leslie Alexander | Head of AI Development   |
| Michael Johnson  | Senior Credit Specialist |

---

## <span style="color: #2C3E50;">FAQ Highlights</span>

> ### Why are dispute letters effective?
>
> Under the FCRA, bureaus must investigate disputes within 30 days. If unverified, they remove inaccuracies.

> ### How does AI boost success?
>
> Trained on thousands of letters, our models optimize tone, legal wording, and proof patterns.

> ### What can be disputed?
>
> Late payments, collections, charge-offs, repossessions, bankruptcies & more—if inaccurate or unverifiable.

For full FAQs, see [`faq.html`](app/templates/faq.html).

---

## <span style="color: #95A5A6;">Footer & Legal</span>

<p align="center">
© 2025 CreditClarityAI &nbsp;|&nbsp; <a href="privacy.html">Privacy Policy</a> &nbsp;|&nbsp; <a href="terms.html">Terms of Service</a>
</p>

Follow us:
[![Twitter](https://img.shields.io/badge/Twitter-1DA1F2?style=flat\&logo=twitter\&logoColor=white)](https://twitter.com/creditclarityai)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat\&logo=linkedin\&logoColor=white)](https://linkedin.com/company/creditclarityai)
[![Facebook](https://img.shields.io/badge/Facebook-1877F2?style=flat\&logo=facebook\&logoColor=white)](https://facebook.com/creditclarityai)
