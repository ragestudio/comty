import React from "react"
import * as antd from "antd"

import { Icons } from "@components/Icons"

import MusicModel from "@models/music"

import Tabs from "./tabs"

import "./index.less"

const ReleaseEditor = (props) => {
    const { release_id } = props

    const basicInfoRef = React.useRef()

    const [selectedTab, setSelectedTab] = React.useState("info")
    const [L_Release, R_Release, E_Release, F_Release] = release_id !== "new" ? app.cores.api.useRequest(MusicModel.getReleaseData, release_id) : [false, false, false, false]

    async function handleSubmit() {
        basicInfoRef.current.submit()
    }

    async function onFinish(values) {
        console.log(values)
    }

    async function canFinish() {
        return true
    }

    if (E_Release) {
        return <antd.Result
            status="warning"
            title="Error"
            subTitle={E_Release.message}
        />
    }

    if (L_Release) {
        return <antd.Skeleton active />
    }

    const Tab = Tabs.find(({ key }) => key === selectedTab)

    return <div className="music-studio-release-editor">
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
                    disabled={L_Release || !canFinish()}
                >
                    Save
                </antd.Button>

                {
                    release_id !== "new" ? <antd.Button
                        icon={<Icons.IoMdTrash />}
                        disabled={L_Release}
                    >
                        Delete
                    </antd.Button> : null
                }

                {
                    release_id !== "new" ? <antd.Button
                        icon={<Icons.MdLink />}
                        onClick={() => app.location.push(`/music/release/${R_Release._id}`)}
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
                    release: R_Release,
                    onFinish: onFinish,

                    references: {
                        basic: basicInfoRef
                    }
                })
            }
        </div>
    </div>
}

export default ReleaseEditor