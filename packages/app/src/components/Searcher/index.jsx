import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import lodash from "lodash"
import useUrlQueryActiveKey from "hooks/useUrlQueryActiveKey"
import { Translation } from "react-i18next"

import { Icons, createIconRender } from "components/Icons"

import UserPreview from "components/UserPreview"
import MusicTrack from "components/Music/Track"
import PlaylistItem from "components/Music/PlaylistItem"

import SearchModel from "models/search"

import "./index.less"

const ResultsTypeDecorators = {
    users: {
        icon: "Users",
        label: "Users",
        renderItem: (props) => {
            const { item, onClick } = props

            return <div className="suggestion">
                <UserPreview onClick={onClick} user={item} />
            </div>
        }
    },
    tracks: {
        icon: "Album",
        label: "Tracks",
        renderItem: (props) => {
            const { item, onClick } = props

            return <div className="suggestion" onClick={onClick}>
                <MusicTrack track={item} />
            </div>
        }
    },
    playlists: {
        icon: "Album",
        label: "Playlists",
        renderItem: (props) => {
            return <div className="suggestion">
                <PlaylistItem playlist={props.item} />
            </div>
        }
    }
}

const Results = (props) => {
    let { results } = props

    if (typeof results !== "object") {
        return null
    }

    let groupsKeys = Object.keys(results)

    // filter out empty groups
    groupsKeys = groupsKeys.filter((key) => {
        return results[key].length > 0
    })

    if (groupsKeys.length === 0) {
        return <div className="searcher no_results">
            <antd.Result
                status="info"
                title="No results"
                subTitle="We are sorry, but we could not find any results for your search."
            />
        </div>
    }

    const handleClick = (props) => {
        if (props.close) {
            props.close()
        }
    }

    return <div
        className={classnames(
            "searcher_results",
            {
                ["one_column"]: groupsKeys.length === 1,
            }
        )}
    >
        {
            groupsKeys.map((key, index) => {
                const decorator = ResultsTypeDecorators[key] ?? {
                    icon: null,
                    label: key,
                    renderItem: () => null
                }

                return <div
                    className="searcher_results_category"
                    key={index}
                >
                    <div className="searcher_results_category_header">
                        <h1>
                            {
                                createIconRender(decorator.icon)
                            }
                            <Translation>
                                {(t) => t(decorator.label)}
                            </Translation>
                        </h1>
                    </div>

                    <div className="searcher_results_category_suggestions" id={key}>
                        {
                            results[key].map((item, index) => {
                                return decorator.renderItem({
                                    key: index,
                                    item,
                                    onClick: handleClick,
                                    ...decorator.props,
                                })
                            })
                        }
                    </div>
                </div>
            })
        }
    </div>
}

export default (props) => {
    const [loading, setLoading] = React.useState(false)
    const [searchResult, setSearchResult] = React.useState(null)
    const [searchValue, setSearchValue] = React.useState("")

    const [query, setQuery] = useUrlQueryActiveKey({
        queryKey: "search",
        defaultKey: null
    })

    const makeSearch = async (value) => {
        if (value === "") {
            return setSearchResult(null)
        }

        setLoading(true)

        if (props.useUrlQuery) {
            setQuery(value)
        }

        let result = null

        if (typeof props.model === "function") {
            result = await props.model(value)
        } else {
            result = await SearchModel.search(value, {
                limit_per_section: app.isMobile ? 3 : 5
            })
        }

        if (typeof props.onSearchResult === "function") {
            await props.onSearchResult(result)
        }

        setLoading(false)

        return setSearchResult(result)
    }

    const debounceSearch = React.useCallback(lodash.debounce(makeSearch, 500), [])

    const handleOnSearch = (e) => {
        // not allow to input space as first character
        if (e.target.value[0] === " ") {
            return
        }

        setSearchValue(e.target.value)

        if (e.target.value === "") {
            if (props.useUrlQuery) {
                setQuery(null)
            }

            if (typeof props.onEmpty === "function") {
                props.onEmpty()
            }
        } else {
            if (typeof props.onFilled === "function") {
                props.onFilled()
            }

            debounceSearch(e.target.value)
        }
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
        if (props.useUrlQuery) {
            if (typeof query === "string") {
                makeSearch(query)
                setSearchValue(query)
            }
        }
    }, [])

    return <div
        className={classnames(
            "searcher",
            {
                ["open"]: searchValue,
                ["small"]: props.small,
            }
        )}
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

        {searchResult && props.renderResults && <div className="results">
            {loading && <antd.Skeleton active />}
            {
                !loading && <Results
                    results={searchResult}
                    onClick={handleResultClick} />
            }
        </div>}
    </div>
}