import React from "react"
import * as antd from "antd"
import { Icons } from "components/Icons"

import LimitAlert from "components/LimitAlert"

import ProfileSelector from "./components/ProfileSelector"
import CategoryViewResolver from "./components/CategoryViewResolver"
import StreamingKeyViewer from "./components/StreamingKeyViewer"
import ProfileEditor from "./components/ProfileEditor"

import Livestream from "models/livestream"

import "./index.less"

export default (props) => {
    const [L_Profiles, R_Profiles, E_Profiles, M_Profiles] = app.cores.api.useRequest(Livestream.getProfiles)
    const [profileData, setProfileData] = React.useState(null)
    const [selectedProfileId, setSelectedProfileId] = React.useState(null)
    const [isConnected, setIsConnected] = React.useState(false)
    const [loadingChanges, setLoadingChanges] = React.useState(false)

    React.useEffect(() => {
        if (R_Profiles) {
            console.log("Profiles", R_Profiles)

            if (!selectedProfileId) {
                setSelectedProfileId(R_Profiles[0]?._id)
            }
        }
    }, [R_Profiles])

    React.useEffect(() => {
        if (selectedProfileId) {
            console.log(R_Profiles)
            setProfileData(R_Profiles.find((profile) => profile._id === selectedProfileId))
        }
    }, [selectedProfileId])

    async function handleCreateProfile(profile_name) {
        if (!profile_name) {
            return false
        }

        const result = await Livestream.postProfile({
            profile_name: profile_name,
        }).catch((err) => {
            console.error(err)

            app.message.error("Failed to add new profile")

            return false
        })

        if (result) {
            app.message.success("New profile added")

            await M_Profiles()

            setSelectedProfileId(result._id)
        }
    }

    async function handleCurrentProfileDataUpdate(newProfileData) {
        if (!profileData) {
            return
        }

        const result = await Livestream.postProfile({
            ...newProfileData,
            profile_id: profileData._id,
        }).catch((err) => {
            console.error(err)

            app.message.error("Failed to update profile")

            return false
        })

        if (result) {
            app.message.success("Profile updated")

            app.layout.modal.close()

            M_Profiles()
        }
    }

    async function handleCurrentProfileDelete() {
        if (!profileData) {
            return
        }

        // open confirm modal
        antd.Modal.confirm({
            title: "Delete profile",
            content: "Are you sure you want to delete this profile?",
            onOk: async () => {
                const result = await Livestream.deleteProfile(profileData._id).catch((err) => {
                    console.error(err)

                    app.message.error("Failed to delete profile")

                    return false
                })

                if (result) {
                    app.message.success("Profile deleted")

                    app.layout.modal.close()

                    setSelectedProfileId(null)

                    M_Profiles()
                }
            }
        })
    }

    async function onClickEditInfo() {
        if (!profileData) {
            return
        }

        app.layout.modal.open("profile_editor", () => <ProfileEditor
            profileData={profileData}
            onDelete={handleCurrentProfileDelete}
            onSave={handleCurrentProfileDataUpdate}
        />, {
            confirmOnOutsideClick: true
        })
    }

    async function regenerateStreamingKey() {
        if (!profileData) {
            return
        }

        antd.Modal.confirm({
            title: "Regenerate streaming key",
            content: "Are you sure you want to regenerate the streaming key? After this, the old stream key will no longer be valid.",
            onOk: async () => {
                const result = await Livestream.regenerateStreamingKey(profileData._id).catch((err) => {
                    app.message.error(`Failed to regenerate streaming key`)
                    console.error(err)

                    return null
                })

                if (result) {
                    M_Profiles()
                }
            }
        })
    }

    async function updateOption(key, value) {
        if (!profileData) {
            return
        }

        setLoadingChanges(`option:${key}`)

        const result = await Livestream.postProfile({
            profile_id: profileData._id,
            profile_name: profileData.profile_name,
            options: {
                [key]: value
            }
        }).catch((err) => {
            console.error(err)
            app.message.error(`Failed to update option`)
            setLoadingChanges(false)

            return false
        })

        if (result) {
            console.log("Updated options >", result)

            setProfileData((prev) => {
                return {
                    ...prev,
                    ...result,
                }
            })
            setLoadingChanges(false)
        }
    }

    if (E_Profiles) {
        console.error(E_Profiles)

        return <antd.Result
            status="error"
            title="Failed to load profiles"
            subTitle="Failed to load profiles, please try again later"
        />
    }

    if (L_Profiles) {
        return <antd.Skeleton active />
    }

    return <div
        className="streamingControlPanel"
        disabled={!profileData || loadingChanges}
    >
        <div className="streamingControlPanel_header_thumbnail">
            <img
                src={
                    profileData?.info.thumbnail ?? "/assets/new_file.png"
                }
            />
        </div>
        <div className="streamingControlPanel_header">
            <div className="streamingControlPanel_header_actions">
                <ProfileSelector
                    profiles={R_Profiles}
                    value={selectedProfileId}
                    loading={L_Profiles}
                    onCreateProfile={handleCreateProfile}
                    onChangeProfile={(profileID) => {
                        setSelectedProfileId(profileID)
                    }}
                />

                <antd.Button
                    type="primary"
                    icon={<Icons.Edit2 />}
                    onClick={onClickEditInfo}
                >
                    Edit profile
                </antd.Button>
            </div>

            <div className="streamingControlPanel_header_details">
                <div className="streamingControlPanel_header_details_status">
                    <antd.Tag
                        color={isConnected ? "Blue" : "Red"}
                        icon={isConnected ? <Icons.MdOutlineVideocam /> : <Icons.MdOutlineVideocamOff />}
                    >
                        {isConnected ? "Connected" : "Disconnected"}
                    </antd.Tag>
                </div>

                <div className="streamingControlPanel_header_details_title">
                    <span>
                        Title
                    </span>
                    <h2>
                        {profileData?.info.title ?? "No title"}
                    </h2>
                </div>

                <div className="streamingControlPanel_header_details_description">
                    <span>
                        Description
                    </span>

                    <p>
                        {profileData?.info.description ?? "No description"}
                    </p>
                </div>

                <div className="streamingControlPanel_header_details_category">
                    <span>
                        Category
                    </span>

                    <CategoryViewResolver category={profileData?.info.category} />
                </div>
            </div>
        </div>

        <div className="streaming_configs">
            <LimitAlert
                limit_id="streaming_bandwidth"
            />

            <div className="streaming_configs_panel">
                <h2><Icons.MdSettingsInputAntenna /> Emission</h2>

                <div className="content">
                    <span>Ingestion URL</span>

                    <div className="inline_field">
                        <span>
                            {profileData?.addresses?.ingest ?? "No ingest URL available"}
                        </span>
                    </div>
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
                        <StreamingKeyViewer streamingKey={profileData?.stream_key} />
                    </div>
                </div>
            </div>

            <div className="streaming_configs_panel">
                <h2><Icons.Tool />Additional options</h2>

                <div className="content">
                    <p className="label">
                        <Icons.MdFiberDvr /> DVR
                    </p>

                    <span className="description">
                        This function will save a copy of your stream with its entire duration.
                        You can get this copy after finishing this livestream
                    </span>

                    <div className="value">
                        <antd.Switch
                            checked={profileData?.options?.dvr ?? false}
                            onChange={false}
                            disabled
                        />
                    </div>
                </div>

                <div className="content">
                    <p className="label">
                        <Icons.MdPrivateConnectivity /> Private mode
                    </p>

                    <span className="description">
                        When this is enabled, only users with the livestream url can access the stream. Your stream will not be visible on the app.
                    </span>

                    <span
                        className="description"
                        style={{
                            fontWeight: "bold",
                        }}
                    >
                        You must restart the livestream to apply the changes.
                    </span>

                    <div className="value">
                        <antd.Switch
                            checked={profileData?.options?.private ?? false}
                            onChange={(value) => {
                                updateOption("private", value)
                            }}
                            loading={loadingChanges === "option:private"}
                        />
                    </div>
                </div>
            </div>

            <div className="streaming_configs_panel">
                <h2><Icons.Link /> URL Information</h2>

                <div className="content">
                    <div className="title">
                        <p>HLS URL</p>
                        <p>[6s~12s latency]</p>
                    </div>

                    <span className="description">This protocol is highly compatible with a multitude of devices and services. Recommended for general use.</span>

                    <div className="inline_field">
                        <span>
                            {profileData?.addresses?.hls ?? "No HLS URL available"}
                        </span>
                    </div>
                </div>

                <div className="content">
                    <div className="title">
                        <p>FLV URL</p>
                        <p>[2s~5s latency]</p>
                    </div>

                    <span className="description">This protocol operates at better latency and quality than HLS, but is less compatible for most devices.</span>

                    <div className="inline_field">
                        <span>
                            {profileData?.addresses?.flv ?? "No FLV URL available"}
                        </span>
                    </div>
                </div>

                <div className="content">
                    <div className="title">
                        <p>MP3 URL (Only Audio)</p>
                        <p>[2s ~ 5s latency]</p>
                    </div>

                    <span className="description">This protocol will only return an audio file. The maximum quality compatible with this codec will be used (320Kbps, 48KHz)</span>

                    <div className="inline_field">
                        <span>
                            {profileData?.addresses?.mp3 ?? "No MP3 URL available"}
                        </span>
                    </div>
                </div>
            </div>

            <div className="streaming_configs_panel">
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
