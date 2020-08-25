import React from 'react';
import { connect } from 'umi';
import * as antd from 'antd'
import * as Icons from 'components/Icons'

@connect(({ app }) => ({ app }))
class PageIndex extends React.PureComponent {
  constructor(props){
    super(props)
  }
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
        const v = JSON.stringify(e.value)
        return(
          <div style={{ margin: '20px 50px 20px 10px' }} key={e.key} > 
            <h4>{e.key}</h4>
            {v.length < 500? <span>{v}</span> : <antd.Collapse ><antd.Collapse.Panel header={`Hidden text ( ${v.length} Characters )`}><span>{v}</span></antd.Collapse.Panel></antd.Collapse>}
          </div>
        )
      })

      return map
    }
  
    return (
      <div>
        <antd.Card style={{ wordBreak: 'break-all' }} title={<><Icons.Redux style={{ height: '19px', marginRight: '7px' }} /> Redux state</>}>
          {AppState()}
        </antd.Card>
        
      
      </div>
    );
  }
}

export default PageIndex;
