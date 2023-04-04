import React from "react"
import * as antd from "antd"

import { Icons, createIconRender } from "components/Icons"

import Livestream from "../../../../models/livestream"

import "./index.less"

const CategoryView = (props) => {
    const category = props.category

    const [categoryData, setCategoryData] = React.useState(null)

    const loadData = async () => {
        const categoryData = await Livestream.getCategories(category).catch((err) => {
            console.error(err)

            app.message.error("Failed to load category")

            return null
        })

        setCategoryData(categoryData)
    }

    React.useEffect(() => {
        if (props.category) {
            loadData()
        }
    }, [props.category])

    return <div className="category">
        {
            categoryData?.icon &&
            <div className="icon">
                {createIconRender(categoryData.icon)}
            </div>
        }

        <div className="label">
            {categoryData?.label ?? "No category"}
        </div>
    </div>
}

const StreamingKeyView = (props) => {
    const [streamingKeyVisibility, setStreamingKeyVisibility] = React.useState(false)

    const toogleVisibility = (to) => {
        setStreamingKeyVisibility(to ?? !streamingKeyVisibility)
    }

    return <div className="streamingKeyString">
        {streamingKeyVisibility ?
            <>
                <Icons.EyeOff onClick={() => toogleVisibility()} />
                <code>
                    {props.streamingKey ?? "No streaming key available"}
                </code>
            </> :
            <div
                onClick={() => toogleVisibility()}
            >
                <Icons.Eye />
                Click to show key
            </div>
        }
    </div>
}

const LivestreamsCategoriesSelector = (props) => {
    const [categories, setCategories] = React.useState([])
    const [loading, setLoading] = React.useState(true)

    const loadData = async () => {
        setLoading(true)

        const categories = await Livestream.getCategories().catch((err) => {
            console.error(err)

            app.message.error("Failed to load categories")

            return null
        })

        console.log(`Loaded categories >`, categories)

        setLoading(false)

        if (categories) {
            setCategories(categories)
        }
    }

    React.useEffect(() => {
        loadData()
    }, [])

    if (loading) {
        return <antd.Skeleton active />
    }

    return <antd.Select
        placeholder="Select a category"
        defaultValue={props.defaultValue}
        onChange={(value) => props.updateStreamInfo("category", value)}
    >
        {
            categories.map((category) => {
                return <antd.Select.Option value={category?.key ?? "unknown"}>{category?.label ?? "No category"}</antd.Select.Option>
            })
        }
    </antd.Select>
}

const StreamInfoEditor = (props) => {
    const [streamInfo, setStreamInfo] = React.useState(props.defaultStreamInfo ?? {})

    const updateStreamInfo = (key, value) => {
        setStreamInfo({
            ...streamInfo,
            [key]: value,
        })
    }

    const saveStreamInfo = async () => {
        if (typeof props.onSave === "function") {
            return await props.onSave(streamInfo)
        }

        // peform default save
        const result = await Livestream.updateLivestreamInfo(streamInfo).catch((err) => {
            console.error(err)

            app.message.error("Failed to update stream info")

            return false
        })

        if (result) {
            app.message.success("Stream info updated")
        }

        if (typeof props.onSaveComplete === "function") {
            await props.onSaveComplete(result)
        }

        return result
    }

    return <div className="streamInfoEditor">
        <div className="field">
            <span>
                <Icons.MdTitle />Title
            </span>
            <div className="value">
                <antd.Input
                    placeholder="Stream title"
                    value={streamInfo.title}
                    onChange={(e) => updateStreamInfo("title", e.target.value)}
                />
            </div>
        </div>
        <div className="field">
            <span>
                <Icons.MdTextFields /> Description
            </span>
            <div className="value">
                <antd.Input
                    placeholder="Stream description"
                    value={streamInfo.description}
                    onChange={(e) => updateStreamInfo("description", e.target.value)}
                />
            </div>
        </div>
        <div className="field">
            <span>
                <Icons.MdCategory /> Category
            </span>
            <div className="value">
                <LivestreamsCategoriesSelector
                    defaultValue={streamInfo.category}
                    updateStreamInfo={updateStreamInfo}
                />
            </div>
        </div>
        <antd.Button
            type="primary"
            onClick={saveStreamInfo}
        >
            Save
        </antd.Button>
    </div>
}

export default (props) => {
    const [streamInfo, setStreamInfo] = React.useState({})
    const [addresses, setAddresses] = React.useState({})

    const [isConnected, setIsConnected] = React.useState(false)
    const [streamingKey, setStreamingKey] = React.useState(null)

    const onClickEditInfo = () => {
        app.ModalController.open(() => <StreamInfoEditor
            defaultStreamInfo={streamInfo}
            onSaveComplete={(result) => {
                if (result) {
                    app.ModalController.close()

                    fetchStreamInfo()
                }
            }}
        />)
    }

    const regenerateStreamingKey = async () => {
        antd.Modal.confirm({
            title: "Regenerate streaming key",
            content: "Are you sure you want to regenerate the streaming key? After this, all other generated keys will be deleted.",
            onOk: async () => {
                const result = await Livestream.regenerateStreamingKey().catch((err) => {
                    app.message.error(`Failed to regenerate streaming key`)
                    console.error(err)

                    return null
                })

                if (result) {
                    setStreamingKey(result.key)
                }
            }
        })
    }

    const fetchStreamingKey = async () => {
        const streamingKey = await Livestream.getStreamingKey().catch((err) => {
            console.error(err)
            return false
        })

        if (streamingKey) {
            setStreamingKey(streamingKey.key)
        }
    }

    const fetchAddresses = async () => {
        const addresses = await Livestream.getAddresses().catch((error) => {
            app.message.error(`Failed to fetch addresses`)
            console.error(error)

            return null
        })

        if (addresses) {
            setAddresses(addresses)
        }
    }

    const fetchStreamInfo = async () => {
        const result = await Livestream.getStreamInfo().catch((err) => {
            console.error(err)
            return false
        })

        console.log("Stream info", result)

        if (result) {
            setStreamInfo(result)
        }
    }

    React.useEffect(() => {
        fetchAddresses()
        fetchStreamInfo()
        fetchStreamingKey()
    }, [])

    return <div className="streamingControlPanel">
        <div className="header">
            <div className="preview">
                <img src="/assets/new_file.png" />
            </div>

            <div className="details">
                <div className="status">
                    <antd.Tag
                        color={isConnected ? "Blue" : "Red"}
                        icon={isConnected ? <Icons.MdOutlineVideocam /> : <Icons.MdOutlineVideocamOff />}
                    >
                        {isConnected ? "Connected" : "Disconnected"}
                    </antd.Tag>
                </div>
                <div className="title">
                    <span>
                        Title
                    </span>
                    <h2>
                        {streamInfo?.title ?? "No title"}
                    </h2>
                </div>

                <div className="description">
                    <span>
                        Description
                    </span>

                    <p>
                        {streamInfo?.description ?? "No description"}
                    </p>
                </div>

                <div className="category">
                    <span>
                        Category
                    </span>
                    <CategoryView category={streamInfo?.category} />
                </div>
            </div>

            <div>
                <antd.Button
                    type="primary"
                    icon={<Icons.Edit2 />}
                    onClick={onClickEditInfo}
                >
                    Edit info
                </antd.Button>
            </div>
        </div>

        <div className="config">
            <div className="panel">
                <h2><Icons.MdSettingsInputAntenna /> Emission</h2>

                <div className="content">
                    <span>Ingestion URL</span>

                    <code>
                        {addresses.ingestURL ?? "No ingest URL available"}
                    </code>
                </div>

                <div className="content">
                    <div className="title">
                        <div>
                            <span>Streaming key </span>
                        </div>
                        <div>
                            <antd.Button onClick={() => regenerateStreamingKey()}>
                                <Icons.RefreshCw />
                                Regenerate
                            </antd.Button>
                        </div>
                    </div>

                    <div className="value">
                        <StreamingKeyView streamingKey={streamingKey} />
                    </div>
                </div>
            </div>

            <div className="panel">
                <h2><Icons.Tool />Additional options</h2>

                <div className="content">
                    <span>Enable DVR</span>

                    <div className="value">
                        <antd.Switch
                            checked={streamInfo?.dvr ?? false}
                            onChange={false}
                        />
                    </div>
                </div>

                <div className="content">
                    <span>Private mode</span>

                    <div className="value">
                        <antd.Switch
                            checked={streamInfo?.private ?? false}
                            onChange={false}
                        />
                    </div>
                </div>
            </div>

            <div className="panel">
                <h2><Icons.Link /> URL Information</h2>

                <div className="content">
                    <span>AAC URL (Only Audio)</span>

                    <code>
                        {addresses.aacURL ?? "No AAC URL available"}
                    </code>
                </div>

                <div className="content">
                    <span>HLS URL</span>

                    <code>
                        {addresses.hlsURL ?? "No HLS URL available"}
                    </code>
                </div>

                <div className="content">
                    <span>FLV URL</span>

                    <code>
                        {addresses.flvURL ?? "No FLV URL available"}
                    </code>
                </div>
            </div>

            <div className="panel">
                <h2><Icons.Activity /> Statistics</h2>

                <div className="content">
                    <antd.Result>
                        <h1>
                            Cannot connect with statistics
                        </h1>
                    </antd.Result>
                </div>
            </div>
        </div>
    </div>
}