import React from "react"
import * as antd from "antd"
import classnames from "classnames"

import { UserPreview } from "components"
import { Icons, createIconRender } from "components/Icons"

import useRequest from "comty.js/hooks/useRequest"

import SearchModel from "comty.js/models/search"

import "./index.less"

const ResultsTypeDecorators = {
    "friends": {
        icon: "MdPeople",
        label: "Recent"
    },
    "users": {
        icon: "Users",
        label: "Users"
    }
}

const SelectableResults = (props) => {
    const [invitedUsers, setInvitedUsers] = React.useState(props.invitedUsers ?? [])

    let { results } = props

    if (!results) {
        return <antd.Empty />
    }

    if (typeof results !== "object") {
        return <antd.Empty />
    }

    let keys = React.useMemo(() => {
        let _keys = Object.keys(results)

        // check if all keys are valid, if not replace as "others"
        _keys = _keys.map((type) => {
            if (ResultsTypeDecorators[type]) {
                return type
            }

            return "others"
        })

        return _keys
    }, [results])

    if (keys.length === 0) {
        return <antd.Empty />
    }

    const handleOnClick = (value) => {
        if (props.onInviteUser) {
            props.onInviteUser(value)
        }
    }

    React.useEffect(() => {
        if (!props.invitedUsers || !Array.isArray(props.invitedUsers)) {
            return
        }

        setInvitedUsers(props.invitedUsers)
    }, [props.invitedUsers])

    return <>
        {
            keys.map((type, index) => {
                const result = results[type]

                if (!result || result.length === 0) {
                    return null
                }

                return <div key={index} className="user-selector_group">
                    <div className="user-selector_group_header">
                        {
                            createIconRender(ResultsTypeDecorators[type].icon)
                        }
                        <span>{ResultsTypeDecorators[type].label ?? "Unknown"}</span>
                    </div>

                    <div className="user-selector_group_results">
                        {
                            result.map((item, index) => {
                                const invited = invitedUsers.find((user) => user._id === item._id)

                                return <div
                                    key={index}
                                    className={classnames(
                                        "user-selector_result_item",
                                        {
                                            ["clicked"]: invited,
                                        }
                                    )}
                                >
                                    <UserPreview user={item} onClick={() => { }} />

                                    <antd.Button
                                        type="primary"
                                        onClick={() => handleOnClick(item)}
                                        disabled={invited}
                                    >
                                        {
                                            invited ? "Invited" : "Invite"
                                        }
                                    </antd.Button>
                                </div>
                            })
                        }
                    </div>
                </div>
            })
        }
    </>
}

const UserSelector = (props) => {
    const [loading, setLoading] = React.useState(false)

    const [invitedUsers, setInvitedUsers] = React.useState([])

    const [searchResult, setSearchResult] = React.useState(null)
    const [searchValue, setSearchValue] = React.useState("")

    const [L_QuickSearch, R_QuickSearch, E_QuickSearch, M_QuickSearch] = useRequest(SearchModel.quickSearch,)

    const makeSearch = async (value) => {
        if (value === "") {
            return setSearchResult(null)
        }

        // make search request
        const result = await SearchModel.search(value)

        return setSearchResult(result)
    }

    const handleOnSearch = (e) => {
        // not allow to input space as first character
        if (e.target.value[0] === " ") {
            return
        }

        setSearchValue(e.target.value)
    }

    const handleUserInvite = (user) => {
        setInvitedUsers((users) => {
            return [...users, user]
        })

        app.cores.sync.music.inviteToUser(user._id)

        // create a timeout to remove user from invited list in 10 seconds
    }

    React.useEffect(() => {
        const timer = setTimeout(async () => {
            setLoading(true)

            await makeSearch(searchValue)

            setLoading(false)
        }, 400)

        return () => clearTimeout(timer)
    }, [searchValue])

    return <div
        className={classnames(
            "user-selector",
            { ["open"]: searchValue }
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

        {
            searchResult && <div className="user-selector_results">
                {
                    loading && <antd.Skeleton active />
                }
                {
                    !loading && <SelectableResults
                        results={searchResult}
                        onInviteUser={handleUserInvite}
                        invitedUsers={invitedUsers}
                    />
                }
            </div>
        }

        {
            !searchResult && <div className="user-selector_results">
                {
                    L_QuickSearch && <antd.Skeleton active />
                }
                {
                    E_QuickSearch && <antd.Result
                        status="error"
                        title="Error loading results"
                    />
                }
                {
                    !L_QuickSearch && !E_QuickSearch && <SelectableResults
                        results={R_QuickSearch}
                        onInviteUser={handleUserInvite}
                        invitedUsers={invitedUsers}
                    />
                }
            </div>
        }
    </div>
}

export const openModal = (props) => {
    return app.ModalController.open(() => <UserSelector {...props} />)
}