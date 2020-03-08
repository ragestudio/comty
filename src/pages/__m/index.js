
import React from 'react';
import * as ycore from 'ycore'
import * as antd from 'antd'
import * as Icons from '@ant-design/icons';
import Icon from '@ant-design/icons'

import styles from './style.less'
import { GridContent } from '@ant-design/pro-layout';



export default class __m extends React.Component {
  constructor(props){
    super(props),
    this.state = {
      s_id: '',
    };
  }

  componentDidMount() {
    if (ycore.__permission() == false) {
      return ycore.crouter.native('main')
    }
    this.handleSID()
  }

  handleSID(){
    ycore.get_app_session.get_id((err, response)=> {
      if (err){
        return ycore.notifyError(err)
      }
      this.setState({ s_id: response})
    })
  }

  render() {
    return (
      <GridContent>
        <React.Fragment>
            <div className={styles.titleHeader}>
              <h1><Icons.ApartmentOutlined /> Administration</h1>
            </div>

            <div className={styles.titleHeader}>
              <h1><Icons.BugOutlined /> Debug</h1>
            </div>
            <div className={styles.sectionWrapper}>
              <div>
                <antd.Button onClick={() => this.handleSID()} > Refresh Session ID</antd.Button>
                <span> {this.state.s_id} </span>
              </div>
            </div>
          <antd.Row
            gutter={24}
            type="flex"
            style={{
              marginTop: 24,
            }}
          >
      
            <antd.Col xl={12} lg={24} md={24} sm={24} xs={24}>
           
                <h1>__m2</h1>
             
            </antd.Col>
          </antd.Row>
         
            <h1>__m3 offline</h1>
      
        </React.Fragment>
      </GridContent>
    );
  }
}
