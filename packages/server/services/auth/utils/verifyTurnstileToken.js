export default async (token) => {
	const secret = process.env.TURNSTILE_SECRET

	if (!secret) {
		throw new Error("Turnstile secret is not set")
	}

	const response = await fetch(
		"https://challenges.cloudflare.com/turnstile/v0/siteverify",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				secret: secret,
				response: token,
			}),
		},
	)

	if (!response.ok) {
		const errorBody = await response.text()
		console.error(errorBody)
		throw new Error("Turnstile verification failed")
	}

	return response.json()
}
