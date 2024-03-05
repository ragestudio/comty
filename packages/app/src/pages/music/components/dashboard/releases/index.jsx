import React from "react"
import * as antd from "antd"

import { Icons } from "components/Icons"
import { ImageViewer } from "components"
import Searcher from "components/Searcher"

import ReleaseCreator from "../../../creator"

import MusicModel from "models/music"

import "./index.less"

const ReleaseItem = (props) => {
    const { key, release } = props

    return <div
        className="music_panel_releases_item"
        key={key}
        id={key}
    >
        <div
            className="music_panel_releases_info"
        >
            <div
                className="music_panel_releases_info_cover"
            >
                <ImageViewer
                    src={release.cover ?? release.thumbnail ?? "/assets/no_song.png"}
                />
            </div>
            <div
                className="music_panel_releases_info_data"
            >
                <h1>
                    {release.title}
                </h1>

                {
                    release.description && <h4>
                        {release.description}
                    </h4>
                }

                <div className="music_panel_releases_info_extra">
                    {
                        release.public
                            ? <>
                                <Icons.MdOutlinePublic />
                                <span>
                                    Public
                                </span>
                            </>
                            : <>
                                <Icons.MdOutlineLock />
                                <span>
                                    Private
                                </span>
                            </>
                    }
                </div>
            </div>
        </div>

        <div
            className="music_panel_releases_actions"
        >
            <antd.Button
                onClick={props.onClickNavigate}
            >
                Open
            </antd.Button>

            <antd.Button
                onClick={props.onClickEditTrack}
                icon={<Icons.Edit />}
            >
                Modify
            </antd.Button>
        </div>
    </div>
}

const openReleaseCreator = ({
    release_id = null,
    onModification = () => { }
} = {}) => {
    console.log("Opening release creator", release_id)

    app.DrawerController.open("release_creator", ReleaseCreator, {
        type: "drawer",
        props: {
            title: <h2
                style={{
                    margin: 0,
                }}
            >
                <Icons.MdOutlineQueueMusic />
                Creator
            </h2>,
            width: "fit-content",
        },
        componentProps: {
            release_id: release_id,
            onModification: onModification,
        }
    })
}

const navigateToRelease = (release_id) => {
    return app.location.push(`/play/${release_id}`)
}

export default (props) => {
    const [searchResults, setSearchResults] = React.useState(null)
    const [L_Releases, R_Releases, E_Releases, M_Releases] = app.cores.api.useRequest(MusicModel.getMyReleases)

    if (E_Releases) {
        console.error(E_Releases)

        return <antd.Result
            status="warning"
            title="Failed to load"
            subTitle="We are sorry, but we could not load your releases. Please try again later."
        />
    }

    if (L_Releases) {
        return <antd.Skeleton active />
    }

    return <div
        className="music_panel_creator"
    >
        <div className="music_panel_releases_header">
            <h1>
                <Icons.Music />
                Your releases
            </h1>

            <div className="music_panel_releases_header_actions">
                <antd.Button
                    onClick={() => openReleaseCreator({
                        onModification: M_Releases,
                    })}
                    icon={<Icons.Plus />}
                    type="primary"
                    disabled={app.isMobile}
                >
                    New release
                </antd.Button>
            </div>
        </div>

        <Searcher
            small
            renderResults={false}
            model={MusicModel.getMyReleases}
            onSearchResult={setSearchResults}
            onEmpty={() => setSearchResults(null)}
        />

        <div className="music_panel_releases_list">
            {
                searchResults?.items && searchResults.items.length === 0 && <antd.Result
                    status="info"
                    title="No results"
                    subTitle="We are sorry, but we could not find any results for your search."
                />
            }
            {
                searchResults?.items && searchResults.items.length > 0 && searchResults.items.map((release) => {
                    return <ReleaseItem
                        key={release._id}
                        release={release}
                        onClickEditTrack={() => openReleaseCreator({
                            release_id: release._id,
                            onModification: M_Releases,
                        })}
                        onClickNavigate={() => navigateToRelease(release._id)}
                    />
                })
            }
            {
                !searchResults && R_Releases.items.length === 0 && <antd.Result
                    status="info"
                    title="No releases"
                    subTitle="You don't have any releases yet."
                />
            }
            {
                !searchResults && R_Releases.items.map((release) => {
                    return <ReleaseItem
                        key={release._id}
                        release={release}
                        onClickEditTrack={() => openReleaseCreator({
                            release_id: release._id,
                            onModification: M_Releases,
                        })}
                        onClickNavigate={() => navigateToRelease(release._id)}
                    />
                })
            }
        </div>
    </div>
}