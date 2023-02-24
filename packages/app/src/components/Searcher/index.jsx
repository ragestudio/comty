import React from "react"
import * as antd from "antd"
import classnames from "classnames"

import { UserPreview } from "components"
import { Icons, createIconRender } from "components/Icons"

import FeedModel from "models/feed"

import "./index.less"

const ResultRenders = {
    users: (props) => {
        const { item, onClick } = props

        return <div className="suggestion">
            <UserPreview onClick={onClick} user={item} />
        </div>
    }
}

const ResultsTypeDecorators = {
    users: {
        icon: "Users",
        label: "Users"
    }
}

const Results = (props) => {
    let { results } = props

    if (!results) {
        return <antd.Empty />
    }

    if (typeof results !== "object") {
        return <antd.Empty />
    }

    let keys = Object.keys(results)

    if (keys.length === 0) {
        return <antd.Empty />
    }

    // check if all keys are valid, if not replace as "others"
    keys = keys.map((type) => {
        if (ResultRenders[type]) {
            return type
        }

        return "others"
    })

    const handleOnClick = (type, value) => {
        if (typeof props.onClick !== "function") {
            console.warn("Searcher: onClick is not a function")
            return
        }

        return props.onClick(type, value)
    }

    return keys.map((type) => {
        const decorator = ResultsTypeDecorators[type] ?? {
            label: keys,
            icon: <Icons.Search />
        }

        return <div className="category" id={type}>
            <h3>{createIconRender(decorator.icon)}{decorator.label}</h3>
            <div className="suggestions">
                {
                    results[type].map((item) => {
                        return React.createElement(ResultRenders[type], { item, onClick: (...props) => handleOnClick(type, ...props) })
                    })
                }
            </div>
        </div>
    })
}

export default (props) => {
    const [loading, setLoading] = React.useState(false)
    const [searchResult, setSearchResult] = React.useState(null)
    const [searchValue, setSearchValue] = React.useState("")

    const makeSearch = async (value) => {
        if (value === "") {
            return setSearchResult(null)
        }

        const result = await FeedModel.search(value)

        return setSearchResult(result)
    }

    const handleOnSearch = (e) => {
        // not allow to input space as first character
        if (e.target.value[0] === " ") {
            return
        }

        setSearchValue(e.target.value)
    }

    const handleResultClick = (type, value) => {
        switch (type) {
            case "users": {
                app.navigation.goToAccount(value.username)
                break
            }
            case "posts": {
                app.navigation.goToPost(value)
                break
            }

            default: {
                console.warn("Searcher: cannot handle clicks on result of type :", type)
                break
            }
        }

        if (typeof props.close === "function") {
            props.close()
        }
    }

    React.useEffect(() => {
        const timer = setTimeout(async () => {
            setLoading(true)
            await makeSearch(searchValue)
            setLoading(false)
        }, 400)

        if (searchValue === "") {
            if (typeof props.onEmpty === "function") {
                props.onEmpty()
            }
        } else {
            if (typeof props.onFilled === "function") {
                props.onFilled()
            }
        }

        return () => clearTimeout(timer)
    }, [searchValue])

    return <div
        className={classnames("searcher", { ["open"]: searchValue })}
    >
        <antd.Input
            placeholder="Start typing to search..."
            onChange={handleOnSearch}
            value={searchValue}
            prefix={<Icons.Search />}
            autoFocus={props.autoFocus ?? false}
            onFocus={props.onFocus}
            onBlur={props.onUnfocus}
        />

        {searchResult && <div className="results">
            {loading && <antd.Skeleton active />}
            {
                !loading && <Results
                    results={searchResult}
                    onClick={handleResultClick} />
            }
        </div>}
    </div>
}