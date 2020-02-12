import React from 'react'
import styles from './styles.less'
import * as ycore from 'ycore'
import * as antd from 'antd'
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import { string } from 'prop-types';

const userData = ycore.SDCP();

function isOwnProfile(id){
  if(id == userData.username){
    return true
  }
  return false
}

const UserHeader = ({ inputIO }) => {
    return (
      <PageHeaderWrapper content={
        <div className={styles.pageHeaderContent}>
          <div className={styles.avatar}>
             <antd.Avatar shape="square" size="large" src={userData.avatar} /> 
          </div>
          <div className={styles.content}>
            <div className={styles.contentTitle}>
               <h1 style={{ marginBottom: '0px' }} >{inputIO.username}</h1> 
               <span style={{ fontSize: '14px', fontWeight: '100', lineHeight: '0', marginBottom: '5px' }}>{userData.about}</span> 
            </div>
          </div>
        </div>
       } />
    );
  };
class UserProfile extends React.Component {
    constructor(props){
      super(props),
      this.state = {
        RenderValue: {},
      }
    }

    componentDidMount(){
        const { regx } = this.props
        this.initUser(regx)
    }
    initUser = (e) => {
        const parsed = e.shift()
        const raw = parsed.toString()
        const string = raw.replace('/@', "")

        const uservalue = { id: '', userToken: userData.userToken }
        // ycore.GetUserData()
        let rendVal = { id: '0', username: string, avatar: '' }
        this.setState({ RenderValue: rendVal})
        console.log(`User => ${string} `)

        
    }
    render(){
      const { regx } = this.props;
      console.log( regx )
        return(
            <div>
                {isOwnProfile(regx)? <h1>Your profile</h1> : null}
                <UserHeader inputIO={this.state.RenderValue} />
            </div>
        )
    }
}
export default UserProfile;
