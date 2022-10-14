import React from "react"
import { SearchBar } from "antd-mobile"
import classnames from "classnames"

import "./index.less"

export default (props) => {
    const searchBoxRef = React.useRef(null)
    const [open, setOpen] = React.useState()

    const openSearchBox = (to) => {
        to = to ?? !open
        setOpen(to)

        if (to) {
            searchBoxRef.current?.focus()
        }
    }

    return <div
        onClick={() => openSearchBox(true)}
        className="searchButton">
        <SearchBar
            ref={searchBoxRef}
            className={classnames("searchBox", { ["open"]: open })}
            onSearch={props.onSearch}
            onChange={props.onChange}
            onFocus={() => openSearchBox(true)}
            onBlur={() => openSearchBox(false)}
        />
    </div>
}