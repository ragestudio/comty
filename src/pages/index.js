import React from 'react';
import { connect } from 'umi';
import * as antd from 'antd'
import * as Icons from 'components/Icons'
import { objectToArray } from 'core'

@connect(({ app, contextMenu }) => ({ app, contextMenu }))
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
    const modelToMap = (data) => {
        if(!data) return false
        return objectToArray(data).map(e => {
          try {
           const v = JSON.stringify(e.value)
           if(!v) return false
           return(
             <div style={{ margin: '20px 50px 20px 10px' }} key={e.key} > 
               <h4>{e.key}</h4>
               {v.length < 500? <span>{v}</span> : <antd.Collapse ><antd.Collapse.Panel header={`Hidden text ( ${v.length} Characters )`}><span>{v}</span></antd.Collapse.Panel></antd.Collapse>}
             </div>
           )
          } catch (error) {
            return null
          }
        })

    }

    return (
      <div>
        <antd.Card style={{ wordBreak: 'break-all' }} title={<><Icons.Redux style={{ height: '19px', marginRight: '7px' }} /> App model</>}>
          {modelToMap(this.props.app)}
        </antd.Card>
        <antd.Card style={{ wordBreak: 'break-all' }} title={<><Icons.Redux style={{ height: '19px', marginRight: '7px' }} /> ContextMenu model</>}>
          {modelToMap(this.props.contextMenu)}
        </antd.Card>
      
      </div>
    );
  }
}

export default PageIndex;
