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

        const result = await MusicModel.getFavouriteFolder({
            offset: offset,
            limit: limit,
        }).catch((error) => {
            this.setState({
                error: error.message,
            })

            return null
        })

        console.log("Loaded favorites => ", result)

        if (result) {
            const {
                tracks,
                releases,
                playlists,
                total_length,
            } = result

            const data = [
                ...tracks.list,
                ...releases.list,
                ...playlists.list,
            ]

            if (total_length === 0) {
                this.setState({
                    empty: true,
                    hasMore: false,
                    initialLoading: false,
                })
            }

            if (data.length === 0) {
                return this.setState({
                    empty: false,
                    hasMore: false,
                    initialLoading: false,
                })
            }

            if (replace) {
                this.setState({
                    list: data,
                })
            } else {
                this.setState({
                    list: [...this.state.list, ...data],
                })
            }

            this.setState({
                total_length
            })
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
            length={this.state.total_length}
        />
    }
}