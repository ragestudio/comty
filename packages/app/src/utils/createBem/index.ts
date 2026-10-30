import type { ClassValue } from "clsx"

import clsx from "clsx"

export function createBem(blockName: string) {
	return (...modifiers: ClassValue[]) => {
		const activeModifiers = clsx(modifiers).split(" ").filter(Boolean)

		const prefixedModifiers = activeModifiers.map(
			(mod) => `${blockName}--${mod}`,
		)

		return [blockName, ...prefixedModifiers].join(" ")
	}
}

export default createBem
