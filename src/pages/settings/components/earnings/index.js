import React from 'react'
import * as ycore from 'ycore'
import * as antd from 'antd'
import * as Icons from '@ant-design/icons'


export default class Earnings extends React.Component {
  state = {
    loading: true,

  }
  componentDidMount(){
    ycore.comty_get.get_user_data((err,res)=>{
      if (err) return false
      try {
        const a = JSON.parse(res)['user_data']
        this.setState({ loading: false, pro_points: a.points })
      } catch (error) {
        
      }
    })
    
  }
  render() {
    return (
      <div>
        <div>
            <h1><Icons.PaperClipOutlined /> Redeem an Code</h1>
            <antd.Input placeholder="XXXX-XXXX-XXXX-XXXX" />
        </div>
        <div>
          <h1> Your Pro Points </h1>
          {this.state.pro_points}
        </div>
      </div>
    )
  }
}
