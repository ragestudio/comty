import React from 'react'
import * as antd from 'antd'
import { connect } from 'umi'
import { router } from 'core/libs';
import { Home, Trash } from 'components/Icons'
@connect(({ app }) => ({ app }))
export default class Logout extends React.Component{

    componentDidMount(){
        if (!this.props.app.session_valid) {
            return false
        }
        const dispatchLogout = () => this.props.dispatch({ type: "app/logout" })

        antd.Modal.confirm({
            title: this.props.app.session_data.username,
            icon:  <antd.Avatar src={this.props.app.session_data.avatar} />,
            content: 'Are you sure you want to log out',
            onOk() {
                router.push('/')
            },
            onCancel() {
                dispatchLogout()
            },
            okText: <><Home/>Resume</>,
            cancelText: <><Trash/>Logout</>
          });
    }
    
    componentWillUnmount(){
      antd.Modal.destroyAll()
    }

    render(){
        return null
    }
}