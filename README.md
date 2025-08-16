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

Live Link->   https://ramankirar-ai-summarizer.onrender.com

add prompts like : "Read the following meeting transcript and generate a concise summary. Include the main discussion points, decisions made, action items, responsible persons, and any deadlines mentioned. Keep it clear, structured, and easy to understand." to get better responses.

Features

- Upload or paste transcript
- Custom instruction/prompt
- Generate editable summary (Groq or heuristic fallback)
- Send summary via email to recipients
