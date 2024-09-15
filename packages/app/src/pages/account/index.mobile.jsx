import React from "react"
import * as antd from "antd"
import classnames from "classnames"

import { Translation } from "react-i18next"

import Skeleton from "@components/Skeleton"
import { PagePanelWithNavMenu } from "@components/PagePanels"
import { MobileUserCard } from "@components/UserCard"

import { SessionModel, UserModel, FollowsModel } from "@models"

import DetailsTab from "./tabs/details"
import PostsTab from "./tabs/posts"
import FollowersTab from "./tabs/followers"

import "./index.mobile.less"

const Tabs = [
    {
        key: "posts",
        icon: "BookOpen",
        label: <Translation>
            {t => t("Posts")}
        </Translation>,
        component: PostsTab,
    },
    {
        key: "followers",
        icon: "Users",
        label: <Translation>
            {t => t("Followers")}
        </Translation>,
        component: FollowersTab,
    },
    {
        key: "details",
        icon: "Info",
        label: <Translation>
            {t => t("Details")}
        </Translation>,
        component: DetailsTab,
    }
]

export default class Account extends React.Component {
    state = {
        requestedUser: null,

        user: null,
        followers: [],

        isSelf: false,
        isFollowed: false,

        tabActiveKey: "posts",

        isNotExistent: false,
    }

    componentDidMount = async () => {
        this.loadUser()
    }

    toggleLike = async () => {
        if (this.state.isFollowed) {
            const accept = await new Promise((resolve, reject) => {
                antd.Modal.confirm({
                    title: <Translation>
                        {t => t("Confirm")}
                    </Translation>,
                    content: <Translation>
                        {t => t("Are you sure you want to unfollow this user?")}
                    </Translation>,
                    okText: <Translation>
                        {t => t("Yes")}
                    </Translation>,
                    cancelText: <Translation>
                        {t => t("No")}
                    </Translation>,
                    onOk: () => {
                        resolve(true)
                    },
                    onCancel: () => {
                        resolve(false)
                    }
                })
            })

            if (!accept) {
                return false
            }
        }

        const result = await FollowsModel.toggleFollow({
            username: this.state.requestedUser,
        }).catch((error) => {
            console.error(error)
            antd.message.error(error.message)

            return false
        })

        await this.setState({
            isFollowed: result.following,
            followers: result.followers,
        })
    }

    loadUser = async () => {
        const token = await SessionModel.getDecodedToken()
        const requestedUser = this.props.username ?? token?.username

        let isSelf = false
        let user = null
        let isFollowed = false
        let followers = []

        if (requestedUser != null) {
            if (token.username === requestedUser) {
                isSelf = true
            }

            user = await UserModel.data({
                username: requestedUser
            }).catch((error) => {
                console.error(error)

                return false
            })

            if (!user) {
                this.setState({
                    isNotExistent: true,
                })

                return false
            }

            console.log(`Loaded User [${user.username}] >`, user)

            if (!isSelf) {
                const followedResult = await FollowsModel.imFollowing(user._id).catch(() => false)

                if (followedResult) {
                    isFollowed = followedResult.isFollowed
                }
            }

            const followersResult = await FollowsModel.getFollowers(user._id).catch(() => false)

            if (followersResult) {
                followers = followersResult
            }
        }

        await this.setState({
            isSelf,
            user,
            requestedUser,
            isFollowed,
            followers,
        })
    }

    render() {
        const { user } = this.state

        if (this.state.isNotExistent) {
            return <antd.Result
                status="404"
                title="This user does not exist, yet..."
            >

            </antd.Result>
        }

        if (!user) {
            return <Skeleton />
        }

        return <div
            className={classnames(
                "_mobile_account-profile",
            )}
        >
            <MobileUserCard
                user={user}
                isSelf={this.state.isSelf}
                isFollowed={this.state.isFollowed}
                followers={this.state.followers}
                onClickFollow={this.toggleLike}
            />

            <PagePanelWithNavMenu
                tabs={Tabs}
                useSetQueryType
                transition
                tabProps={{
                    state: this.state,
                }}
                onTabChange={() => {
                    app.layout.scrollTo({
                        top: 0,
                    })
                }}
                no_top_padding
            />
        </div>
    }
}