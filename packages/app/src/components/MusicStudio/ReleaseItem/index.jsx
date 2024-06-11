import React from "react"

import { Icons } from "@components/Icons"
import Image from "@components/Image"

import "./index.less"

const ReleaseItem = (props) => {
    const { release, onClick } = props

    async function handleOnClick() {
        if (typeof onClick === "function") {
            return onClick(release)
        }
    }

    return <div
        id={release._id}
        className="music-studio-page-release"
        onClick={handleOnClick}
    >
        <div className="music-studio-page-release-title">
            <Image
                src={release.cover}
            />

            {release.title}
        </div>

        <div
            className="music-studio-page-release-info"
        >
            <div className="music-studio-page-release-info-field">
                <Icons.IoMdMusicalNote />
                {release.type}
            </div>

            <div className="music-studio-page-release-info-field">
                <Icons.MdTag />
                {release._id}
            </div>

            {/* <div className="music-studio-page-release-info-field">
                <Icons.IoMdEye />
                {release.analytics?.listen_count ?? 0}
            </div> */}
        </div>
    </div>
}

export default ReleaseItem