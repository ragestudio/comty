import React, { ReactNode } from "react"
import createBem from "@/utils/createBem"

import styles from "./grid.module.less"

const b = createBem("grid", styles)

const getGridLayout = (count: number) => {
	if (count <= 1) return { cols: 1, rows: 1 }
	if (count === 2) return { cols: 2, rows: 1 }
	if (count <= 4) return { cols: 2, rows: 2 }
	if (count <= 6) return { cols: 3, rows: 2 }
	if (count <= 9) return { cols: 3, rows: 3 }
	if (count <= 16) return { cols: 4, rows: 4 }
	return { cols: 4, rows: Math.ceil(count / 4) }
}

export type TileModes = "grid" | "single" | "hero" | "preview"

export type GridItem<T extends Record<string, any> = any> = T & {
	id: string
}

export type RenderGridItem<T extends Record<string, any> = any> = (props: {
	item: GridItem<T>
	tileMode: TileModes
	toggleItemFocus: () => void
}) => ReactNode | null

export const Grid = ({
	items,
	renderItem,
}: {
	items: GridItem[]
	renderItem: RenderGridItem
}) => {
	const [selectedItemId, setSelectedItemId] = React.useState(null)

	const isSingleItem = items.length === 1
	const hasScroller = !isSingleItem && selectedItemId !== null

	const { cols, rows } = getGridLayout(items.length)

	const handleItemToggleFocus = React.useCallback((item) => {
		setSelectedItemId((current) => (current === item.id ? null : item.id))
	}, [])

	React.useEffect(() => {
		if (selectedItemId && !items.find((s) => s.id === selectedItemId)) {
			setSelectedItemId(null)
		}
	}, [items, selectedItemId])

	return (
		<div
			className={b({
				scroller: hasScroller,
				single: isSingleItem,
			})}
			style={{
				"--grid-cols": cols,
				"--grid-rows": rows,
			}}
		>
			{items.map((item) => {
				let tileMode: "grid" | "single" | "hero" | "preview" = "grid"

				if (isSingleItem) {
					tileMode = "single"
				} else if (hasScroller) {
					tileMode = item.id === selectedItemId ? "hero" : "preview"
				}

				return renderItem({
					item,
					tileMode,
					toggleItemFocus: () => handleItemToggleFocus(item),
				})
			})}
		</div>
	)
}

export default Grid
