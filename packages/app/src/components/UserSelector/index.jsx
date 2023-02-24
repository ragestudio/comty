import React from "react"
import * as antd from "antd"
import { Translation } from "react-i18next"
import { SelectableList, Skeleton } from "components"
import { debounce } from "lodash"
import fuse from "fuse.js"

import "./index.less"

export default class UserSelector extends React.Component {
    state = {
        loading: true,
        data: [],
        searchValue: null,
    }

    api = window.app.cores.api.withEndpoints("main")

    componentDidMount = async () => {
        this.toogleLoading(true)
        await this.fetchUsers()
    }

    toogleLoading = (to) => {
        this.setState({ loading: to ?? !this.state.loading })
    }

    fetchUsers = async () => {
        const data = await this.api.get.users(undefined, { select: this.props.select }).catch((err) => {
            console.error(err)
            antd.message.error("Error fetching operators")
        })

        this.setState({ data: data, loading: false })
    }

    isExcludedId = (id) => {
        if (this.props.excludedIds) {
            return this.props.excludedIds.includes(id)
        }

        return false
    }

    renderItem = (item) => {
        return <div disabled={this.isExcludedId(item._id)} className="user" >
            <div><antd.Avatar shape="square" src={item.avatar} /></div>
            <div><h1>{item.fullName ?? item.username}</h1></div>
        </div>
    }

    search = (value) => {
        if (typeof value !== "string") {
            if (typeof value.target?.value === "string") {
                value = value.target.value
            }
        }

        if (value === "") {
            return this.setState({ searchValue: null })
        }

        const searcher = new fuse(this.state.data, {
            includeScore: true,
            keys: ["username", "fullName"],
        })

        const result = searcher.search(value)

        this.setState({
            searchValue: result.map((entry) => {
                return entry.item
            }),
        })
    }

    debouncedSearch = debounce((value) => this.search(value), 500)

    onSearch = (event) => {
        if (event === "" && this.state.searchValue) {
            return this.setState({ searchValue: null })
        }

        this.debouncedSearch(event.target.value)
    }

    render() {
        if (this.state.loading) {
            return <Skeleton />
        }

        return <div className="users_selector">
            <div className="users_selector header">
                <div>
                    <antd.Input.Search
                        placeholder="Search"
                        allowClear
                        onSearch={this.onSearch}
                        onChange={this.onSearch}
                    />
                </div>
            </div>
            <SelectableList
                onlyClickSelection
                overrideSelectionEnabled
                bulkSelectionAction
                items={this.state.searchValue ?? this.state.data}
                renderItem={this.renderItem}
                actions={[
                    <div type="primary" call="onDone" key="done">
                        <Translation>
                            {t => t("Done")}
                        </Translation>
                    </div>
                ]}
                events={{
                    onDone: (ctx, keys) => this.props.handleDone(keys),
                }}
            />
        </div>
    }
}