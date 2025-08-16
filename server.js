const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const { z } = require('zod');
const { Groq } = require('groq-sdk');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

const groqApiKey = process.env.GROQ_API_KEY || '';
const groqClient = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;

const summarizeSchema = z.object({
	transcript: z.string().min(1, 'Transcript is required'),
	prompt: z.string().min(1, 'Prompt is required'),
});

app.post('/api/summarize', async (req, res) => {
	const parseResult = summarizeSchema.safeParse(req.body);
	if (!parseResult.success) {
		return res.status(400).json({ error: 'Invalid input', details: parseResult.error.flatten() });
	}

	const { transcript, prompt } = parseResult.data;

	try {
		if (!groqClient) {
			// Fallback simple heuristic summary if no API key is set
			const fallback = createFallbackSummary(transcript, prompt);
			return res.json({ summary: fallback, model: 'fallback-local' });
		}

		const systemPrompt = [
			'You are an assistant that writes clear, structured meeting summaries.',
			'Always be concise, faithful to the transcript, and follow the user instruction.',
			'Prefer bullet points with short, direct sentences. Include action items with owners and due dates when present.',
		].join(' ');

		const userContent = `Instruction: ${prompt}\n\nTranscript:\n${transcript}`;

		const completion = await groqClient.chat.completions.create({
			model: process.env.GROQ_MODEL || 'llama-3.1-70b-versatile',
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: userContent },
			],
			temperature: 0.2,
			max_tokens: 1200,
		});

		const summary = completion.choices?.[0]?.message?.content?.trim() || '';
		return res.json({ summary, model: completion.model });
	} catch (err) {
		console.error('Summarize error:', err);
		return res.status(500).json({ error: 'Failed to generate summary' });
	}
});

const sendEmailSchema = z.object({
	subject: z.string().min(1, 'Subject is required'),
	body: z.string().min(1, 'Body is required'),
	recipients: z.array(z.string().email('Invalid email')).min(1, 'At least one recipient'),
});

app.post('/api/send-email', async (req, res) => {
	const parseResult = sendEmailSchema.safeParse(req.body);
	if (!parseResult.success) {
		return res.status(400).json({ error: 'Invalid input', details: parseResult.error.flatten() });
	}

	const { subject, body, recipients } = parseResult.data;

	try {
		const transporter = createTransportFromEnv();
		if (!transporter) {
			console.warn('SMTP not configured: set SMTP_HOST/SMTP_USER/SMTP_PASS to enable email');
			return res.status(400).json({ error: 'SMTP not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, EMAIL_FROM in .env' });
		}
		await transporter.sendMail({
			from: process.env.EMAIL_FROM,
			to: recipients.join(','),
			subject,
			html: markdownToBasicHtml(body),
		});
		return res.json({ ok: true });
	} catch (err) {
		console.error('Email error:', err?.message || err);
		return res.status(500).json({ error: 'Failed to send email' });
	}
});

app.listen(PORT, () => {
	console.log(`Server listening on http://localhost:${PORT}`);
	console.log(`Groq API: ${groqClient ? 'configured' : 'not configured (using heuristic fallback)'}`);
});

function createTransportFromEnv() {
	const host = process.env.SMTP_HOST;
	const port = Number(process.env.SMTP_PORT || 587);
	const user = process.env.SMTP_USER;
	const pass = process.env.SMTP_PASS;
	const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';

	if (!host || !user || !pass) {
		return null;
	}

	return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
}

function markdownToBasicHtml(markdown) {
	const escaped = markdown
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');

	// very basic handling of newlines and bullets
	const withParagraphs = escaped
		.split(/\n{2,}/)
		.map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`) // single newlines -> <br/>
		.join('\n');

	const bullets = withParagraphs.replace(/(^|\n)([-*] )(.+?)(?=\n|$)/g, '$1<li>$3</li>');
	const wrappedLists = bullets.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
	return wrappedLists;
}

function createFallbackSummary(transcript, prompt) {
	const sentences = transcript
		.split(/(?<=[.!?])\s+/)
		.filter(Boolean)
		.slice(0, 8);
	const points = sentences.map(s => `- ${s.trim()}`).join('\n');
	return `Instruction: ${prompt}\n\nSummary (heuristic):\n${points}`;
}

