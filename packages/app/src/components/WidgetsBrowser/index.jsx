import React from "react"
import { Skeleton, Result, Input } from "antd"

import { Icons } from "@components/Icons"
import WidgetItemPreview from "@components/WidgetItemPreview"

import useRequest from "comty.js/hooks/useRequest"

import "./index.less"

export const WidgetBrowser = (props) => {
	const [L_Widgets, R_Widgets, E_Widgets, M_Widgets] = []

	const [searchValue, setSearchValue] = React.useState("")

	let timer = null

	const handleOnSearch = (e) => {
		// not allow to input space as first character
		if (e.target.value[0] === " ") {
			return
		}

		setSearchValue(e.target.value)

		timer = setTimeout(async () => {
			if (timer) {
				clearTimeout(timer)
			}

			await M_Widgets({
				keywords: {
					name: e.target.value,
				},
			})
		}, 400)
	}

	if (E_Widgets) {
		console.error(E_Widgets)

		return (
			<div>
				<Result
					status="error"
					title="Error"
					subTitle="Sorry, something went wrong."
				/>
			</div>
		)
	}

	return (
		<div className="widgets_browser">
			<Input
				placeholder="Start typing to search..."
				onChange={handleOnSearch}
				value={searchValue}
				prefix={<Icons.Search />}
				autoFocus
			/>

			{L_Widgets && <Skeleton active />}

			{!L_Widgets &&
				R_Widgets.map((widget, index) => {
					return (
						<React.Fragment>
							<WidgetItemPreview
								index={index}
								manifest={widget.manifest}
								onRemove={() => {
									app.cores.widgets.uninstall(widget._id)
								}}
								onInstall={() => {
									app.cores.widgets.install(widget._id)
								}}
								onUpdate={() => {
									app.cores.widgets.install(widget._id, {
										update: true,
									})
								}}
								onChangeVisible={(visible) => {
									app.cores.widgets.toggleVisibility(
										widget._id,
										visible,
									)
								}}
							/>
						</React.Fragment>
					)
				})}
			{!L_Widgets && R_Widgets.length === 0 && (
				<Result
					title="No widgets found"
					subTitle="Sorry, we couldn't find any widgets matching your search."
				/>
			)}
		</div>
	)
}

export const openModal = () => {
	app.layout.modal.open("widgets_browser", () => <WidgetBrowser />)
}
