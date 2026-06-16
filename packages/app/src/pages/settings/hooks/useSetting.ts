import React from "react"
import { Setting, SettingItemCtx } from "../types"

export const useSetting = (
	setting: Setting,
	ctx: any,
	onUpdate?: (value: any) => void,
) => {
	const [value, setValue] = React.useState<any>(null)
	const [debouncedValue, setDebouncedValue] = React.useState<any>(null)
	const [loading, setLoading] = React.useState(true)
	const [disabled, setDisabled] = React.useState(false)
	const [componentProps, setComponentProps] = React.useState<any>({})

	const componentRef = React.useRef<any>(null)

	const getSettingValue = React.useCallback(
		(id: string) => {
			let val = (window as any).app.cores.settings.get(id)

			// fallback to baseConfig if not found in local settings
			if ((val === undefined || val === null) && ctx.baseConfig) {
				val = ctx.baseConfig[id]
			}

			return val
		},
		[ctx.baseConfig],
	)

	const checkDependsValidation = React.useCallback(() => {
		if (!setting.dependsOn) return false

		return !Object.keys(setting.dependsOn).every((key) => {
			const val = getSettingValue(key)

			if (typeof setting.dependsOn![key] === "function") {
				return setting.dependsOn![key](val)
			}

			return val === setting.dependsOn![key]
		})
	}, [setting.dependsOn, getSettingValue])

	const dispatchUpdate = React.useCallback(
		async (updateValue: any) => {
			const storagedValue = getSettingValue(setting.id)

			if (typeof setting.onUpdate === "function") {
				try {
					const result = await setting.onUpdate(
						updateValue,
						storagedValue,
					)

					if (result !== undefined) {
						updateValue = result
					}
				} catch (error: any) {
					console.error(error)

					if (error.response?.data?.error) {
						app.message.error(error.response.data.error)
					} else {
						app.message.error(error.message)
					}

					return false
				}
			}

			if (updateValue === undefined) {
				updateValue = !storagedValue
			}

			if (setting.storaged) {
				await (window as any).app.cores.settings.set(
					setting.id,
					updateValue,
				)
				if (typeof setting.beforeSave === "function") {
					await setting.beforeSave(updateValue)
				}
			}

			if (setting.emitEvent) {
				const events = Array.isArray(setting.emitEvent)
					? setting.emitEvent
					: [setting.emitEvent]
				let emissionPayload = updateValue

				if (typeof setting.emissionValueUpdate === "function") {
					emissionPayload =
						setting.emissionValueUpdate(emissionPayload)
				}

				for (const event of events) {
					app.eventBus.emit(event, emissionPayload)
				}
			}

			app.eventBus.emit(`setting.update.${setting.id}`, updateValue)
			app.eventBus.emit("setting.update", {
				key: setting.id,
				value: updateValue,
			})

			if (setting.noUpdate) {
				return false
			}

			if (setting.debounced) {
				setDebouncedValue(null)
			}

			if (
				componentRef.current &&
				typeof componentRef.current.onDebounceSave === "function"
			) {
				await componentRef.current.onDebounceSave(updateValue)
			}

			if (onUpdate) {
				onUpdate(updateValue)
			}

			setValue(updateValue)
			return updateValue
		},
		[setting, onUpdate, getSettingValue],
	)

	const onUpdateItem = React.useCallback(
		async (updateValue: any) => {
			setValue(updateValue)

			if (setting.debounced) {
				setDebouncedValue(updateValue)
				return
			}

			return await dispatchUpdate(updateValue)
		},
		[setting.debounced, dispatchUpdate],
	)

	const handleListenUpdateValue = React.useCallback(() => {
		setValue(getSettingValue(setting.id))
	}, [])

	const initialize = React.useCallback(async () => {
		setLoading(true)

		let initialValue = null

		if (setting.storaged) {
			initialValue = (window as any).app.cores.settings.get(setting.id)
		} else if (ctx.baseConfig && ctx.baseConfig[setting.id] !== undefined) {
			initialValue = ctx.baseConfig[setting.id]
		}

		if (typeof setting.defaultValue === "function") {
			initialValue = await setting.defaultValue(ctx)
		} else if (
			setting.defaultValue !== undefined &&
			(initialValue === undefined || initialValue === null)
		) {
			initialValue = setting.defaultValue
		}

		setValue(initialValue)

		if (typeof setting.props === "function") {
			const resolvedProps = await setting.props(ctx)
			setComponentProps(resolvedProps)
		} else if (setting.props) {
			setComponentProps(setting.props)
		}

		setLoading(false)
	}, [setting.id, setting.storaged, setting.defaultValue, setting.props, ctx])

	React.useEffect(() => {
		initialize()
	}, [setting.id])

	React.useEffect(() => {
		const handleDependencyUpdate = () => {
			setDisabled(checkDependsValidation())
		}

		if (setting.dependsOn) {
			Object.keys(setting.dependsOn).forEach((key) => {
				app.eventBus.on(`setting.update.${key}`, handleDependencyUpdate)
			})
			setDisabled(checkDependsValidation())
		}

		if (typeof setting.listenUpdateValue === "string") {
			app.eventBus.on(
				`setting.update.${setting.listenUpdateValue}`,
				handleListenUpdateValue,
			)
		}

		if (setting.reloadValueOnUpdateEvent) {
			app.eventBus.on(setting.reloadValueOnUpdateEvent, initialize)
		}

		return () => {
			if (setting.dependsOn) {
				Object.keys(setting.dependsOn).forEach((key) => {
					app.eventBus.off(
						`setting.update.${key}`,
						handleDependencyUpdate,
					)
				})
			}
			if (typeof setting.listenUpdateValue === "string") {
				app.eventBus.off(
					`setting.update.${setting.listenUpdateValue}`,
					handleListenUpdateValue,
				)
			}
			if (setting.reloadValueOnUpdateEvent) {
				app.eventBus.off(setting.reloadValueOnUpdateEvent, initialize)
			}
		}
	}, [
		setting.dependsOn,
		setting.listenUpdateValue,
		setting.reloadValueOnUpdateEvent,
		checkDependsValidation,
		getSettingValue,
		setting.id,
		initialize,
	])

	// update value and revalidate dependencies when baseConfig changes (for non-storaged settings)
	React.useEffect(() => {
		if (
			!setting.storaged &&
			ctx.baseConfig &&
			ctx.baseConfig[setting.id] !== undefined
		) {
			setValue(ctx.baseConfig[setting.id])
		}
		setDisabled(checkDependsValidation())
	}, [ctx.baseConfig, setting.id, setting.storaged, checkDependsValidation])

	const itemCtx: SettingItemCtx = {
		updateCurrentValue: setValue,
		getCurrentValue: () => value,
		currentValue: value,
		dispatchUpdate,
		onUpdateItem,
		processedCtx: ctx,
	}

	return {
		value,
		debouncedValue,
		loading,
		disabled,
		componentProps,
		itemCtx,
		componentRef,
		dispatchUpdate,
	}
}
