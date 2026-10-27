import React from "react"
import { useOnInView } from "react-intersection-observer"

interface UseChatScrollOptions {
	channelKey: string
	initialLoading: boolean
	loading: boolean
	loadingAfter: boolean
	afterLoadVersion: number
	hasMoreBefore: boolean
	timelineLength: number
	newestMessageId?: string
	onLoadBefore: () => void
	onLoadAfter: () => void
	onPausedChange?: (paused: boolean) => void
}

const MAX_AUTO_LOADS = 10

const useTriggerValue = (callback: () => void) => {
	const prevValueRef = React.useRef(false)
	const callbackRef = React.useRef(callback)

	callbackRef.current = callback

	return React.useCallback((value: boolean) => {
		if (value === true && prevValueRef.current === false) {
			callbackRef.current()
		}

		prevValueRef.current = value
	}, [])
}

export default function useChatScroll({
	channelKey,
	initialLoading,
	loading,
	loadingAfter,
	afterLoadVersion,
	hasMoreBefore,
	timelineLength,
	newestMessageId,
	onLoadBefore,
	onLoadAfter,
	onPausedChange,
}: UseChatScrollOptions) {
	const timelineRef = React.useRef<HTMLDivElement>(null)
	const [timelineRoot, setTimelineRoot] =
		React.useState<HTMLDivElement | null>(null)
	const [showScrollToBottom, setShowScrollToBottom] = React.useState(false)

	const showScrollToBottomRef = React.useRef(showScrollToBottom)
	showScrollToBottomRef.current = showScrollToBottom

	const loadingAfterRef = React.useRef(loadingAfter)
	loadingAfterRef.current = loadingAfter

	const afterLoadVersionRef = React.useRef(afterLoadVersion)

	const hasInitialScrolledRef = React.useRef(false)
	const bottomDebounceRef = React.useRef<ReturnType<
		typeof setTimeout
	> | null>(null)

	const setTimelineRef = React.useCallback((node: HTMLDivElement | null) => {
		timelineRef.current = node
		setTimelineRoot((previous) => (previous === node ? previous : node))
	}, [])

	const scrollToBottom = React.useCallback(() => {
		const element = timelineRef.current
		if (!element) return

		showScrollToBottomRef.current = false
		setShowScrollToBottom(false)
		onPausedChange?.(false)
		element.scrollTo(0, 0)
	}, [onPausedChange])

	const bottomTrigger = useTriggerValue(onLoadAfter)
	const topTrigger = useTriggerValue(onLoadBefore)

	const bottomTriggerRef = React.useRef(bottomTrigger)
	bottomTriggerRef.current = bottomTrigger

	const lastAutoLoadLengthRef = React.useRef<number | null>(null)
	const autoLoadCountRef = React.useRef(0)

	const handleTopTrigger = React.useCallback(
		(inView: boolean) => topTrigger(inView),
		[topTrigger],
	)

	const topObserverOptions = React.useMemo(
		() => ({ root: timelineRoot }),
		[timelineRoot],
	)

	const topTriggerRef = useOnInView(handleTopTrigger, topObserverOptions)

	const isTopTriggerVisible = React.useCallback(() => {
		const container = timelineRef.current
		if (!container) return false

		const trigger = container.querySelector<HTMLElement>(
			"[data-chat-top-trigger]",
		)

		if (!trigger) return false

		const containerRect = container.getBoundingClientRect()
		const triggerRect = trigger.getBoundingClientRect()

		if (containerRect.height === 0) return false

		return (
			triggerRect.bottom >= containerRect.top &&
			triggerRect.top <= containerRect.bottom
		)
	}, [])

	// keep loading older pages while the top sentinel is still visible, this
	// fills the viewport when the first page is not enough. only run once per
	// timeline length so a page without new messages cannot loop forever
	React.useEffect(() => {
		if (initialLoading || loading) return
		if (!hasMoreBefore) return
		if (!isTopTriggerVisible()) return
		if (lastAutoLoadLengthRef.current === timelineLength) return
		if (autoLoadCountRef.current >= MAX_AUTO_LOADS) return

		lastAutoLoadLengthRef.current = timelineLength
		autoLoadCountRef.current += 1

		onLoadBefore()
	}, [
		initialLoading,
		loading,
		hasMoreBefore,
		timelineLength,
		onLoadBefore,
		isTopTriggerVisible,
	])

	React.useEffect(() => {
		hasInitialScrolledRef.current = false
		showScrollToBottomRef.current = false
		lastAutoLoadLengthRef.current = null
		autoLoadCountRef.current = 0
		afterLoadVersionRef.current = afterLoadVersion
		setShowScrollToBottom(false)
	}, [channelKey])

	React.useEffect(() => {
		if (initialLoading || timelineLength === 0) return
		if (hasInitialScrolledRef.current) return

		hasInitialScrolledRef.current = true

		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				timelineRef.current?.scrollTo(0, 0)
			})
		})
	}, [initialLoading, timelineLength])

	const previousNewestRef = React.useRef<string | undefined>(newestMessageId)

	React.useEffect(() => {
		previousNewestRef.current = newestMessageId
	}, [channelKey])

	// scroll to the newest message when it changes and the user is already at
	// the bottom, otherwise keep their position and show the jump button
	React.useEffect(() => {
		const afterLoadFinished =
			afterLoadVersionRef.current !== afterLoadVersion
		afterLoadVersionRef.current = afterLoadVersion

		const previous = previousNewestRef.current
		previousNewestRef.current = newestMessageId

		if (!previous || newestMessageId === previous) return
		if (loadingAfter || afterLoadFinished) return
		if (!hasInitialScrolledRef.current) return
		if (showScrollToBottomRef.current) return

		scrollToBottom()
	}, [newestMessageId, loadingAfter, afterLoadVersion, scrollToBottom])

	const handleOnScroll = React.useCallback(() => {
		const element = timelineRef.current
		if (!element) return

		const isOnBottom = Math.abs(element.scrollTop) < 100

		if (isOnBottom) {
			if (bottomDebounceRef.current) {
				clearTimeout(bottomDebounceRef.current)
			}

			bottomDebounceRef.current = setTimeout(() => {
				if (loadingAfterRef.current) return

				bottomTriggerRef.current(true)
			}, 300)

			if (showScrollToBottomRef.current) {
				showScrollToBottomRef.current = false
				setShowScrollToBottom(false)
				onPausedChange?.(false)
			}

			return
		}

		if (bottomDebounceRef.current) {
			clearTimeout(bottomDebounceRef.current)
			bottomDebounceRef.current = null
		}

		bottomTriggerRef.current(false)

		if (!showScrollToBottomRef.current) {
			showScrollToBottomRef.current = true
			setShowScrollToBottom(true)
			onPausedChange?.(true)
		}
	}, [onPausedChange])

	React.useEffect(() => {
		if (initialLoading) return

		const element = timelineRef.current
		if (!element) return

		element.addEventListener("scroll", handleOnScroll, { passive: true })

		return () => {
			element.removeEventListener("scroll", handleOnScroll)

			if (bottomDebounceRef.current) {
				clearTimeout(bottomDebounceRef.current)
				bottomDebounceRef.current = null
			}
		}
	}, [initialLoading, handleOnScroll, timelineRoot])

	const scrollToMessage = React.useCallback((messageId: string) => {
		const container = timelineRef.current
		if (!container) return false

		const targetEl = container.querySelector<HTMLElement>(
			`[data-message-id="${messageId}"]`,
		)

		if (!targetEl) return false

		let applied = false
		let observer: IntersectionObserver | null = null
		let cleanupTimeout: ReturnType<typeof setTimeout> | null = null

		function cleanup() {
			observer?.disconnect()
			observer = null

			if (cleanupTimeout) {
				clearTimeout(cleanupTimeout)
				cleanupTimeout = null
			}

			targetEl.removeEventListener("animationend", onAnimationEnd)
		}

		function scheduleCleanup(delay: number) {
			if (cleanupTimeout) clearTimeout(cleanupTimeout)

			cleanupTimeout = setTimeout(cleanup, delay)
		}

		function onAnimationEnd() {
			targetEl.classList.remove("channel-chat__timeline__line--highlight")
			cleanup()
		}

		const applyHighlight = () => {
			if (applied) return
			applied = true

			targetEl.addEventListener("animationend", onAnimationEnd)
			targetEl.classList.add("channel-chat__timeline__line--highlight")

			scheduleCleanup(2500)
		}

		observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0]
				if (entry && entry.isIntersecting) {
					observer?.disconnect()
					observer = null
					applyHighlight()
				}
			},
			{ root: container, threshold: 0.6 },
		)

		observer.observe(targetEl)

		// do not leave the observer alive if the target never becomes visible
		scheduleCleanup(3000)

		targetEl.scrollIntoView({ behavior: "smooth", block: "center" })

		return true
	}, [])

	return {
		timelineRef,
		setTimelineRef,
		topTriggerRef,
		showScrollToBottom,
		scrollToBottom,
		scrollToMessage,
	}
}
