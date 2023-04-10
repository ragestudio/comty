import React from "react"
import * as antd from "antd"
import { Icons } from "components/Icons"
import UploadButton from "components/UploadButton"

import CategoriesSelector from "../CategoriesSelector"

import "./index.less"

export default (props) => {
    const [profileData, setProfileData] = React.useState(props.profileData ?? {})

    const updateStreamInfo = (key, value) => {
        setProfileData((oldData) => {
            return {
                ...oldData,
                info: {
                    ...oldData.info,
                    [key]: value,
                }
            }
        })
    }

    const handleClickSave = async () => {
        if (typeof props.onSave === "function") {
            return await props.onSave(profileData)
        }
    }

    const handleClickDelete = async () => {
        if (typeof props.onDelete === "function") {
            return await props.onDelete(profileData._id)
        }
    }

    return <div className="profileEditor">
        <div className="field">
            <span>
                <Icons.MdTag /> Profile Name
            </span>

            <div className="value">
                <antd.Input
                    placeholder="Profile name"
                    value={profileData.profile_name}
                    onChange={(e) => setProfileData((oldData) => {
                        return {
                            ...oldData,
                            profile_name: e.target.value,
                        }
                    })}
                />
            </div>
        </div>
        <div className="field">
            <span>
                <Icons.MdImage /> Thumbnail
            </span>

            <div className="value thumbnail">
                {
                    profileData.info?.thumbnail && <img src={profileData.info.thumbnail} />
                }

                <div className="controls">
                    <UploadButton
                        multiple={false}
                        onUploadDone={(file) => {
                            console.log(`Uploaded file >`, file)

                            updateStreamInfo("thumbnail", file.url)
                        }}
                    />

                    {
                        profileData.info?.thumbnail && <antd.Button
                            type="text"
                            icon={<Icons.Trash />}
                            onClick={() => updateStreamInfo("thumbnail", null)}
                            danger
                        >
                            Delete
                        </antd.Button>
                    }
                </div>
            </div>
        </div>
        <div className="field">
            <span>
                <Icons.MdTitle />Title
            </span>

            <div className="value">
                <antd.Input
                    placeholder="Stream title"
                    value={profileData.info.title}
                    onChange={(e) => updateStreamInfo("title", e.target.value)}
                />
            </div>
        </div>
        <div className="field">
            <span>
                <Icons.MdTextFields /> Description
            </span>

            <div className="value">
                <antd.Input.TextArea
                    placeholder="Stream description"
                    value={profileData.info.description}
                    onChange={(e) => updateStreamInfo("description", e.target.value)}
                />
            </div>
        </div>
        <div className="field">
            <span>
                <Icons.MdCategory /> Category
            </span>

            <div className="value">
                <CategoriesSelector
                    defaultValue={profileData.info.category}
                    updateStreamInfo={updateStreamInfo}
                />
            </div>
        </div>

        <antd.Button
            type="primary"
            onClick={handleClickSave}
        >
            Save
        </antd.Button>

        <antd.Button
            type="text"
            onClick={handleClickDelete}
            danger
        >
            Delete
        </antd.Button>
    </div>
}