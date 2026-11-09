import crypto from "node:crypto"

import type WebWrapper from "@/main"
import { DEFAULT_RELEASE_TAG_PREFIX } from "@lib/releases"

interface ReleaseWebhookPayload {
	action?: string
	release?: {
		tag_name?: string
	}
}

export default defineRoute<WebWrapper>()({
	useContexts: ["updateDistApp", "listenLiveDirectory"] as const,
	fn: async (req, res, ctx) => {
		const secret = process.env.WRAPPER_AUTO_UPDATE_KEY

		if (!secret) {
			throw new OperationError(500, "Auto update key is not set")
		}

		const bodyBuffer = await req.buffer()
		const requestSignature = Buffer.from(
			String(req.headers["x-hub-signature-256"] ?? ""),
			"utf8",
		)
		const hmac = crypto.createHmac("sha256", secret)
		const digest = Buffer.from(
			`sha256=${hmac.update(bodyBuffer).digest("hex")}`,
			"utf8",
		)

		if (
			requestSignature.length !== digest.length ||
			!crypto.timingSafeEqual(digest, requestSignature)
		) {
			return res.status(401).json({ error: "Invalid signature" })
		}

		const payload = req.body as ReleaseWebhookPayload

		if (payload.action !== "published") {
			return res.status(400).json({ error: "Invalid action" })
		}

		const tagName = payload.release?.tag_name

		if (!tagName?.startsWith(DEFAULT_RELEASE_TAG_PREFIX)) {
			console.log("[WEBHOOK] Ignoring non-web release", { tag: tagName })

			return res.status(200).json({ ok: true, ignored: true })
		}

		console.log("[WEBHOOK] Update app dist triggered", { tag: tagName })

		res.status(200).json({ ok: true })

		setTimeout(async () => {
			try {
				await ctx.updateDistApp()
				await ctx.listenLiveDirectory()
			} catch (error) {
				console.error("[WEBHOOK] Failed to update app dist:", error)
			}
		}, 30000)
	},
})
