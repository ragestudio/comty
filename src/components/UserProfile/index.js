import React from 'react'
import styles from './styles.less'
import * as ycore from 'ycore'
import * as antd from 'antd'
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import {CustomIcons, MainFeed} from 'components'
import { SetHeaderSearchType } from 'components/HeaderSearch'
import * as Icons from '@ant-design/icons';
import Icon from '@ant-design/icons'
import Follow_btn from './components/Follow_btn.js'

const userData = ycore.SDCP();

function isOwnProfile(id){
  if(id == userData.id){
    ycore.yconsole.log('Is your own profile !!')
    return true
  }
  return false
}

class UserProfile extends React.Component {
    constructor(props){
      super(props),
      this.state = {
        invalid: false,
        UUID: '',
        RenderValue: {},
        loading: true,
        Followed: '',
      }
    }

    handleFollowUser = () => {
      ycore.follow_user(this.state.UUID, (exception, response)=>{
        if(exception){return ycore.notifyError(exception) }
        this.setState({Followed: !this.state.Followed})
        return
      })
    }

    componentDidMount(){
        const { regx } = this.props
        this.initUser(regx)
        SetHeaderSearchType.disable()
    }

    initUser = (e) => {
        const parsed = e.shift()
        const raw = parsed.toString()
        const string = raw.replace('/@', "")
      
        ycore.FindUser(string, (exception, response)=> {
            exception? ycore.notifyError(exception) : null
            try {
              const rp = JSON.parse(response)
              ycore.yconsole.log(rp)
              if (!rp['0']) {
                ycore.yconsole.log('Bad response / User not found') 
                const val = { id: null, username: 'User not found!'}
                this.setState({ invalid: true, RenderValue: val, loading: false })
                ycore.crouter.native(`main`)
                antd.message.warning(`Its seams like @${string} not exist`);
                return 
              }
              const c1 = rp['0'].username.toLowerCase()
              const c2 = string.toLowerCase()
              if (c1 !== c2) {
                ycore.yconsole.log(`Using aproximate user! => ${c1}  /  ${c2}`)
                ycore.crouter.native(`@${c1}`)
              }
              ycore.GetUserTags(rp['0'].user_id, (err, res) => {
                if (err) {
                  ycore.notifyError(err)
                  return
                }
              })
              this.setState({ UUID: rp['0'].user_id,  RenderValue: rp['0'], loading: false , Followed: ycore.booleanFix(rp['0'].is_following)})            
            } catch (err) {
              ycore.notifyError(err)
            }
          })
        
    }

    UserHeader = (values) => {
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
                  {ycore.booleanFix(values.is_pro)? <antd.Tag color="purple">CPRO™ <Icons.RocketOutlined /></antd.Tag> : null}
                  {ycore.booleanFix(values.dev)? <antd.Tag color="default">DEVELOPER <Icons.CodeOutlined /></antd.Tag> : null}
                </div>
                {isOwnProfile(values.id)?  null : <div className={styles.follow_wrapper} onClick={() => this.handleFollowUser()} ><Follow_btn followed={this.state.Followed? true : false} /></div>}
                <div className={styles.contentTitle}>
                   <h1 style={{ marginBottom: '0px' }} >{values.username}<antd.Tooltip title="User Verified">{ycore.booleanFix(values.verified)? <Icon style={{ color: 'blue', verticalAlign:'top' }} component={CustomIcons.VerifiedBadge} /> : null}</antd.Tooltip></h1> 
                   <span style={{ fontSize: '14px', fontWeight: '100', lineHeight: '0', marginBottom: '5px' }} dangerouslySetInnerHTML={{__html:  values.about }}  />
                </div>
               
              </div>
            </div>
           } />
        </div>
      );
  };
    render(){
        const { loading, UUID, invalid } = this.state
        return(
            <div>
              {loading? <antd.Skeleton active /> : 
              (<div>
                {invalid? null: this.UserHeader(this.state.RenderValue)}
                <MainFeed get='user' uid={UUID} />
              </div>)
              }
            </div>
        )
    }
}
export default UserProfile;
