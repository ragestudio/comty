import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useDrawer } from "./index.jsx"

/**
 * Hook for managing drawer state with local persistence
 */
export const useDrawerState = (drawerId, initialOptions = {}) => {
	const drawer = useDrawer()
	const [isOpen, setIsOpen] = useState(false)
	const [options, setOptions] = useState(initialOptions)
	const optionsRef = useRef(options)

	useEffect(() => {
		optionsRef.current = options
	}, [options])

	const open = useCallback(
		(component, newOptions = {}) => {
			const mergedOptions = { ...optionsRef.current, ...newOptions }
			setOptions(mergedOptions)
			setIsOpen(true)
			drawer.open(drawerId, component, mergedOptions)
		},
		[drawer, drawerId],
	)

	const close = useCallback(
		(params = {}) => {
			setIsOpen(false)
			drawer.close(drawerId, params)
		},
		[drawer, drawerId],
	)

	const toggle = useCallback(
		(component, newOptions = {}) => {
			if (isOpen) {
				close()
			} else {
				open(component, newOptions)
			}
		},
		[isOpen, open, close],
	)

	const updateOptions = useCallback((newOptions) => {
		setOptions((prev) => ({ ...prev, ...newOptions }))
	}, [])

	return {
		isOpen,
		options,
		open,
		close,
		toggle,
		updateOptions,
	}
}

/**
 * Hook for managing drawer queues and sequences
 */
export const useDrawerQueue = () => {
	const drawer = useDrawer()
	const [queue, setQueue] = useState([])
	const [currentIndex, setCurrentIndex] = useState(-1)
	const isProcessing = useRef(false)

	const addToQueue = useCallback((id, component, options = {}) => {
		setQueue((prev) => [...prev, { id, component, options }])
	}, [])

	const processNext = useCallback(async () => {
		if (isProcessing.current) return

		isProcessing.current = true

		const nextIndex = currentIndex + 1
		if (nextIndex < queue.length) {
			const item = queue[nextIndex]
			setCurrentIndex(nextIndex)

			// Close previous drawer if exists
			if (currentIndex >= 0) {
				const prevItem = queue[currentIndex]
				await new Promise((resolve) => {
					drawer.close(prevItem.id, { transition: 200 })
					setTimeout(resolve, 200)
				})
			}

			// Open next drawer
			drawer.open(item.id, item.component, {
				...item.options,
				onClose: () => {
					item.options.onClose?.()
					processNext()
				},
			})
		}

		isProcessing.current = false
	}, [currentIndex, queue, drawer])

	const processPrevious = useCallback(async () => {
		if (isProcessing.current || currentIndex <= 0) return

		isProcessing.current = true

		const prevIndex = currentIndex - 1
		const currentItem = queue[currentIndex]
		const prevItem = queue[prevIndex]

		// Close current drawer
		await new Promise((resolve) => {
			drawer.close(currentItem.id, { transition: 200 })
			setTimeout(resolve, 200)
		})

		// Open previous drawer
		setCurrentIndex(prevIndex)
		drawer.open(prevItem.id, prevItem.component, prevItem.options)

		isProcessing.current = false
	}, [currentIndex, queue, drawer])

	const clearQueue = useCallback(() => {
		setQueue([])
		setCurrentIndex(-1)
		drawer.closeAll()
	}, [drawer])

	const startQueue = useCallback(() => {
		if (queue.length > 0) {
			setCurrentIndex(-1)
			processNext()
		}
	}, [queue, processNext])

	return {
		queue,
		currentIndex,
		addToQueue,
		processNext,
		processPrevious,
		clearQueue,
		startQueue,
		hasNext: currentIndex < queue.length - 1,
		hasPrevious: currentIndex > 0,
	}
}

/**
 * Hook for form handling in drawers
 */
export const useDrawerForm = (drawerId, initialData = {}) => {
	const drawerState = useDrawerState(drawerId)
	const [formData, setFormData] = useState(initialData)
	const [errors, setErrors] = useState({})
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [isDirty, setIsDirty] = useState(false)

	const updateField = useCallback(
		(field, value) => {
			setFormData((prev) => ({ ...prev, [field]: value }))
			setIsDirty(true)

			// Clear field error when user starts typing
			if (errors[field]) {
				setErrors((prev) => ({ ...prev, [field]: null }))
			}
		},
		[errors],
	)

	const setFieldError = useCallback((field, error) => {
		setErrors((prev) => ({ ...prev, [field]: error }))
	}, [])

	const clearErrors = useCallback(() => {
		setErrors({})
	}, [])

	const reset = useCallback(() => {
		setFormData(initialData)
		setErrors({})
		setIsDirty(false)
		setIsSubmitting(false)
	}, [initialData])

	const openForm = useCallback(
		(component, options = {}) => {
			const formOptions = {
				...options,
				confirmOnOutsideClick: isDirty,
				confirmOnOutsideClickText:
					"You have unsaved changes. Are you sure you want to close?",
				onClose: () => {
					if (
						isDirty &&
						!window.confirm(
							"You have unsaved changes. Are you sure you want to close?",
						)
					) {
						return false
					}
					reset()
					options.onClose?.()
				},
			}

			drawerState.open(component, formOptions)
		},
		[drawerState, isDirty, reset],
	)

	const submit = useCallback(
		async (submitFn, options = {}) => {
			const { validate, onSuccess, onError } = options

			setIsSubmitting(true)
			clearErrors()

			try {
				// Run validation if provided
				if (validate) {
					const validationErrors = await validate(formData)
					if (
						validationErrors &&
						Object.keys(validationErrors).length > 0
					) {
						setErrors(validationErrors)
						setIsSubmitting(false)
						return { success: false, errors: validationErrors }
					}
				}

				// Submit form
				const result = await submitFn(formData)

				// Handle success
				setIsDirty(false)
				onSuccess?.(result)
				drawerState.close()

				return { success: true, data: result }
			} catch (error) {
				const errorMessage = error.message || "An error occurred"
				setErrors({ _global: errorMessage })
				onError?.(error)

				return { success: false, error: errorMessage }
			} finally {
				setIsSubmitting(false)
			}
		},
		[formData, drawerState, clearErrors],
	)

	return {
		...drawerState,
		formData,
		errors,
		isSubmitting,
		isDirty,
		updateField,
		setFieldError,
		clearErrors,
		reset,
		openForm,
		submit,
	}
}

/**
 * Hook for keyboard shortcuts in drawers
 */
export const useDrawerKeyboard = (shortcuts = {}) => {
	const drawer = useDrawer()

	useEffect(() => {
		const handleKeyDown = (event) => {
			// Only handle shortcuts when drawers are open
			if (drawer.drawersLength() === 0) return

			const key = event.key.toLowerCase()
			const ctrlKey = event.ctrlKey || event.metaKey
			const altKey = event.altKey
			const shiftKey = event.shiftKey

			// Build shortcut key combination
			let combination = ""
			if (ctrlKey) combination += "ctrl+"
			if (altKey) combination += "alt+"
			if (shiftKey) combination += "shift+"
			combination += key

			// Execute shortcut if found
			const shortcut = shortcuts[combination]
			if (shortcut) {
				event.preventDefault()
				event.stopPropagation()
				shortcut(event)
			}
		}

		document.addEventListener("keydown", handleKeyDown)

		return () => {
			document.removeEventListener("keydown", handleKeyDown)
		}
	}, [shortcuts, drawer])

	return {
		addShortcut: useCallback(
			(key, handler) => {
				shortcuts[key] = handler
			},
			[shortcuts],
		),

		removeShortcut: useCallback(
			(key) => {
				delete shortcuts[key]
			},
			[shortcuts],
		),
	}
}

/**
 * Hook for drawer animations and transitions
 */
export const useDrawerAnimation = (options = {}) => {
	const { duration = 300, easing = "ease-out", stagger = 100 } = options

	const [isAnimating, setIsAnimating] = useState(false)

	const createVariants = useCallback((position = "left") => {
		const slideDirection = position === "right" ? 100 : -100

		return {
			initial: {
				x: slideDirection,
				opacity: 0,
				scale: 0.95,
			},
			animate: {
				x: 0,
				opacity: 1,
				scale: 1,
			},
			exit: {
				x: slideDirection,
				opacity: 0,
				scale: 0.95,
			},
		}
	}, [])

	const createTransition = useCallback(
		(delay = 0) => ({
			type: "spring",
			stiffness: 100,
			damping: 20,
			duration: duration / 1000,
			delay: delay / 1000,
		}),
		[duration],
	)

	const staggeredTransition = useCallback(
		(index = 0) => createTransition(index * stagger),
		[createTransition, stagger],
	)

	const animateSequence = useCallback(
		async (animations) => {
			setIsAnimating(true)

			for (let i = 0; i < animations.length; i++) {
				const animation = animations[i]
				await new Promise((resolve) => {
					setTimeout(() => {
						animation()
						resolve()
					}, i * stagger)
				})
			}

			setTimeout(() => setIsAnimating(false), duration)
		},
		[stagger, duration],
	)

	return {
		isAnimating,
		createVariants,
		createTransition,
		staggeredTransition,
		animateSequence,
	}
}

/**
 * Hook for drawer persistence (localStorage)
 */
export const useDrawerPersistence = (key, initialState = {}) => {
	const [state, setState] = useState(() => {
		try {
			const item = localStorage.getItem(`drawer_${key}`)
			return item ? JSON.parse(item) : initialState
		} catch {
			return initialState
		}
	})

	const updateState = useCallback(
		(newState) => {
			setState(newState)
			try {
				localStorage.setItem(`drawer_${key}`, JSON.stringify(newState))
			} catch (error) {
				console.warn(
					"Failed to save drawer state to localStorage:",
					error,
				)
			}
		},
		[key],
	)

	const clearState = useCallback(() => {
		setState(initialState)
		try {
			localStorage.removeItem(`drawer_${key}`)
		} catch (error) {
			console.warn(
				"Failed to clear drawer state from localStorage:",
				error,
			)
		}
	}, [key, initialState])

	return [state, updateState, clearState]
}

/**
 * Hook for drawer accessibility features
 */
export const useDrawerAccessibility = (options = {}) => {
	const { trapFocus = true, autoFocus = true, restoreFocus = true } = options

	const previousActiveElement = useRef(null)
	const drawerRef = useRef(null)

	const setupAccessibility = useCallback(() => {
		// Store the currently focused element
		if (restoreFocus) {
			previousActiveElement.current = document.activeElement
		}

		// Auto focus the drawer
		if (autoFocus && drawerRef.current) {
			const firstFocusable = drawerRef.current.querySelector(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
			)
			if (firstFocusable) {
				firstFocusable.focus()
			}
		}

		// Set up focus trap
		if (trapFocus) {
			const handleTabKey = (e) => {
				if (e.key !== "Tab" || !drawerRef.current) return

				const focusableElements = drawerRef.current.querySelectorAll(
					'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
				)

				const firstElement = focusableElements[0]
				const lastElement =
					focusableElements[focusableElements.length - 1]

				if (e.shiftKey) {
					if (document.activeElement === firstElement) {
						lastElement.focus()
						e.preventDefault()
					}
				} else {
					if (document.activeElement === lastElement) {
						firstElement.focus()
						e.preventDefault()
					}
				}
			}

			document.addEventListener("keydown", handleTabKey)
			return () => document.removeEventListener("keydown", handleTabKey)
		}
	}, [trapFocus, autoFocus, restoreFocus])

	const cleanupAccessibility = useCallback(() => {
		// Restore focus to previous element
		if (restoreFocus && previousActiveElement.current) {
			previousActiveElement.current.focus()
		}
	}, [restoreFocus])

	return {
		drawerRef,
		setupAccessibility,
		cleanupAccessibility,
	}
}
