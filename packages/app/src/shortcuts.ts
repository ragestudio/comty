import type { KeyboardShortcut } from "./cores/shortcuts/shortcuts.core"

import { openModal as openSettingsModal } from "./pages/settings"

export const AppKeyboardShortcuts: KeyboardShortcut[] = [
	{
		id: "open-settings",
		key: ",",
		ctrl: true,
		fn: () => openSettingsModal(),
	},
	{
		id: "commander",
		key: "k",
		ctrl: true,
		preventDefault: true,
		fn: () => {
			app.controls.openSearcher()
		},
	},
]

export const registerAll = () => {
	for (const shortcut of AppKeyboardShortcuts) {
		app.cores.shortcuts.register(shortcut)
	}
}

export default AppKeyboardShortcuts
