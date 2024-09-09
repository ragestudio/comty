import React from "react"
import * as antd from "antd"

import { Icons } from "@components/Icons"

import MusicModel from "@models/music"

import { DefaultReleaseEditorState, ReleaseEditorStateContext } from "@contexts/MusicReleaseEditor"

import Tabs from "./tabs"

import "./index.less"

console.log(MusicModel.deleteRelease)

const ReleaseEditor = (props) => {
    const { release_id } = props

    const basicInfoRef = React.useRef()

    const [submitting, setSubmitting] = React.useState(false)
    const [submitError, setSubmitError] = React.useState(null)

    const [loading, setLoading] = React.useState(true)
    const [loadError, setLoadError] = React.useState(null)
    const [globalState, setGlobalState] = React.useState(DefaultReleaseEditorState)
    const [selectedTab, setSelectedTab] = React.useState("info")
    const [customPage, setCustomPage] = React.useState(null)

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
        setSubmitting(true)
        setSubmitError(null)

        try {
            // first sumbit tracks
            console.time("submit:tracks:")
            const tracks = await MusicModel.putTrack({
                list: globalState.list,
            })
            console.timeEnd("submit:tracks:")

            // then submit release
            console.time("submit:release:")
            await MusicModel.putRelease({
                _id: globalState._id,
                title: globalState.title,
                description: globalState.description,
                public: globalState.public,
                cover: globalState.cover,
                explicit: globalState.explicit,
                type: globalState.type,
                list: tracks.list,
            })
            console.timeEnd("submit:release:")
        } catch (error) {
            console.error(error)
            app.message.error(error.message)

            setSubmitError(error)
            setSubmitting(false)

            return false
        }

        setSubmitting(false)
        app.message.success("Release saved")

        return release
    }

    async function handleDelete() {
        app.layout.modal.confirm({
            headerText: "Are you sure you want to delete this release?",
            descriptionText: "This action cannot be undone.",
            onConfirm: async () => {
                await MusicModel.deleteRelease(globalState._id)
                app.location.push(window.location.pathname.split("/").slice(0, -1).join("/"))
            },
        })
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

    return <ReleaseEditorStateContext.Provider
        value={{
            ...globalState,
            setCustomPage,
        }}
    >
        <div className="music-studio-release-editor">
            {
                customPage && <div className="music-studio-release-editor-custom-page">
                    {
                        customPage.header && <div className="music-studio-release-editor-custom-page-header">
                            <div className="music-studio-release-editor-custom-page-header-title">
                                <antd.Button
                                    icon={<Icons.IoIosArrowBack />}
                                    onClick={() => setCustomPage(null)}
                                />

                                <h2>{customPage.header}</h2>
                            </div>

                            {
                                customPage.props?.onSave && <antd.Button
                                    type="primary"
                                    icon={<Icons.Save />}
                                    onClick={() => customPage.props.onSave()}
                                >
                                    Save
                                </antd.Button>
                            }
                        </div>
                    }

                    {
                        React.cloneElement(customPage.content, {
                            ...customPage.props,
                            close: () => setCustomPage(null),
                        })
                    }
                </div>
            }
            {
                !customPage && <>
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
                                disabled={submitting || loading || !canFinish()}
                                loading={submitting}
                            >
                                Save
                            </antd.Button>

                            {
                                release_id !== "new" ? <antd.Button
                                    icon={<Icons.IoMdTrash />}
                                    disabled={loading}
                                    onClick={handleDelete}
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
                </>
            }
        </div>
    </ReleaseEditorStateContext.Provider>
}

export default ReleaseEditor