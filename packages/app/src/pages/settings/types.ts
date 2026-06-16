import { ReactNode, ComponentType } from "react"

export type SettingComponentType =
	| "button"
	| "switch"
	| "slider"
	| "input"
	| "textarea"
	| "inputnumber"
	| "select"
	| "slidercolorpicker"
	| string

export interface SettingAction {
	id: string
	title: string
	icon?: string
	type?: "primary" | "default" | "dashed" | "link" | "text"
	onClick?: (ctx: any) => void
}

export interface Setting {
	id: string
	id_alias?: string
	group?: string
	component: SettingComponentType | ComponentType<any>
	icon?: string
	title?: string
	description?: string
	experimental?: boolean
	disabled?: boolean
	storaged?: boolean
	defaultValue?: any | ((ctx: any) => Promise<any> | any)
	dependsOn?: Record<string, any | ((val: any) => boolean)>
	listenUpdateValue?: string
	reloadValueOnUpdateEvent?: string
	props?: any | ((ctx: any) => Promise<any> | any)
	onUpdate?: (value: any, previous: any) => Promise<any> | any
	beforeSave?: (value: any) => Promise<void> | void
	emitEvent?: string | string[]
	emissionValueUpdate?: (value: any) => any
	noUpdate?: boolean
	debounced?: boolean
	children?: ReactNode
	usePadding?: boolean
	layout?: "horizontal" | "vertical"
	extraActions?: (SettingAction | ComponentType<any> | ReactNode)[]
	onEnabledChange?: (enabled: boolean) => void
	switchDefault?: boolean | (() => boolean)
	desktop?: boolean
	mobile?: boolean
}

export interface SettingTabModule {
	id: string
	icon?: string
	label: string
	group: string
	order?: number
	settings: Setting[]
	ctxData?: () => Promise<any> | any
	onLoad?: (ctx: any) => Promise<void> | void
	render?: ComponentType<{ ctx: any }>
	footer?: ComponentType<{ ctx: any }>
}

export interface SettingsGroup {
	group: string
	groupModule: SettingTabModule[]
}

export interface SettingItemCtx {
	updateCurrentValue: (value: any) => void
	getCurrentValue: () => any
	currentValue: any
	dispatchUpdate: (value: any) => Promise<any>
	onUpdateItem: (value: any) => Promise<any>
	processedCtx: any
}
