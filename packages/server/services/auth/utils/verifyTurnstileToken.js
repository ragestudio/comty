import axios from "axios"

export default async (token) => {
	const secret = process.env.TURNSTILE_SECRET

	if (!secret) {
		throw new Error("Turnstile secret is not set")
	}

	let response = await axios({
		url: "https://challenges.cloudflare.com/turnstile/v0/siteverify",
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		data: {
			secret: secret,
			response: token,
		},
	}).catch((err) => {
		console.error(err.response.data)
		throw new Error("Turnstile verification failed")
	})

	return response.data
}
