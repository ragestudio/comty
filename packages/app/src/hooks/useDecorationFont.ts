import React from "react"

import {
	getFontFamilyName,
	getFontSource,
	isStylesheetFontUrl,
} from "@/utils/decoration"

type FontDecoration = {
	_id?: string
	obj_url?: string
	font_family?: string
}

const STYLE_ID_PREFIX = "comty-font"

const sanitize = (value: string) => value.replace(/["'\\\n\r]/g, "").trim()

const toStyleId = (value: string) => {
	let hash = 0

	for (let index = 0; index < value.length; index++) {
		hash = (hash * 31 + value.charCodeAt(index)) >>> 0
	}

	return hash.toString(36)
}

const isSafeUrl = (url: string) =>
	/^(https?:)?\/\//i.test(url) || url.startsWith("/")

const getFontFormat = (url: string) => {
	const clean = url.split("?")[0].split("#")[0].toLowerCase()

	if (clean.endsWith(".woff2")) return "woff2"
	if (clean.endsWith(".woff")) return "woff"
	if (clean.endsWith(".ttf")) return "truetype"
	if (clean.endsWith(".otf")) return "opentype"
	if (clean.endsWith(".eot")) return "embedded-opentype"

	return null
}

const buildFontFace = (url: string, family: string) => {
	const format = getFontFormat(url)
	const formatHint = format ? ` format("${format}")` : ""

	return `@font-face{font-family:"${family}";src:url("${url}")${formatHint};font-display:swap;}`
}

// loads the font once per decoration and returns the family name to apply
export const useDecorationFont = (decoration?: FontDecoration | null) => {
	const source = decoration ? getFontSource(decoration) : null
	const family = decoration ? getFontFamilyName(decoration) : null
	const decorationId = decoration?._id

	React.useEffect(() => {
		if (!source) return
		if (typeof document === "undefined") return

		const url = sanitize(source)

		if (!isSafeUrl(url)) return

		const stylesheet = isStylesheetFontUrl(url)

		if (!stylesheet && !family) return

		const styleId = `${STYLE_ID_PREFIX}-${toStyleId(
			`${decorationId ?? ""}-${family ?? url}`,
		)}`

		if (document.getElementById(styleId)) return

		const element = document.createElement("style")
		element.id = styleId
		element.textContent = stylesheet
			? `@import url("${url}");`
			: buildFontFace(url, sanitize(family as string))

		document.head.appendChild(element)
	}, [source, family, decorationId])

	return family ? sanitize(family) : undefined
}

export default useDecorationFont
