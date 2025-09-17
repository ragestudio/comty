import React from "react"
import classnames from "classnames"
import { createIconRender } from "@components/Icons"

import "./index.less"

const variants = [
	{
		id: "light",
		icon: "Sun",
	},
	{
		id: "dark",
		icon: "Moon",
	},
	{
		id: "auto",
		icon: "SunMoon",
	},
]

const ThemeVariantSelector = (props) => {
	const [selected, setSelected] = React.useState(app.cores.style.variantKey)

	React.useEffect(() => {
		app.cores.style.updateVariant(selected)
	}, [selected])

	return (
		<div className="__setting_theme_variant_selector">
			{variants.map((variant) => {
				return (
					<div
						key={variant.id}
						className={classnames(
							"__setting_theme_variant_selector-variant",
							{
								selected: variant.id === selected,
							},
						)}
						onClick={() => {
							setSelected(variant.id)
						}}
					>
						{createIconRender(variant.icon)}
					</div>
				)
			})}
		</div>
	)
}

export default ThemeVariantSelector
