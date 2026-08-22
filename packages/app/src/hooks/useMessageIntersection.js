import { useEffect, useRef } from "react"

export default function useMessageIntersection({
	messageId,
	onAck,
	threshold = 0.5,
	delayMs = 5000,
}) {
	const ref = useRef(null)
	const timeoutRef = useRef(null)

	useEffect(() => {
		if (typeof onAck !== "function") return

		const element = ref.current
		if (!element) return

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					if (!timeoutRef.current) {
						timeoutRef.current = setTimeout(() => {
							onAck(messageId)
							timeoutRef.current = null
							observer.unobserve(element)
						}, delayMs)
					}
				} else {
					if (timeoutRef.current) {
						clearTimeout(timeoutRef.current)
						timeoutRef.current = null
					}
				}
			},
			{
				threshold,
			},
		)

		observer.observe(element)

		return () => {
			if (element) {
				observer.unobserve(element)
			}
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current)
				timeoutRef.current = null
			}
		}
	}, [messageId, onAck, threshold, delayMs])

	return ref
}
