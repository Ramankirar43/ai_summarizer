async function summarize() {
	const transcript = document.getElementById('transcript').value.trim();
	const prompt = document.getElementById('prompt').value.trim();
	const status = document.getElementById('status');
	status.textContent = 'Generating summary...';
	try {
		const res = await fetch('/api/summarize', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ transcript, prompt }),
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error || 'Failed');
		document.getElementById('summary').value = data.summary || '';
		status.textContent = `Done${data.model ? ' (' + data.model + ')' : ''}`;
	} catch (err) {
		console.error(err);
		status.textContent = 'Error generating summary';
	}
}

async function sendEmail() {
	const recipientsInput = document.getElementById('recipients').value.trim();
	const subject = document.getElementById('subject').value.trim();
	const body = document.getElementById('summary').value.trim();
	const status = document.getElementById('status');
	const recipients = recipientsInput.split(',').map(s => s.trim()).filter(Boolean);
	status.textContent = 'Sending email...';
	try {
		const res = await fetch('/api/send-email', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ recipients, subject, body }),
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error || 'Failed');
		status.textContent = 'Email sent';
	} catch (err) {
		console.error(err);
		status.textContent = 'Error sending email';
	}
}

document.getElementById('summarizeBtn').addEventListener('click', summarize);
document.getElementById('sendBtn').addEventListener('click', sendEmail);

document.getElementById('fileInput').addEventListener('change', async (e) => {
	const file = e.target.files?.[0];
	if (!file) return;
	const text = await file.text();
	document.getElementById('transcript').value = text;
});

