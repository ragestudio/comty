import Icons from "@components/Icons"
import classnames from "classnames"

import "./index.less"

const GroupListItem = ({ group, onClick, selected }) => {
	const handleClick = () => {
		if (typeof onClick === "function") {
			onClick(group)
		}
	}

	return (
		<div
			className={classnames("group-list__item", "bg-accent", {
				["selected"]: selected,
			})}
			onClick={handleClick}
		>
			<div className="group-list__item__icon">
				{group.icon && <img src={group.icon} />}
				{!group.icon && <Icons.Birdhouse />}
			</div>

			<div className="group-list__item__content">
				<h3>{group.name}</h3>
				<p>{group.description}</p>
			</div>
		</div>
	)
}

export default GroupListItem
