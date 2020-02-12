import React from 'react'
import styles from './styles.less'
import * as ycore from 'ycore'
import * as antd from 'antd'
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import { string } from 'prop-types';

const userData = ycore.SDCP();

function isOwnProfile(id){
  if(id == userData.username){
    console.log('Is your own profile !!')
    return true
  }
  return false
}

const UserHeader = ({ values }) => {
    return (
      <div className={styles.userWrapper}>
        <div className={styles.UserCover}>
          <img src={values.cover} />
        </div>
        <PageHeaderWrapper content={
          <div className={styles.pageHeaderContent}>
          
            <div className={styles.avatar}>
               <antd.Avatar shape="square" size="large" src={values.avatar} /> 
            </div>
            <div className={styles.content}>
              <div className={styles.contentTitle}>
                 <h1 style={{ marginBottom: '0px' }} >{values.username}</h1> 
                 <span style={{ fontSize: '14px', fontWeight: '100', lineHeight: '0', marginBottom: '5px' }}>{values.about}</span> 
              </div>
            </div>
          </div>
         } />
      </div>
    );
  };
class UserProfile extends React.Component {
    constructor(props){
      super(props),
      this.state = {
        RenderValue: {},
        loading: true
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

        const selfProfile = { id: userData.id, username: userData.username, avatar: userData.avatar, about: userData.about }
      
        isOwnProfile(e)? this.setState({RenderValue: selfProfile, loading: false}) : ( 
          ycore.FindUser(string, (exception, response)=> {
            exception? ycore.notifyError(exception) : null
            try {
              const rp = JSON.parse(response)
              ycore.DevOptions.ShowFunctionsLogs? console.log(rp) : null
              if (!rp['0']) {
                ycore.DevOptions.ShowFunctionsLogs? console.log('Bad response / User not found') : null
                const val = { id: null, username: 'User not found!'}
                this.setState({ RenderValue: val, loading: false })
                return 
              }
              const c1 = rp['0'].username.toLowerCase()
              const c2 = string.toLowerCase()
              if (c1 !== c2) {
                console.log(`Using aproximate user! => ${c1}  /  ${c2}`)
                ycore.crouter.native(`@${c1}`)
              }
              
              this.setState({ RenderValue: rp['0'], loading: false })
            } catch (err) {
              ycore.notifyError(err)
            }
          })
        )

        
    }
    render(){
        const { loading } = this.state
        return(
            <div>
              {loading? <antd.Skeleton active /> : <UserHeader values={this.state.RenderValue} />}
            </div>
        )
    }
}
export default UserProfile;
