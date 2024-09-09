import React from "react"
import * as antd from "antd"

import Streaming from "@models/spectrum"

const ProfileSelector = (props) => {
    const [loading, result, error, repeat] = app.cores.api.useRequest(Streaming.getOwnProfiles)
    const [selectedProfileId, setSelectedProfileId] = React.useState(null)

    function handleOnChange(value) {
        if (typeof props.onChange === "function") {
            props.onChange(value)
        }

        setSelectedProfileId(value)
    }

    const handleOnCreateNewProfile = async (data) => {
        await repeat()
        handleOnChange(data._id)
    }

    const handleOnDeletedProfile = async (profile_id) => {
        await repeat()
        handleOnChange(result[0]._id)
    }

    React.useEffect(() => {
        app.eventBus.on("app:new_profile", handleOnCreateNewProfile)
        app.eventBus.on("app:profile_deleted", handleOnDeletedProfile)
        app.eventBus.on("app:profiles_updated", repeat)

        return () => {
            app.eventBus.off("app:new_profile", handleOnCreateNewProfile)
            app.eventBus.off("app:profile_deleted", handleOnDeletedProfile)
            app.eventBus.off("app:profiles_updated", repeat)
        }
    }, [])

    if (error) {
        return <antd.Result
            status="warning"
            title="Error"
            subTitle={error.message}
            extra={[
                <antd.Button
                    type="primary"
                    onClick={repeat}
                >
                    Retry
                </antd.Button>
            ]}
        />
    }

    if (loading) {
        return <antd.Select
            disabled
            placeholder="Loading"
            style={props.style}
            className="profile-selector"
        />
    }

    return <antd.Select
        placeholder="Select a profile"
        value={selectedProfileId}
        onChange={handleOnChange}
        style={props.style}
        className="profile-selector"
    >
        {
            result.map((profile) => {
                return <antd.Select.Option
                    key={profile._id}
                    value={profile._id}
                >
                    {profile.profile_name ?? String(profile._id)}
                </antd.Select.Option>
            })
        }
    </antd.Select>
}

//const ProfileSelectorForwardRef = React.forwardRef(ProfileSelector)

export default ProfileSelector