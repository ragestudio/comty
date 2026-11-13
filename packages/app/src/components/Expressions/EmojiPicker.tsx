import React from "react"
import { Empty, Input, Select, Skeleton } from "antd"
import { useVirtualizer } from "@tanstack/react-virtual"

import { Icons } from "@components/Icons"

import "./EmojiPicker.less"

const ALL_GROUPS = "all"
const GRID_GAP = 5
const MIN_CELL_SIZE = 30
const MAX_COLUMNS = 10

type EmojiEntry = {
	emoji: string
	name: string
	slug: string
}

type EmojiGroup = {
	name: string
	slug: string
	emojis: EmojiEntry[]
}

type GroupOption = {
	label: string
	value: string
}

type EmojiListProps = {
	emojis: EmojiEntry[]
	resetKey: string
	onSelect: (emoji: string) => void
}

type EmojiPickerProps = {
	injectChar?: (emoji: string) => void
	close?: () => void
}

let emojisCache: EmojiGroup[] | null = null

const normalizeQuery = (value: string) => value.trim().toLowerCase()

function EmojiListBase({ emojis, resetKey, onSelect }: EmojiListProps) {
	const listRef = React.useRef<HTMLDivElement | null>(null)
	const [listWidth, setListWidth] = React.useState(0)

	const columns = React.useMemo(() => {
		if (listWidth <= 0) return MAX_COLUMNS

		return Math.max(
			4,
			Math.min(
				MAX_COLUMNS,
				Math.floor((listWidth + GRID_GAP) / (MIN_CELL_SIZE + GRID_GAP)),
			),
		)
	}, [listWidth])

	const cellSize = React.useMemo(() => {
		if (listWidth <= 0) return MIN_CELL_SIZE

		return Math.max(
			MIN_CELL_SIZE,
			Math.floor((listWidth - (columns - 1) * GRID_GAP) / columns),
		)
	}, [listWidth, columns])

	const rowHeight = cellSize + GRID_GAP
	const rowCount = Math.ceil(emojis.length / columns)

	const getScrollElement = React.useCallback(() => listRef.current, [])
	const estimateSize = React.useCallback(() => rowHeight, [rowHeight])

	const virtualizer = useVirtualizer<HTMLDivElement, HTMLDivElement>({
		count: rowCount,
		getScrollElement,
		estimateSize,
		overscan: 3,
	})

	React.useLayoutEffect(() => {
		const node = listRef.current

		if (!node) return undefined

		const observer = new ResizeObserver(() => {
			setListWidth(node.clientWidth)
		})

		observer.observe(node)
		setListWidth(node.clientWidth)

		return () => observer.disconnect()
	}, [])

	React.useEffect(() => {
		virtualizer.measure()
	}, [rowHeight, columns, virtualizer])

	React.useEffect(() => {
		listRef.current?.scrollTo({ top: 0 })
	}, [resetKey])

	const handleListClick = React.useCallback(
		(event: React.MouseEvent<HTMLDivElement>) => {
			const target = event.target

			if (!(target instanceof Element)) return

			const item = target.closest(".emoji-picker__item")

			if (!item) return

			const emoji = item.getAttribute("data-emoji")

			if (emoji) onSelect(emoji)
		},
		[onSelect],
	)

	return (
		<div
			ref={listRef}
			className="emoji-picker__list"
			onClick={handleListClick}
		>
			{rowCount === 0 ? (
				<div className="emoji-picker__empty">
					<Empty
						image={Empty.PRESENTED_IMAGE_SIMPLE}
						description="No emojis found"
					/>
				</div>
			) : (
				<div
					className="emoji-picker__virtual"
					style={{
						height: virtualizer.getTotalSize(),
					}}
				>
					{virtualizer.getVirtualItems().map((virtualRow) => {
						const start = virtualRow.index * columns
						const rowEmojis = emojis.slice(start, start + columns)

						return (
							<div
								key={virtualRow.key}
								className="emoji-picker__row"
								style={{
									height: cellSize,
									transform: `translateY(${virtualRow.start}px)`,
								}}
							>
								{rowEmojis.map((entry) => (
									<span
										key={entry.emoji}
										className="emoji-picker__item"
										title={entry.name}
										data-emoji={entry.emoji}
										style={{
											width: cellSize,
											height: cellSize,
										}}
									>
										{entry.emoji}
									</span>
								))}
							</div>
						)
					})}
				</div>
			)}
		</div>
	)
}

const EmojiList = React.memo(EmojiListBase)

const EmojiPicker = ({ injectChar, close }: EmojiPickerProps) => {
	const [groups, setGroups] = React.useState<EmojiGroup[]>(emojisCache ?? [])
	const [loading, setLoading] = React.useState(!emojisCache)
	const [query, setQuery] = React.useState("")
	const [groupSlug, setGroupSlug] = React.useState(ALL_GROUPS)

	const deferredQuery = React.useDeferredValue(query)

	const fetchEmojis = React.useCallback(async () => {
		if (emojisCache) return

		try {
			const response = await fetch("/emojis-groups.json")
			const payload = (await response.json()) as {
				groups?: EmojiGroup[]
			}
			const nextGroups = Array.isArray(payload.groups)
				? payload.groups
				: []

			emojisCache = nextGroups
			setGroups(nextGroups)
		} catch (error) {
			console.error("Failed to load emojis", error)
		} finally {
			setLoading(false)
		}
	}, [])

	const groupOptions = React.useMemo<GroupOption[]>(() => {
		return [
			{ label: "All groups", value: ALL_GROUPS },
			...groups.map((group) => ({
				label: group.name,
				value: group.slug,
			})),
		]
	}, [groups])

	const allEmojis = React.useMemo(() => {
		return groups.flatMap((group) => group.emojis)
	}, [groups])

	const groupEmojis = React.useMemo(() => {
		if (groupSlug === ALL_GROUPS) return allEmojis

		const group = groups.find((entry) => entry.slug === groupSlug)

		return group?.emojis ?? []
	}, [groups, groupSlug, allEmojis])

	const filteredEmojis = React.useMemo(() => {
		const search = normalizeQuery(deferredQuery)

		if (!search) return groupEmojis

		const slugSearch = search.replace(/\s+/g, "_")

		return groupEmojis.filter((entry) => {
			return (
				entry.name.toLowerCase().includes(search) ||
				entry.slug.includes(slugSearch)
			)
		})
	}, [groupEmojis, deferredQuery])

	const resetKey = `${groupSlug}:${deferredQuery}`

	const handleClickItem = React.useCallback(
		(emoji: string) => {
			if (typeof injectChar === "function") {
				injectChar(emoji)
			}

			if (typeof close === "function") {
				close()
			}
		},
		[injectChar, close],
	)

	const handleSearchChange = React.useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			setQuery(event.target.value)
		},
		[],
	)

	const handleGroupChange = React.useCallback((value: string) => {
		setGroupSlug(value)
	}, [])

	React.useEffect(() => {
		fetchEmojis()
	}, [fetchEmojis])

	if (loading) {
		return (
			<div className="emoji-picker">
				<Skeleton active />
			</div>
		)
	}

	return (
		<div className="emoji-picker">
			<div className="emoji-picker__toolbar">
				<Input
					value={query}
					onChange={handleSearchChange}
					placeholder="Search emojis"
					allowClear
					prefix={<Icons.Search />}
				/>

				<Select
					className="emoji-picker__group"
					value={groupSlug}
					onChange={handleGroupChange}
					options={groupOptions}
					popupMatchSelectWidth={false}
					getPopupContainer={(trigger) =>
						(trigger.closest(
							".popover-content",
						) as HTMLElement | null) ??
						trigger.parentElement ??
						document.body
					}
				/>
			</div>

			<EmojiList
				emojis={filteredEmojis}
				resetKey={resetKey}
				onSelect={handleClickItem}
			/>
		</div>
	)
}

export default EmojiPicker
