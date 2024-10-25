import React from "react"
import * as antd from "antd"

import ProfileSelector from "./components/ProfileSelector"
import ProfileData from "./components/ProfileData"
import ProfileCreator from "./components/ProfileCreator"

import useCenteredContainer from "@hooks/useCenteredContainer"

import "./index.less"

const TVStudioPage = (props) => {
    useCenteredContainer(true)

    const [selectedProfileId, setSelectedProfileId] = React.useState(null)

    function newProfileModal() {
        app.layout.modal.open("tv_profile_creator", ProfileCreator, {
            props: {
                onCreate: (id, data) => {
                    setSelectedProfileId(id)
                },
            }
        })
    }

    return <div className="tvstudio-page">
        <div className="tvstudio-page-actions">
            <ProfileSelector
                onChange={setSelectedProfileId}
            />

            <antd.Button
                type="primary"
                onClick={newProfileModal}
            >
                Create new
            </antd.Button>
        </div>

        {
            selectedProfileId && <ProfileData
                profile_id={selectedProfileId}
            />
        }

        {
            !selectedProfileId && <div className="tvstudio-page-selector-hint">
                <h1>
                    Select profile or create new
                </h1>
            </div>
        }
    </div>
}

export default TVStudioPage