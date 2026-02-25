import crypto from "node:crypto"

export default {
	fn: async (req, res, ctx) => {
		if (!process.env.WRAPPER_AUTO_UPDATE_KEY) {
			throw new OperationError(500, "Auto update key is not set")
		}

		const bodyBuff = await req.buffer()

		const requestSignature = Buffer.from(
			req.headers["x-hub-signature-256"] || "",
			"utf8",
		)
		const hmac = crypto.createHmac(
			"sha256",
			process.env.WRAPPER_AUTO_UPDATE_KEY,
		)
		const digest = Buffer.from(
			"sha256" + "=" + hmac.update(bodyBuff).digest("hex"),
			"utf8",
		)

		// if signatures not match, return error
		if (
			requestSignature.length !== digest.length ||
			!crypto.timingSafeEqual(digest, requestSignature)
		) {
			return res.status(401).json({ error: "Invalid signature" })
		}

		if (req.body.action !== "published") {
			return res.status(400).json({ error: "Invalid action" })
		}

		// return ok and schedule update for the 30 seconds
		console.log("[WEBHOOK] Update app dist triggered >", {
			sig: req.headers["x-hub-signature-256"],
		})

		res.status(200).json({ ok: true })

		setTimeout(async () => {
			await ctx.updateDistApp()
			await ctx.listenLiveDirectory()
		}, 30000)
	},
}
