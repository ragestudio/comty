import React from "react"
import * as antd from "antd"
import { Icons } from "components/Icons"
import { User } from "models"
import classnames from "classnames"

import "./index.less"

const maxMessageLength = 512

const PostCreatorInput = (props) => {
    const [value, setValue] = React.useState("")

    const canPublish = () => {
        return value.length !== 0 && value.length < maxMessageLength
    }

    const onChange = (e) => {
        setValue(e.target.value)
    }

    const handleSubmit = () => {
        if (canPublish()) {
            if (typeof props.onSubmit === "function") {
                props.onSubmit(value)
            }

            setValue("")
        }
    }

    return <div className="textInput">
        <div className="avatar">
            <img src={props.user?.avatar} />
        </div>
        <antd.Input.TextArea
            //className={classnames("textArea", { ["active"]: canPublish() })}
            disabled={props.loading}
            value={value}
            onPressEnter={handleSubmit}
            autoSize={{ minRows: 3, maxRows: 6 }}
            dragable="false"
            placeholder="What are you thinking?"
            onChange={onChange}
            allowClear
            rows={8}
            maxLength={maxMessageLength}
        />
        <div>
            <antd.Button
                type="primary"
                disabled={props.loading || !canPublish()}
                onClick={handleSubmit}
                icon={props.loading ? <Icons.LoadingOutlined spin /> : <Icons.Send />}
            />
        </div>
    </div>
}

export default class PostCreator extends React.Component {
    state = {
        loading: false,
    }
    api = window.app.request

    componentDidMount = async () => {
        const userData = await User.data()

        this.setState({
            userData
        })
    }

    onSubmit = async (value) => {
        await this.setState({ loading: true })

        const result = this.api.put.post({
            message: value,
        }).catch(error => {
            console.error(error)
            antd.message.error(error)

            return false
        })

        this.setState({ loading: false })
    }

    render() {
        return <div className="postCreator">
            <PostCreatorInput
                user={this.state.userData}
                loading={this.state.loading}
                onSubmit={this.onSubmit}
            />
        </div>
    }
}