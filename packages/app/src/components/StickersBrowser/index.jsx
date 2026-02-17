import React from "react"
import StickerRender from "@components/StickerRender"
import { Grid, AutoSizer } from "react-virtualized"
import StickersModel from "@models/stickers"

import "./index.less"

const STICKER_SIZE = 100
const STICKERS_PER_ROW = 5
const STICKERS_GAP = 5

const StickerCell = React.memo(({ sticker, style, onSelect }) => {
	if (!sticker) {
		return null
	}

	return (
		<div
			style={style}
			className="stickers-browser__items__pack__items__item"
		>
			<StickerRender
				sticker={sticker}
				onClick={() => onSelect(sticker)}
				onDoubleClick={() => null}
			/>
		</div>
	)
})

const StickersPackList = ({ pack, onSelect }) => {
	const packItemsHeight = React.useMemo(
		() =>
			Math.ceil(pack.items.length / STICKERS_PER_ROW) * STICKER_SIZE +
			STICKERS_GAP * Math.ceil(pack.items.length / STICKERS_PER_ROW),
		[pack],
	)

	const cellRenderer = React.useCallback(
		({ columnIndex, rowIndex, key, style }) => {
			console.debug("cellRender", {
				columnIndex,
				rowIndex,
				key,
				style,
			})

			const index = rowIndex * STICKERS_PER_ROW + columnIndex
			const sticker = pack.items[index]

			if (!sticker) {
				return null
			}

			return (
				<StickerCell
					key={sticker._id}
					sticker={sticker}
					style={style}
					onSelect={onSelect}
				/>
			)
		},
		[pack, onSelect],
	)

	if (!pack || !pack?.items?.length) {
		return null
	}

	return (
		<div className="stickers-browser__items__pack">
			<span className="stickers-browser__items__pack__name">
				{pack.name}
			</span>

			<div
				className="stickers-browser__items__pack__items"
				style={{
					height: packItemsHeight,
				}}
			>
				<AutoSizer disableHeight>
					{({ width }) => {
						return (
							<Grid
								columnCount={STICKERS_PER_ROW}
								columnWidth={STICKER_SIZE + STICKERS_GAP}
								rowCount={Math.ceil(
									pack.items.length / STICKERS_PER_ROW,
								)}
								rowHeight={STICKER_SIZE + STICKERS_GAP}
								height={packItemsHeight}
								width={width}
								overscanRowCount={1}
								cellRenderer={cellRenderer}
								useDynamicRowHeight
							/>
						)
					}}
				</AutoSizer>
			</div>
		</div>
	)
}

const StickersBrowser = ({ onClickItem, close }) => {
	const [isLoading, response, error] = app.cores.api.useRequest(
		StickersModel.getFavStickersSet,
	)

	const handleSelect = React.useCallback(
		(sticker) => {
			if (typeof onClickItem === "function") {
				onClickItem(sticker)
			}

			if (typeof close === "function") {
				close()
			}
		},
		[onClickItem, close],
	)

	if (error) {
		return (
			<div className="stickers-browser">
				<p>Error loading stickers</p>
				<span>{error.toString()}</span>
			</div>
		)
	}

	if (isLoading || !response) {
		return (
			<div className="stickers-browser">
				<p>Loading stickers...</p>
			</div>
		)
	}

	return (
		<div className="stickers-browser">
			<div className="stickers-browser__items">
				{response.items.map((pack) => (
					<StickersPackList
						key={pack.name}
						pack={pack}
						onSelect={handleSelect}
					/>
				))}
			</div>
		</div>
	)
}

export default StickersBrowser
