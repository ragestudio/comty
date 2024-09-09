import React from "react"
import * as antd from "antd"

import Streaming from "@models/spectrum"

import EditableText from "../EditableText"
import HiddenText from "../HiddenText"
import ProfileCreator from "../ProfileCreator"

import { MdOutlineWifiTethering } from "react-icons/md"
import { IoMdEyeOff } from "react-icons/io"
import { GrStorage, GrConfigure } from "react-icons/gr"
import { FiLink } from "react-icons/fi"

import "./index.less"

const ProfileData = (props) => {
    if (!props.profile_id) {
        return null
    }

    const [loading, setLoading] = React.useState(false)
    const [fetching, setFetching] = React.useState(true)
    const [error, setError] = React.useState(null)
    const [profile, setProfile] = React.useState(null)

    async function fetchData(profile_id) {
        setFetching(true)

        const result = await Streaming.getProfile({ profile_id }).catch((error) => {
            console.error(error)
            setError(error)
            return null
        })

        if (result) {
            setProfile(result)
        }

        setFetching(false)
    }

    async function handleChange(key, value) {
        setLoading(true)

        const result = await Streaming.createOrUpdateStream({
            [key]: value,
            _id: profile._id,
        }).catch((error) => {
            console.error(error)
            antd.message.error("Failed to update")
            return false
        })

        if (result) {
            antd.message.success("Updated")
            setProfile(result)
        }

        setLoading(false)
    }

    async function handleDelete() {
        setLoading(true)

        const result = await Streaming.deleteProfile({ profile_id: profile._id }).catch((error) => {
            console.error(error)
            antd.message.error("Failed to delete")
            return false
        })

        if (result) {
            antd.message.success("Deleted")
            app.eventBus.emit("app:profile_deleted", profile._id)
        }

        setLoading(false)
    }

    async function handleEditName() {
        const modal = app.modal.info({
            title: "Edit name",
            content: <ProfileCreator
                close={() => modal.destroy()}
                editValue={profile.profile_name}
                onEdit={async (value) => {
                    await handleChange("profile_name", value)
                    app.eventBus.emit("app:profiles_updated", profile._id)
                }}
            />,
            footer: null
        })
    }

    React.useEffect(() => {
        fetchData(props.profile_id)
    }, [props.profile_id])

    if (error) {
        return <antd.Result
            status="warning"
            title="Error"
            subTitle={error.message}
            extra={[
                <antd.Button
                    type="primary"
                    onClick={() => fetchData(props.profile_id)}
                >
                    Retry
                </antd.Button>
            ]}
        />
    }

    if (fetching) {
        return <antd.Skeleton
            active
        />
    }

    return <div className="profile-data">
        <div
            className="profile-data-header"
        >
            <img
                className="profile-data-header-image"
                src={profile.info?.thumbnail}
            />
            <div className="profile-data-header-content">
                <EditableText
                    value={profile.info?.title ?? "Untitled"}
                    className="profile-data-header-title"
                    style={{
                        "--fontSize": "2rem",
                        "--fontWeight": "800"
                    }}
                    onSave={(newValue) => {
                        return handleChange("title", newValue)
                    }}
                    disabled={loading}
                />
                <EditableText
                    value={profile.info?.description ?? "No description"}
                    className="profile-data-header-description"
                    style={{
                        "--fontSize": "1rem",
                    }}
                    onSave={(newValue) => {
                        return handleChange("description", newValue)
                    }}
                    disabled={loading}
                />
            </div>
        </div>

        <div className="profile-data-field">
            <div className="profile-data-field-header">
                <MdOutlineWifiTethering />
                <span>Server</span>
            </div>

            <div className="key-value-field">
                <div className="key-value-field-key">
                    <span>Ingestion URL</span>
                </div>

                <div className="key-value-field-value">
                    <span>
                        {profile.ingestion_url}
                    </span>
                </div>
            </div>

            <div className="key-value-field">
                <div className="key-value-field-key">
                    <span>Stream Key</span>
                </div>

                <div className="key-value-field-value">
                    <HiddenText
                        value={profile.stream_key}
                    />
                </div>
            </div>
        </div>

        <div className="profile-data-field">
            <div className="profile-data-field-header">
                <GrConfigure />
                <span>Configuration</span>
            </div>

            <div className="key-value-field">
                <div className="key-value-field-key">
                    <IoMdEyeOff />
                    <span> Private Mode</span>
                </div>

                <div className="key-value-field-description">
                    <p>When this is enabled, only users with the livestream url can access the stream.</p>
                </div>

                <div className="key-value-field-content">
                    <antd.Switch
                        checked={profile.options.private}
                        loading={loading}
                        onChange={(value) => handleChange("private", value)}
                    />
                </div>

                <div className="key-value-field-description">
                    <p style={{ fontWeight: "bold" }}>Must restart the livestream to apply changes</p>
                </div>
            </div>

            <div className="key-value-field">
                <div className="key-value-field-key">
                    <GrStorage />
                    <span> DVR [beta]</span>
                </div>

                <div className="key-value-field-description">
                    <p>Save a copy of your stream with its entire duration. You can download this copy after finishing this livestream.</p>
                </div>

                <div className="key-value-field-content">
                    <antd.Switch
                        disabled
                        loading={loading}
                    />
                </div>
            </div>
        </div>

        {
            profile.sources && <div className="profile-data-field">
                <div className="profile-data-field-header">
                    <FiLink />
                    <span>Media URL</span>
                </div>

                <div className="key-value-field">
                    <div className="key-value-field-key">
                        <span>HLS</span>
                    </div>

                    <div className="key-value-field-description">
                        <p>This protocol is highly compatible with a multitude of devices and services. Recommended for general use.</p>
                    </div>

                    <div className="key-value-field-value">
                        <span>
                            {profile.sources.hls}
                        </span>
                    </div>
                </div>
                <div className="key-value-field">
                    <div className="key-value-field-key">
                        <span>FLV</span>
                    </div>

                    <div className="key-value-field-description">
                        <p>This protocol operates at better latency and quality than HLS, but is less compatible for most devices.</p>
                    </div>

                    <div className="key-value-field-value">
                        <span>
                            {profile.sources.flv}
                        </span>
                    </div>
                </div>
                <div className="key-value-field">
                    <div className="key-value-field-key">
                        <span>RTSP [tcp]</span>
                    </div>

                    <div className="key-value-field-description">
                        <p>This protocol has the lowest possible latency and the best quality. A compatible player is required.</p>
                    </div>

                    <div className="key-value-field-value">
                        <span>
                            {profile.sources.rtsp}
                        </span>
                    </div>
                </div>
                <div className="key-value-field">
                    <div className="key-value-field-key">
                        <span>HTML Viewer</span>
                    </div>

                    <div className="key-value-field-description">
                        <p>Share a link to easily view your stream on any device with a web browser.</p>
                    </div>

                    <div className="key-value-field-value">
                        <span>
                            {profile.sources.html}
                        </span>
                    </div>
                </div>
            </div>
        }

        <div className="profile-data-field">
            <div className="profile-data-field-header">
                <span>Other</span>
            </div>

            <div className="key-value-field">
                <div className="key-value-field-key">
                    <span>Delete profile</span>
                </div>

                <div className="key-value-field-content">
                    <antd.Popconfirm
                        title="Delete the profile"
                        description="Once deleted, the profile cannot be recovered."
                        onConfirm={handleDelete}
                        okText="Yes"
                        cancelText="No"
                    >
                        <antd.Button
                            danger
                            loading={loading}
                        >
                            Delete
                        </antd.Button>
                    </antd.Popconfirm>
                </div>
            </div>

            <div className="key-value-field">
                <div className="key-value-field-key">
                    <span>Change profile name</span>
                </div>

                <div className="key-value-field-content">
                    <antd.Button
                        loading={loading}
                        onClick={handleEditName}
                    >
                        Change
                    </antd.Button>
                </div>
            </div>
        </div>
    </div>
}

export default ProfileData