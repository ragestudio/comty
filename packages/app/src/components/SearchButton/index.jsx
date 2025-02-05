import React from "react"
import { Input } from "antd"
import classnames from "classnames"

import "./index.less"

const SearchButton = (props) => {
	const searchBoxRef = React.useRef(null)

	const [value, setValue] = React.useState()
	const [open, setOpen] = React.useState()

	const openSearchBox = (to) => {
		to = to ?? !open
		setOpen(to)

		if (to) {
			searchBoxRef.current?.focus()
		}
	}

	const handleOnChange = (value) => {
		setValue(value)

		if (!value || value.length === 0 || value === "" || value === " ") {
			if (typeof props.onEmpty === "function") {
				props.onEmpty()
			}

			return false
		}

		if (typeof props.onChange === "function") {
			props.onChange(value)
		}
	}

	return (
		<div className="searchButton" onClick={() => openSearchBox(true)}>
			<Input
				ref={searchBoxRef}
				className={classnames("searchBox", { ["open"]: open })}
				placeholder="Type for search..."
				onSearch={props.onSearch}
				onChange={handleOnChange}
				value={value}
				onFocus={() => openSearchBox(true)}
				onBlur={() => {
					if (value.length === 0) {
						openSearchBox(false)
					}
				}}
				disabled={props.disabled}
			/>
		</div>
	)
}

export default SearchButton
