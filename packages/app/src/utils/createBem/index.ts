import type { ClassValue } from "clsx"

import clsx from "clsx"

export function createBem(blockName: string, styles: Record<string, string>) {
	const blockHelper = (...modifiers: ClassValue[]) => {
		const activeModifiers = clsx(modifiers).split(" ").filter(Boolean)

		const modifierClasses = activeModifiers.map(
			(mod) => styles[`${blockName}--${mod}`],
		)

		return clsx(styles[blockName], modifierClasses)
	}

	blockHelper.elem = (elementName: string, ...modifiers: ClassValue[]) => {
		const fullElemKey = `${blockName}__${elementName}`
		const activeModifiers = clsx(modifiers).split(" ").filter(Boolean)
		const modifierClasses = activeModifiers.map(
			(mod) => styles[`${fullElemKey}--${mod}`],
		)

		return clsx(styles[fullElemKey], modifierClasses)
	}

	return blockHelper
}

export default createBem
