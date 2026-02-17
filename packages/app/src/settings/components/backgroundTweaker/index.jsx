import React from "react"
import * as antd from "antd"
import classnames from "classnames"

import { Icons } from "@components/Icons"

import "./index.less"

const Tweaks = {
	blur: {
		id: "style.backgroundBlur",
		fetchValue: () => {
			const value = app.cores.style.vars["backgroundBlur"]

			if (typeof value !== "string") {
				return 0
			}

			return value ? parseInt(value.replace("px", "")) : 0
		},
		updateValue: (value) => {
			app.cores.style.modifyTheme({
				backgroundBlur: `${value}px`,
			})
		},
	},
	opacity: {
		id: "style.backgroundColorTransparency",
		fetchValue: () => {
			const value = app.cores.style.vars["backgroundColorTransparency"]

			return value ? parseFloat(value) : 1
		},
		updateValue: (value) => {
			app.cores.style.modifyTheme({
				backgroundColorTransparency: value,
			})
		},
	},
	size: {
		id: "style.backgroundSize",
		fetchValue: () => {
			return app.cores.style.vars["backgroundSize"]
		},
		updateValue: (value) => {
			app.cores.style.modifyTheme({
				backgroundSize: value,
			})
		},
		options: [
			{
				label: "Cover",
				value: "cover",
			},
			{
				label: "Contain",
				value: "contain",
			},
			{
				label: "Auto",
				value: "auto",
			},
			{
				label: "50%",
				value: "50%",
			},
			{
				label: "100%",
				value: "100%",
			},
			{
				label: "150%",
				value: "150%",
			},
		],
	},
	position: {
		id: "style.backgroundPosition",
		fetchValue: () => {
			return app.cores.style.vars["backgroundPosition"]
		},
		updateValue: (value) => {
			app.cores.style.modifyTheme({
				backgroundPosition: value,
			})
		},
		options: [
			{
				label: "Left",
				value: "left",
			},
			{
				label: "Center",
				value: "center",
			},
			{
				label: "Right",
				value: "right",
			},
			{
				label: "Top",
				value: "top",
			},
		],
	},
	repeat: {
		id: "style.backgroundRepeat",
		fetchValue: () => {
			return app.cores.style.vars["backgroundRepeat"]
		},
		updateValue: (value) => {
			app.cores.style.modifyTheme({
				backgroundRepeat: value,
			})
		},
		options: [
			{
				label: "Repeat",
				value: "repeat",
			},
			{
				label: "No repeat",
				value: "no-repeat",
			},
			{
				label: "Repeat X",
				value: "repeat-x",
			},
			{
				label: "Repeat Y",
				value: "repeat-y",
			},
		],
	},
}

function useBackgroundTweakerValues() {
	const [values, setValues] = React.useState({
		blur: Tweaks.blur.fetchValue(),
		opacity: Tweaks.opacity.fetchValue(),
		size: Tweaks.size.fetchValue(),
		position: Tweaks.position.fetchValue(),
		repeat: Tweaks.repeat.fetchValue(),
	})

	function changeOption(key, value) {
		if (!Tweaks[key]) {
			console.error(`Tweaker ${key} not found`)
			return false
		}

		Tweaks[key].updateValue(value)

		setValues((prev) => {
			return {
				...prev,
				[key]: value,
			}
		})
	}

	return [values, changeOption]
}

const BackgroundTweaker = (props) => {
	const [values, updateOption] = useBackgroundTweakerValues()

	return (
		<div
			className="background-tweaker"
			style={props.style}
		>
			<div className="background-tweaker-anchors">
				<div className="background-tweaker-anchors-row">
					<div
						id="top"
						className={classnames("background-tweaker-anchor", {
							selected: values.position === "top",
						})}
						onClick={() => {
							updateOption("position", "top")
						}}
					>
						<Icons.AlignStartHorizontal />
					</div>
				</div>

				<div className="background-tweaker-anchors-row">
					<div
						id="left"
						className={classnames("background-tweaker-anchor", {
							selected: values.position === "left",
						})}
						onClick={() => {
							updateOption("position", "left")
						}}
					>
						<Icons.AlignStartVertical />
					</div>
					<div
						id="center"
						className={classnames("background-tweaker-anchor", {
							selected: values.position === "center",
						})}
						onClick={() => {
							updateOption("position", "center")
						}}
					>
						<Icons.SquareSquare />
					</div>
					<div
						id="right"
						className={classnames("background-tweaker-anchor", {
							selected: values.position === "right",
						})}
						onClick={() => {
							updateOption("position", "right")
						}}
					>
						<Icons.AlignEndVertical />
					</div>
				</div>

				<div className="background-tweaker-anchors-row">
					<div
						id="bottom"
						className={classnames("background-tweaker-anchor", {
							selected: values.position === "bottom",
						})}
						onClick={() => {
							updateOption("position", "bottom")
						}}
					>
						<Icons.AlignEndHorizontal />
					</div>
				</div>
			</div>

			<div className="background-tweaker-sliders">
				<div className="background-tweaker-sliders-option">
					<p>
						<Icons.CircleDotDashed /> Blur
					</p>

					<antd.Slider
						min={0}
						max={50}
						step={1}
						tooltip={{
							formatter: (value) => `${value}px`,
						}}
						defaultValue={values.blur}
						onChangeComplete={(values) => {
							updateOption("blur", values)
						}}
					/>
				</div>

				<div className="background-tweaker-sliders-option">
					<p>
						<Icons.Droplet /> Opacity
					</p>

					<antd.Slider
						min={0}
						max={1}
						step={0.1}
						tooltip={{
							formatter: (value) => `${value * 100}%`,
						}}
						defaultValue={values.opacity}
						onChangeComplete={(value) => {
							updateOption("opacity", value)
						}}
					/>
				</div>

				<div className="background-tweaker-sliders-option">
					<p>
						<Icons.Repeat2 /> Repeat
					</p>

					<antd.Select
						defaultValue={values.repeat}
						onChange={(value) => {
							updateOption("repeat", value)
						}}
						options={Tweaks.repeat.options}
					/>
				</div>

				<div className="background-tweaker-sliders-option">
					<p>
						<Icons.Scaling /> Size
					</p>

					<antd.Select
						defaultValue={values.repeat}
						onChange={(value) => {
							updateOption("size", value)
						}}
						options={Tweaks.size.options}
					/>
				</div>
			</div>
		</div>
	)
}

export default BackgroundTweaker
