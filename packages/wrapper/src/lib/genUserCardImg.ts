import fetchUserData from "@lib/fetchUserData"
import sharp from "sharp"

const OG_WIDTH = 1200
const OG_HEIGHT = 630

export default async (
	user_id: string,
	{ logoFile }: { logoFile?: string } = {},
) => {
	if (typeof user_id !== "string") {
		return null
	}

	const user = await fetchUserData(user_id)

	const avatar = await fetch(user.avatar)

	if (!avatar.ok) {
		throw new Error(`Failed to fetch user avatar: ${avatar.status}`)
	}

	const avatarBuff = await avatar.arrayBuffer()

	const svgText = `
					<svg width="${OG_WIDTH}" height="${OG_HEIGHT}">
							<style>
									.title { fill: white; font-size: 80px; font-family: sans-serif; font-weight: bold; }
									.domain { fill: #ddd; font-size: 40px; font-family: sans-serif; }
							</style>
							<text x="50%" y="50%" text-anchor="middle" class="title">@${user.username}</text>
							<text x="50%" y="90%" text-anchor="middle" class="domain">https://comty.app</text>
					</svg>`

	const overlayDark = Buffer.from(
		`<svg><rect x="0" y="0" width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="black" opacity="0.5"/></svg>`,
	)

	const compositions: sharp.OverlayOptions[] = [
		{
			input: overlayDark,
			blend: "over" as sharp.Blend,
		},
		{
			input: Buffer.from(svgText),
			blend: "over" as sharp.Blend,
		},
	]

	if (logoFile) {
		const logoBuffer = await sharp(Buffer.from(logoFile))
			.resize(100, 100)
			.toBuffer()

		compositions.push({
			input: logoBuffer,
			gravity: "northwest",
			top: 50,
			left: 50,
			blend: "over" as sharp.Blend,
		})
	}

	return await sharp(Buffer.from(avatarBuff))
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
