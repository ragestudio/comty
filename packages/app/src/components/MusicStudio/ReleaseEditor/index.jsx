import React from "react"
import * as antd from "antd"

import { Icons } from "@components/Icons"

import MusicModel from "@models/music"

import { DefaultReleaseEditorState, ReleaseEditorStateContext } from "@contexts/MusicReleaseEditor"

import Tabs from "./tabs"

import "./index.less"

const ReleaseEditor = (props) => {
    const { release_id } = props

    const basicInfoRef = React.useRef()

    const [loading, setLoading] = React.useState(true)
    const [loadError, setLoadError] = React.useState(null)
    const [globalState, setGlobalState] = React.useState(DefaultReleaseEditorState)
    const [selectedTab, setSelectedTab] = React.useState("info")

    async function initialize() {
        setLoading(true)
        setLoadError(null)

        if (release_id !== "new") {
            try {
                const releaseData = await MusicModel.getReleaseData(release_id)

                setGlobalState({
                    ...globalState,
                    ...releaseData,
                })
            } catch (error) {
                setLoadError(error)
            }
        }

        setLoading(false)
    }

    async function handleSubmit() {
        console.log("Submit >", globalState)
    }

    async function onFinish(values) {
        console.log(values)
    }

    async function canFinish() {
        return true
    }

    React.useEffect(() => {
        initialize()
    }, [])

    if (loadError) {
        return <antd.Result
            status="warning"
            title="Error"
            subTitle={loadError.message}
        />
    }

    if (loading) {
        return <antd.Skeleton active />
    }

    const Tab = Tabs.find(({ key }) => key === selectedTab)

    return <ReleaseEditorStateContext.Provider value={globalState}>
        <div className="music-studio-release-editor">
            <div className="music-studio-release-editor-menu">
                <antd.Menu
                    onClick={(e) => setSelectedTab(e.key)}
                    selectedKeys={[selectedTab]}
                    items={Tabs}
                    mode="vertical"
                />

                <div className="music-studio-release-editor-menu-actions">
                    <antd.Button
                        type="primary"
                        onClick={handleSubmit}
                        icon={<Icons.Save />}
                        disabled={loading || !canFinish()}
                    >
                        Save
                    </antd.Button>

                    {
                        release_id !== "new" ? <antd.Button
                            icon={<Icons.IoMdTrash />}
                            disabled={loading}
                        >
                            Delete
                        </antd.Button> : null
                    }

                    {
                        release_id !== "new" ? <antd.Button
                            icon={<Icons.MdLink />}
                            onClick={() => app.location.push(`/music/release/${globalState._id}`)}
                        >
                            Go to release
                        </antd.Button> : null
                    }
                </div>
            </div>

            <div className="music-studio-release-editor-content">
                {
                    !Tab && <antd.Result
                        status="error"
                        title="Error"
                        subTitle="Tab not found"
                    />
                }
                {
                    Tab && React.createElement(Tab.render, {
                        release: globalState,
                        onFinish: onFinish,

                        state: globalState,
                        setState: setGlobalState,

                        references: {
                            basic: basicInfoRef
                        }
                    })
                }
            </div>
        </div>
    </ReleaseEditorStateContext.Provider>
}

export default ReleaseEditor