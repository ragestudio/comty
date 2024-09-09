import React from "react"
import * as antd from "antd"

import ProfileSelector from "./components/ProfileSelector"
import ProfileData from "./components/ProfileData"
import ProfileCreator from "./components/ProfileCreator"

import "./index.less"

const TVStudioPage = (props) => {
    const [selectedProfileId, setSelectedProfileId] = React.useState(null)

    function newProfileModal() {
        const modal = app.modal.info({
            title: "Create new profile",
            content: <ProfileCreator
                close={() => modal.destroy()}
                onCreate={(id, data) => {
                    setSelectedProfileId(id)
                }}
            />,
            footer: null
        })
    }

    return <div className="main-page">
        <div className="main-page-actions">
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
            !selectedProfileId && <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "70vh"
                }}
            >
                <h3>
                    Select profile or create new
                </h3>
            </div>
        }
    </div>
}

export default TVStudioPage