import { type GridItem } from "./constants"

export const idOf = (item: GridItem) => {
	if (item.kind === "local") return "local"
	if (item.kind === "screen") return `screen:${item.screen.userId}`
	return `client:${item.client.userId}`
}

export const columnsFor = (count: number) => {
	if (count <= 2) return 1
	if (count <= 4) return 2
	return 3
}

export const chunkRows = <T = any,>(items: T[], size: number): T[][] => {
	const rows: T[][] = []

	for (let index = 0; index < items.length; index += size) {
		rows.push(items.slice(index, index + size))
	}

	return rows
}
