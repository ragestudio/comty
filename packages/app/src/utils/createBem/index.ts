import type { ClassValue } from "clsx"

import clsx from "clsx"

export interface BemHelper {
	(...modifiers: ClassValue[]): string
	elem: (elementName: string, ...modifiers: ClassValue[]) => string
	sub: (elementName: string) => BemHelper
}

export function createBem(
	blockName: string,
	styles: Record<string, string>,
): BemHelper {
	const resolve = (key: string, modifiers: ClassValue[]) => {
		const activeModifiers = clsx(modifiers).split(" ").filter(Boolean)

		const modifierClasses = activeModifiers.map(
			(mod) => styles[`${key}--${mod}`],
		)

		return clsx(styles[key], modifierClasses)
	}

	const blockHelper: BemHelper = (...modifiers) =>
		resolve(blockName, modifiers)

	blockHelper.elem = (elementName, ...modifiers) =>
		resolve(`${blockName}__${elementName}`, modifiers)

	// helper for a sub block, so nested elements can be composed
	blockHelper.sub = (elementName) =>
		createBem(`${blockName}__${elementName}`, styles)

	return blockHelper
}

export default createBem
