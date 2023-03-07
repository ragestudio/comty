import React from "react"
import { Skeleton } from "antd"
import { Icons } from "components/Icons"

import { PostsList, Searcher } from "components"
import Post from "models/post"

import "./index.less"

export default class ExplorePosts extends React.Component {
    state = {
        focusedSearcher: false,
        filledSearcher: false,
    }


    toggleFocusSearcher = (to) => {
        to = to ?? !this.state.focusedSearcher

        this.setState({
            focusedSearcher: to
        })
    }

    toggleState = (key, to) => {
        to = to ?? !this.state[key]

        this.setState({
            [key]: to
        })
    }

    render() {
        return <div className="postsExplore">
            <div className="postsExplore_header">
                <Searcher
                    autoFocus={false}
                    onFocus={() => this.toggleState("focusedSearcher", true)}
                    onUnfocus={() => this.toggleState("focusedSearcher", false)}
                    onFilled={() => this.toggleState("filledSearcher", true)}
                    onEmpty={() => this.toggleState("filledSearcher", false)}
                />
            </div>
            {
                this.state.focusedSearcher || this.state.filledSearcher ? null : <PostsList
                    onLoadMore={Post.getExplorePosts}
                    loadFromModel={Post.getExplorePosts}
                    watchTimeline={[
                        "post.new",
                        "post.delete",
                    ]}
                />
            }
        </div>
    }
}