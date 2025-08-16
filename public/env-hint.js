fetch('/api/summarize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transcript: 'ping', prompt: 'ping' }) })
	.then(async res => {
		if (res.ok) return;
		const msg = document.getElementById('status');
		if (msg && (await res.clone().json().catch(() => null))?.error?.includes('Failed to generate')) {
			msg.textContent = 'No AI key set; using heuristic summary.';
		}
	})
	.catch(() => {})
	.finally(() => {});

