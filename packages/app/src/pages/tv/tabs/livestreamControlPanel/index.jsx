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

    const [selectedProfileId, setSelectedProfileId] = React.useState(null)

    const [isConnected, setIsConnected] = React.useState(false)

    React.useEffect(() => {
        if (R_Profiles) {
            console.log("Profiles", R_Profiles)

            if (!selectedProfileId) {
                setSelectedProfileId(R_Profiles[0]?._id)
            }
        }
    }, [R_Profiles])

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

    const profileData = R_Profiles.find((profile) => profile._id === selectedProfileId)

    const handleCreateProfile = async (profile_name) => {
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

    const handleCurrentProfileDataUpdate = async (newProfileData) => {
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

            app.ModalController.close()

            M_Profiles()
        }
    }

    const handleCurrentProfileDelete = async () => {
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

                    app.ModalController.close()

                    setSelectedProfileId(null)

                    M_Profiles()
                }
            }
        })
    }

    const onClickEditInfo = () => {
        if (!profileData) {
            return
        }

        app.ModalController.open(() => <ProfileEditor
            profileData={profileData}
            onDelete={handleCurrentProfileDelete}
            onSave={handleCurrentProfileDataUpdate}
        />)
    }

    const regenerateStreamingKey = async () => {
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

    return <div className="streamingControlPanel">
        <div className="streamingControlPanel_header">
            <div className="streamingControlPanel_header_thumbnail">
                <img
                    src={
                        profileData?.info.thumbnail ?? "/assets/new_file.png"
                    }
                />
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
        </div>

        <div className="config">
            <LimitAlert
                limit_id="streaming_bandwidth"
            />

            <div className="panel">
                <h2><Icons.MdSettingsInputAntenna /> Emission</h2>

                <div className="content">
                    <span>Ingestion URL</span>

                    <code>
                        {profileData?.addresses?.ingest ?? "No ingest URL available"}
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
                        <StreamingKeyViewer streamingKey={profileData?.stream_key} />
                    </div>
                </div>
            </div>

            <div className="panel">
                <h2><Icons.Tool />Additional options</h2>

                <div className="content">
                    <span>Enable DVR</span>

                    <div className="value">
                        <antd.Switch
                            checked={profileData?.options?.dvr ?? false}
                            onChange={false}
                        />
                    </div>
                </div>

                <div className="content">
                    <span>Private mode</span>

                    <div className="value">
                        <antd.Switch
                            checked={profileData?.options?.private ?? false}
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
                        {profileData?.addresses?.aac ?? "No AAC URL available"}
                    </code>
                </div>

                <div className="content">
                    <span>HLS URL</span>

                    <code>
                        {profileData?.addresses?.hls ?? "No HLS URL available"}
                    </code>
                </div>

                <div className="content">
                    <span>FLV URL</span>

                    <code>
                        {profileData?.addresses?.flv ?? "No FLV URL available"}
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
