import React from "react"
import * as antd from "antd"

import { ActionsBar, UserSelector, Skeleton } from "components"
import { Icons } from "components/Icons"

import "./index.less"

export default class UserRolesManager extends React.Component {
    state = {
        users: null,
        roles: null,
    }

    api = window.app.cores.api.withEndpoints()

    componentDidMount = async () => {
        await this.fetchRoles()

        if (typeof this.props.id !== "undefined") {
            const ids = Array.isArray(this.props.id) ? this.props.id : [this.props.id]
            await this.fetchUsersData(ids)
        }
    }

    fetchRoles = async () => {
        const result = await this.api.get.roles().catch((err) => {
            antd.message.error(err)
            console.error(err)
            return false
        })

        if (result) {
            this.setState({ roles: result })
        }
    }

    fetchUsersData = async (users) => {
        const result = await this.api.get.users(undefined, { _id: users }).catch((err) => {
            antd.message.error(err)
            console.error(err)
            return false
        })

        if (result) {
            this.setState({
                users: result.map((data) => {
                    return {
                        _id: data._id,
                        username: data.username,
                        roles: data.roles,
                    }
                })
            })
        }
    }

    handleSelectUser = async (users) => {
        this.fetchUsersData(users)
    }

    handleRoleChange = (userId, role, to) => {
        let updatedUsers = this.state.users.map((user) => {
            if (user._id === userId) {
                if (to == true) {
                    user.roles.push(role)
                } else {
                    user.roles = user.roles.filter((r) => r !== role)
                }
            }

            return user
        })

        this.setState({ users: updatedUsers })
    }

    handleSubmit = async () => {
        const update = this.state.users.map((data) => {
            return {
                _id: data._id,
                roles: data.roles,
            }
        })

        const result = await this.api.post.updateUserRoles({ update }).catch((err) => {
            antd.message.error(err)
            console.error(err)
            return false
        })

        if (result) {
            this.props.handleDone(result)
            if (typeof this.props.close === "function") {
                this.props.close()
            }
        }
    }

    renderItem = (item) => {
        return <div className="grantRoles_user">
            <h2>
                <Icons.User /> {item.username}
            </h2>
            <div className="roles">
                {this.state.roles.map((role) => {
                    return <antd.Checkbox
                        key={role.name}
                        checked={item.roles.includes(role.name)}
                        onChange={(to) => this.handleRoleChange(item._id, role.name, to.target.checked)}
                    >
                        {role.name}
                    </antd.Checkbox>
                })}
            </div>
        </div>
    }

    render() {
        const { users } = this.state

        if (!users) {
            return <UserSelector handleDone={this.handleSelectUser} />
        }

        return <div>
            {users.map((data) => {
                return this.renderItem(data)
            })}

            <ActionsBar>
                <div>
                    <antd.Button icon={<Icons.Save />} onClick={() => this.handleSubmit()}>
                        Submit
                    </antd.Button>
                </div>
            </ActionsBar>
        </div>
    }
}