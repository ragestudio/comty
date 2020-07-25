import React from 'react';
import { connect } from 'umi';
import * as antd from 'antd'

@connect(({ app }) => ({ app }))
class PageIndex extends React.PureComponent {
  state = {
    app_state: null
  }

  activeOverlay = () => {
    this.props.dispatch({
      type: 'app/updateState',
      payload: { 
        overlayActive: true, 
      },
    });
  }

  render() {
    const AppState = () => {
      let tmp = []
  
      const keys = Object.keys(this.props.app)
      const values = Object.values(this.props.app)
      const lenght = keys.length
  
      for (let i = 0; i < lenght; i++) {
        let obj = {}
        obj.key = keys[i]
        obj.value = values[i]
  
        tmp[i] = obj
      }
     
      const map = tmp.map(e => {
      return(<div style={{ margin: '20px 50px 20px 10px' }} key={e.key} > <h4>{e.key}</h4><span>{JSON.stringify(e.value)}</span> </div>)
      })

      return map
    }
    return (
      <div>
        <antd.Card title="APP STATE">
          {AppState()}
        </antd.Card>
        
      
      </div>
    );
  }
}

export default PageIndex;
