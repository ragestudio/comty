import React from 'react'
import * as antd from 'antd'

export default class Sessions_Manager extends React.Component {
  state = {
    sessions_data: '',
  }
  componentDidMount() {
    // app.comty_data.session_id((err, res) => {
    //   this.setState({ sid: res })
    // })
    // app.comty_data.sessions((err, res) => {
    //   const a = JSON.parse(res)['data']
    //   this.setState({ sessions_data: a })
    // })
  }
  render() {
    return (
      <div>
        <antd.List
          dataSource={this.state.sessions_data}
          renderItem={item => (
            <antd.List.Item>
              <antd.Card grid={{ gutter: 16, column: 4 }} hoverable>
                <h3>Session #{item.id}</h3>
                {this.state.sid == item.session_id ? 'This Session' : null}
                <hr />
                <p>{item.platform}</p>
                <p>{item.ip_address} </p>
                <p>{item.time}</p>
              </antd.Card>
            </antd.List.Item>
          )}
        />
      </div>
    )
  }
}
