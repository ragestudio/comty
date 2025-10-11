import { createIconRender } from "@components/Icons"

import linksDecorators from "@config/linksDecorators"

import "./index.less"

function processValue(value, decorator) {
	if (decorator.hrefResolve) {
		if (!String(value).includes(decorator.hrefResolve)) {
			return `${decorator.hrefResolve}${value}`
		}
	}

	return value
}

const UserLinkViewer = (props) => {
	const { link, decorator } = props

	return (
		<div className="userLinkViewer">
			<div className="userLinkViewer_icon">
				{createIconRender(decorator.icon ?? "MdLink")}
			</div>

			<div className="userLinkViewer_value">
				<p>{link.value}</p>
			</div>
		</div>
	)
}

const UserLink = (props) => {
	let { index, link } = props

	link.key = link.key.toLowerCase()

	const decorator = linksDecorators[link.key] ?? {}

	link.value = processValue(link.value, decorator)

	const hasHref = String(link.value).includes("://")

	const handleOnClick = () => {
		if (!hasHref) {
			if (app.isMobile) {
				app.layout.drawer.open("link_viewer", UserLinkViewer, {
					componentProps: {
						link: link,
						decorator: decorator,
					},
				})
			}
			return false
		}

		window.open(link.value, "_blank")
	}

	const renderName = () => {
		if (decorator.hrefResolve) {
			return decorator.label ?? link.value
		}

		return link.value
	}

	return (
		<div
			key={index}
			id={`link-${index}-${link.key}`}
			className={`userLink ${hasHref ? "clickable" : ""}`}
			onClick={handleOnClick}
		>
			{createIconRender(decorator.icon ?? "MdLink")}

			{!app.isMobile && <p>{renderName()}</p>}
		</div>
	)
}

export default UserLink
