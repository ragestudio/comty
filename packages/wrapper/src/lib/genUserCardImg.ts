import sharp, { type OverlayOptions } from "sharp"

import type { ComtyUser } from "../types"

const OG_WIDTH = 1200
const OG_HEIGHT = 630

export interface GenUserCardOptions {
	logoFile?: Buffer | string
}

const XML_ENTITIES: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&apos;",
}

function escapeXml(value: string) {
	return value.replace(/[&<>"']/g, (character) => XML_ENTITIES[character])
}

export default async function genUserCardImg(
	user: ComtyUser,
	{ logoFile }: GenUserCardOptions = {},
): Promise<Buffer> {
	if (!user.avatar) {
		throw new Error(`Missing avatar for user: ${user.username}`)
	}

	const avatar = await fetch(user.avatar, {
		signal: AbortSignal.timeout(10_000),
	})

	if (!avatar.ok) {
		throw new Error(`Failed to fetch user avatar: ${avatar.status}`)
	}

	const avatarBuffer = Buffer.from(await avatar.arrayBuffer())

	const svgText = `
		<svg width="${OG_WIDTH}" height="${OG_HEIGHT}">
			<style>
				.title { fill: white; font-size: 80px; font-family: sans-serif; font-weight: bold; }
				.domain { fill: #ddd; font-size: 40px; font-family: sans-serif; }
			</style>
			<text x="50%" y="50%" text-anchor="middle" class="title">@${escapeXml(user.username)}</text>
			<text x="50%" y="90%" text-anchor="middle" class="domain">https://comty.app</text>
		</svg>`

	const overlayDark = Buffer.from(
		`<svg><rect x="0" y="0" width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="black" opacity="0.5"/></svg>`,
	)

	const compositions: OverlayOptions[] = [
		{
			input: overlayDark,
			blend: "over",
		},
		{
			input: Buffer.from(svgText),
			blend: "over",
		},
	]

	if (logoFile) {
		const logoBuffer = await sharp(logoFile).resize(100, 100).toBuffer()

		compositions.push({
			input: logoBuffer,
			gravity: "northwest",
			top: 50,
			left: 50,
			blend: "over",
		})
	}

	return await sharp(avatarBuffer)
		.resize({
			width: OG_WIDTH,
			height: OG_HEIGHT,
			fit: "cover",
			position: "center",
		})
		.composite(compositions)
		.jpeg({
			quality: 70,
		})
		.toBuffer()
}
