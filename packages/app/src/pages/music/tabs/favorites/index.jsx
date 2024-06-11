import React from "react"
import * as antd from "antd"

import PlaylistView from "@components/Music/PlaylistView"

import MusicModel from "@models/music"

export default class FavoriteTracks extends React.Component {
    state = {
        error: null,

        initialLoading: true,
        loading: false,

        list: [],
        total_length: 0,

        empty: false,
        hasMore: true,
        offset: 0,
    }

    static loadLimit = 50

    componentDidMount = async () => {
        await this.loadItems()
    }

    onLoadMore = async () => {
        console.log(`Loading more items...`, this.state.offset)

        const newOffset = this.state.offset + FavoriteTracks.loadLimit

        await this.setState({
            offset: newOffset,
        })

        await this.loadItems({
            offset: newOffset,
        })
    }

    loadItems = async ({
        replace = false,
        offset = 0,
        limit = FavoriteTracks.loadLimit,
    } = {}) => {
        this.setState({
            loading: true,
        })

        const result = await MusicModel.getFavoriteTracks({
            useTidal: app.cores.sync.getActiveLinkedServices().tidal,
            offset: offset,
            limit: limit,
        }).catch((err) => {
            this.setState({
                error: err.message,
            })
            return false
        })

        console.log("Loaded favorites => ", result)

        if (result) {
            const { tracks, total_length } = result

            this.setState({
                total_length
            })

            if (tracks.length === 0) {
                if (offset === 0) {
                    this.setState({
                        empty: true,
                    })
                }

                return this.setState({
                    hasMore: false,
                })
            }

            if (replace) {
                this.setState({
                    list: tracks,
                })
            } else {
                this.setState({
                    list: [...this.state.list, ...tracks],
                })
            }
        }

        this.setState({
            loading: false,
            initialLoading: false,
        })
    }

    render() {
        if (this.state.error) {
            return <antd.Result
                status="error"
                title="Error"
                subTitle={this.state.error}
            />
        }

        if (this.state.initialLoading) {
            return <antd.Skeleton active />
        }

        return <PlaylistView
        favorite
            type="vertical"
            playlist={{
                title: "Your favorites",
                cover: "https://storage.ragestudio.net/comty-static-assets/favorite_song.png",
                list: this.state.list
            }}
            centered={app.isMobile}
            onLoadMore={this.onLoadMore}
            hasMore={this.state.hasMore}
            empty={this.state.empty}
            length={this.state.total_length}
        />
    }
}