import React from "react"
import * as antd from "antd"
import { PullToRefresh } from "antd-mobile"
import { Icons } from "components/Icons"
import { SelectableList, SwipeItem, Skeleton } from "components"
import { debounce } from "lodash"
import fuse from "fuse.js"

import "./index.less"

const statusRecord = {
    pulling: "Slide down to refresh",
    canRelease: "Release",
    refreshing: <Icons.LoadingOutlined spin />,
    complete: <Icons.Check />,
}

export const AddableSelectListSelector = (props = {}) => {
    const [loading, setLoading] = React.useState(true)
    const [data, setData] = React.useState([])
    const [searchValue, setSearchValue] = React.useState(null)

    React.useEffect(async () => {
        await fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)

        if (typeof props.loadData === "function") {
            const result = await props.loadData()

            setData(result)
        }

        setLoading(false)
    }

    const search = (value) => {
        if (typeof value !== "string") {
            if (typeof value.target?.value === "string") {
                value = value.target.value
            }
        }

        if (value === "") {
            return setSearchValue(null)
        }

        const searcher = new fuse(data, {
            includeScore: true,
            keys: [...(props.searcherKeys ?? []), "_id", "name"],
        })

        const result = searcher.search(value)

        return setSearchValue(result.map((entry) => {
            return entry.item
        }))
    }

    const debouncedSearch = debounce((value) => search(value), props.debounceSearchWait ?? 500)

    const onSearch = (keyword) => {
        if (typeof keyword !== "string") {
            keyword = keyword.target.value
        }
        
        if (keyword === "" && searchValue) {
            return setSearchValue(null)
        }

        debouncedSearch(keyword)
    }

    const isExcludedId = (id) => {
        if (!props.excludedSelectedKeys) {
            return false
        }

        if (props.excludedIds) {
            return props.excludedIds.includes(id)
        }

        return false
    }

    const findData = (id) => {
        return data.find((item) => {
            return item._id === id
        })
    }

    if (loading) {
        return <Skeleton />
    }

    return <div className="addableSelectListSelector">
        <div className="header">
            <div>
                <antd.Input.Search
                    placeholder={props.searchPlaceholder ?? "Search"}
                    onSearch={onSearch}
                    onChange={onSearch}
                    allowClear
                />
            </div>
        </div>
        <PullToRefresh
            renderText={status => {
                return <div>{statusRecord[status]}</div>
            }}
            onRefresh={fetchData}
        >
            <SelectableList
                overrideSelectionEnabled
                items={searchValue ?? data}
                actions={[
                    <div call="onDone" key="done">
                        Done
                    </div>
                ]}
                events={{
                    onDone: (ctx, keys) => props.handleDone(keys, keys.map((key) => findData(key))),
                }}
                disabledKeys={props.excludedIds}
                renderItem={(item) => {
                    return <div disabled={isExcludedId(item._id)} className="item">
                        <div><antd.Avatar shape="square" src={item.image} /></div>
                        <div><h1>{item.label}</h1></div>
                    </div>
                }}
            />
        </PullToRefresh>
    </div>
}

export const AddableSelectListItem = (props) => {
    const { item, actions, onClick, onDelete } = props

    const handleClick = () => {
        if (typeof onClick === "function") {
            onClick(item)
        }
    }

    const handleDelete = () => {
        if (typeof onDelete === "function") {
            onDelete(item)
        }
    }

    return <SwipeItem
        onDelete={handleDelete}
    >
        <antd.List.Item
            key={item._id}
            className="item"
        >
            <antd.List.Item.Meta
                avatar={<antd.Avatar src={item.image} />}
                title={item.label}
            />
        </antd.List.Item>
    </SwipeItem>
}

//@evite-components#OperatorsAssignments*mobile/desktop
export default class AddableSelectList extends React.Component {
    state = {
        selectedKeys: [],
        selectedItems: [],
    }

    onClickAdd = async () => {
        window.app.DrawerController.open("AddableSelectListSelector", AddableSelectListSelector, {
            onDone: async (ctx, keys, data) => {
                if (keys.length <= 0) {
                    ctx.close()
                    return false
                }

                let { selectedKeys, selectedItems } = this.state

                selectedKeys = [...selectedKeys, ...keys]
                selectedItems = [...selectedItems, ...data]

                await this.setState({ selectedKeys: selectedKeys, selectedItems: selectedItems })

                if (typeof this.props.onSelectItem === "function") {
                    await this.props.onSelectItem(keys)
                }

                ctx.close()
            },
            componentProps: {
                loadData: this.props.loadData,
                searcherKeys: this.props.searcherKeys,
                debounceSearchWait: this.props.debounceSearchWait,
                excludedIds: this.state.selectedKeys,
                excludedSelectedKeys: this.props.excludedSelectedKeys,
            },
        })
    }

    onClickItem = async (item) => {
        if (typeof this.props.onClickItem === "function") {
            await this.props.onClickItem(item)
        }
    }

    onDeleteItem = async (item) => {
        if (typeof this.props.onDeleteItem === "function") {
            await this.props.onDeleteItem(item)
        }

        const { selectedKeys, selectedItems } = this.state

        const newSelectedKeys = selectedKeys.filter((key) => {
            return key !== item._id
        })

        const newSelectedItems = selectedItems.filter((_item) => {
            return _item._id !== item._id
        })

        this.setState({ selectedKeys: newSelectedKeys, selectedItems: newSelectedItems })
    }

    render() {
        return <div className="addableSelectList">
            <div>
                <antd.List
                    dataSource={this.state.selectedItems}
                    renderItem={(item) => {
                        return <AddableSelectListItem
                            item={item}
                            actions={this.props.actions}
                            onClick={() => this.onClickItem(item)}
                            onDelete={() => { this.onDeleteItem(item) }}
                        />
                    }}
                />
            </div>
            <div className="actions">
                <div key="add">
                    <antd.Button
                        icon={<Icons.Plus />}
                        shape="round"
                        onClick={this.onClickAdd}
                    >
                        Add
                    </antd.Button>
                </div>
            </div>
        </div>
    }
}