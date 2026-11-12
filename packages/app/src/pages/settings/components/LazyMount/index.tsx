import React from "react"

interface LazyMountProps {
	children: React.ReactNode
	placeholder?: React.ReactNode
	rootMargin?: string
	className?: string
}

const LazyMount: React.FC<LazyMountProps> = ({
	children,
	placeholder = null,
	rootMargin = "200px",
	className,
}) => {
	const [mounted, setMounted] = React.useState(false)
	const ref = React.useRef<HTMLDivElement>(null)

	React.useEffect(() => {
		if (mounted) return

		const element = ref.current

		if (!element) return

		if (typeof IntersectionObserver === "undefined") {
			setMounted(true)
			return
		}

		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries.some((entry) => entry.isIntersecting)) return

				setMounted(true)
				observer.disconnect()
			},
			{
				rootMargin,
			},
		)

		observer.observe(element)

		return () => observer.disconnect()
	}, [mounted, rootMargin])

	return (
		<div
			ref={ref}
			className={className}
		>
			{mounted ? children : placeholder}
		</div>
	)
}

export default LazyMount
