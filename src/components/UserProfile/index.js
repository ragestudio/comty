import React from 'react'
import styles from './styles.less'
import * as ycore from 'ycore'
import * as antd from 'antd'
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import {CustomIcons, MainFeed} from 'components'
import { SetHeaderSearchType } from 'components/HeaderSearch'
const userData = ycore.SDCP();

function isOwnProfile(id){
  if(id == userData.username){
    ycore.DevOptions.ShowFunctionsLogs ? console.log('Is your own profile !!'): null
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
               <antd.Avatar shape="square" src={values.avatar} /> 
            </div>
            <div className={styles.content}>
              <div className={styles.TagWrappers}>
                {ycore.booleanFix(values.nsfw_flag)? <antd.Tag color="volcano" >NSFW</antd.Tag> : null}
                  
              </div>
              <div className={styles.contentTitle}>
                 <h1 style={{ marginBottom: '0px' }} >{values.username}<antd.Tooltip title="User Verified">{ycore.booleanFix(values.verified)? <antd.Icon style={{ color: 'blue', verticalAlign:'top' }} component={CustomIcons.VerifiedBadge} /> : null}</antd.Tooltip></h1> 
                 <span style={{ fontSize: '14px', fontWeight: '100', lineHeight: '0', marginBottom: '5px' }} dangerouslySetInnerHTML={{__html:  values.about }}  />
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
        UUID: '',
        RenderValue: {},
        loading: true
      }
    }
    componentDidMount(){
        const { regx } = this.props
        this.initUser(regx)
        SetHeaderSearchType.disable()
        // console.log('%c Halo, sabias que el gatitos es gai? ', 'font-weight: bold; font-size: 50px;color: red; text-shadow: 3px 3px 0 rgb(217,31,38) , 6px 6px 0 rgb(226,91,14) , 9px 9px 0 rgb(245,221,8) , 12px 12px 0 rgb(5,148,68) , 15px 15px 0 rgb(2,135,206) , 18px 18px 0 rgb(4,77,145) , 21px 21px 0 rgb(42,21,113)')
    }
    
    initUser = (e) => {
        const parsed = e.shift()
        const raw = parsed.toString()
        const string = raw.replace('/@', "")
      
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
                ycore.DevOptions.ShowFunctionsLogs ? console.log(`Using aproximate user! => ${c1}  /  ${c2}`) : null
                ycore.crouter.native(`@${c1}`)
              }
              this.setState({ UUID: rp['0'].user_id,  RenderValue: rp['0'], loading: false })
            } catch (err) {
              ycore.notifyError(err)
            }
          })
        
    }
    render(){
        const { loading, UUID} = this.state
        console.log(UUID)
        return(
            <div>
              {loading? <antd.Skeleton active /> : 
              (<div>
                <UserHeader values={this.state.RenderValue} />
                <MainFeed get='user' uid={UUID} />
              </div>)
              }
            </div>
        )
    }
}
export default UserProfile;
