import React from 'react'
import styles from './styles.less'
import * as app from 'app'
import * as antd from 'antd'
import { Icons, MainFeed, PostCreator } from 'components'
import Icon from '@ant-design/icons'
import Follow_btn from './components/Follow_btn.js'
import { BadgesType } from 'globals/badges_list'
import classnames from 'classnames'

import * as reducers from './reducers.js'

class UserProfile extends React.PureComponent {
  constructor(props) {
    super(props),
      (this.state = {
        invalid: false,
        UUID: '',
        RenderValue: {},
        loading: true,
        Followed: '',
        UserTags: [],
      })
  }

  require(i) {
    if (i) {
      try {
        switch (i) {
          case 'pro':
            return app.booleanFix(this.state.RenderValue.is_pro)
          case 'dev':
            return app.booleanFix(this.state.RenderValue.dev)
          case 'nsfw':
            return app.booleanFix(this.state.RenderValue.nsfw_flag)
        }
      } catch (err) {
        app.notify.error(err)
        return false
      }
    }
    return false
  }

  handleFollowUser = () => {
    const payload = { user_id: this.state.UUID }
    app.comty_user.follow((err, res) => {
      if (err) {
        return false
      }
      this.setState({ Followed: !this.state.Followed })
      return
    }, payload)
  }

  componentDidMount() {
    this.initUser(this.props.regx)
    app.SwapMode.loose_focus()
  }

  initUser = e => {
    const parsed = e.shift()
    const raw = parsed.toString()
    const string = raw.replace('/@', '')

    const payload = { key: string }
    app.comty_user.find((err, res) => {
      err ? app.notify.error(err) : null
      try {
        const rp = JSON.parse(res)
        app.yconsole.log(rp)
        if (!rp['0']) {
          app.yconsole.log('Bad response / User not found')
          const val = { id: null, username: 'User not found!' }
          this.setState({ invalid: true, RenderValue: val, loading: false })
          app.router.go(`main`)
          antd.message.warning(`Its seams like @${string} not exist`)
          return
        }
        const c1 = rp['0'].username.toLowerCase()
        const c2 = string.toLowerCase()
        if (c1 !== c2) {
          app.yconsole.log(`Using aproximate user! => ${c1}  /  ${c2}`)
          app.router.go(`@${c1}`)
        }

        this.setState({
          UUID: rp['0'].user_id,
          RenderValue: rp['0'],
          loading: false,
          Followed: app.booleanFix(rp['0'].is_following),
        })

        reducers.get.followers((res)=>{
          try {
            this.setState({followers_data: res, followers: res.length})
          } catch (error) {
            return false
          }

        },rp['0'].user_id)

        app.comty_user.__tags(
          (err, res) => {
            if (err) return false
            let fn = []
            const a = JSON.parse(res)['tags']
            const b = Object.entries(Object.assign({}, a[0]))
            const objectArray = b.slice(1, b.length)

            objectArray.forEach(([key, value]) => {
              if (value == 'true') {
                BadgesType.map(item => {
                  item.id === key ? (item ? fn.push(item) : null) : null
                })
              }
            })
            BadgesType.map(item => {
              this.require(item.require) ? fn.push(item) : null
            })
            this.setState({ UserTags: fn })
          },
          { id: this.state.UUID }
        )
      } catch (err) {
        app.notify.error(err)
      }
    }, payload)
  }

  render() {
    
const moreMenu = (
  <antd.Menu>
    <antd.Menu.Item>__</antd.Menu.Item>
    <antd.Menu.Item>__set2</antd.Menu.Item>
  </antd.Menu>
);

    const { loading, UUID, invalid, RenderValue, followers } = this.state
    const { isMobile } = this.props
    if(loading) return <antd.Skeleton active />
    if(invalid) return null
    return (
      <div>
            <div
className={classnames(styles.userWrapper, {
  [styles.mobile]: isMobile,
})}
>

<div className={styles.UserCover}>
  <img src={RenderValue.cover} />
</div>

  
    <div className={styles.pageHeaderContent}>
      <div className={classnames(styles.avatar, {[styles.mobile]: isMobile})}>
        <antd.Avatar shape="square" src={RenderValue.avatar} />
      </div>
      <div className={styles.content}>
        <div className={styles.TagWrappers}>
          {this.state.UserTags.length > 0 ? (
            <antd.List
              dataSource={this.state.UserTags}
              renderItem={item => (
                <antd.Tooltip title={item.tip}>
                  <antd.Tag id={item.id} color={item.color}>
                    {item.title} {item.icon}
                  </antd.Tag>
                </antd.Tooltip>
              )}
            />
          ) : null}
        </div>
        {app.IsThisUser.same(RenderValue.id) ? null : (
          <div
            className={styles.follow_wrapper}
            onClick={() => this.handleFollowUser()}
          >
            <Follow_btn
              followed={this.state.Followed ? true : false}
            />
          </div>
        )}
      
        <div className={styles.contentTitle}>
          <h1 style={{ marginBottom: '0px' }}>
            
            <antd.Tooltip title={`${this.state.followers} Followers`}>
              {RenderValue.username}
            </antd.Tooltip>

            <antd.Tooltip title="User Verified">
              {app.booleanFix(RenderValue.verified) ? (
                <Icon
                  style={{
                    color: 'blue',
                    verticalAlign: 'top',
                  }}
                  component={Icons.VerifiedBadge}
                />
              ) : null}
            </antd.Tooltip>
          
            { app.IsThisUser.same(UUID)? 
            <antd.Dropdown overlay={moreMenu}>
              <Icons.MoreOutlined className={styles.user_more_menu} />
            </antd.Dropdown> 
            : null }
          </h1>
          <span
            style={{
              fontSize: '14px',
              fontWeight: '100',
              lineHeight: '0',
              marginBottom: '5px',
            }}
            dangerouslySetInnerHTML={{
              __html: RenderValue.about,
            }}
          />
        </div>
      </div>
    </div>
</div>
            {app.IsThisUser.same(UUID) ? (<PostCreator userData={app.userData()} />) : null}
            <MainFeed get="user" uid={UUID} />
      </div>
    )
  }
}
export default UserProfile
