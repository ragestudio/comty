import React from "react"
import * as antd from "antd"

import { Icons } from "@components/Icons"

import CoverEditor from "@components/CoverEditor"

const ReleasesTypes = [
    {
        value: "single",
        label: "Single",
        icon: <Icons.MdMusicNote />,
    },
    {
        value: "ep",
        label: "Episode",
        icon: <Icons.MdAlbum />,
    },
    {
        value: "album",
        label: "Album",
        icon: <Icons.MdAlbum />,
    },
    {
        value: "compilation",
        label: "Compilation",
        icon: <Icons.MdAlbum />,
    }
]

const BasicInformation = (props) => {
    const { release, onFinish } = props

    return <div className="music-studio-release-editor-tab">
        <h1>Release Information</h1>

        <antd.Form
            name="basic"
            layout="vertical"
            ref={props.references.basic}
            onFinish={onFinish}
            requiredMark={false}
        >
            <antd.Form.Item
                label=""
                name="cover"
                rules={[{ required: true, message: "Input a cover for the release" }]}
                initialValue={release?.cover}
            >
                <CoverEditor
                    defaultUrl="https://storage.ragestudio.net/comty-static-assets/default_song.png"
                />
            </antd.Form.Item>

            {
                release._id && <antd.Form.Item
                    label={<><Icons.MdTag /> <span>ID</span></>}
                    name="_id"
                    initialValue={release._id}
                    disabled
                >
                    <antd.Input
                        placeholder="Release ID"
                        disabled
                    />
                </antd.Form.Item>
            }

            <antd.Form.Item
                label={<><Icons.MdMusicNote /> <span>Title</span></>}
                name="title"
                rules={[{ required: true, message: "Input a title for the release" }]}
                initialValue={release?.title}
            >
                <antd.Input
                    placeholder="Release title"
                    maxLength={128}
                    showCount
                />
            </antd.Form.Item>

            <antd.Form.Item
                label={<><Icons.MdAlbum /> <span>Type</span></>}
                name="type"
                rules={[{ required: true, message: "Select a type for the release" }]}
                initialValue={release?.type}
            >
                <antd.Select
                    placeholder="Release type"
                    options={ReleasesTypes}
                />
            </antd.Form.Item>

            <antd.Form.Item
                label={<><Icons.MdPublic /> <span>Public</span></>}
                name="public"
                initialValue={release?.public}
            >
                <antd.Switch />
            </antd.Form.Item>
        </antd.Form>
    </div>
}

export default BasicInformation