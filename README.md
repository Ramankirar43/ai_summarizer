AI Meeting Notes Summarizer

Quickstart

1. Copy env template and edit values:

   - Windows PowerShell:
     - Copy `.env.example` to `.env` manually and fill values.

   Required:

   - SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, EMAIL_FROM
     Optional:
   - GROQ_API_KEY, GROQ_MODEL

2. Install dependencies:

   npm install

3. Start the server (dev):

   npm run dev

Open http://localhost:3000

Features

- Upload or paste transcript
- Custom instruction/prompt
- Generate editable summary (Groq or heuristic fallback)
- Send summary via email to recipients
