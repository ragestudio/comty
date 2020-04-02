import React from 'react'
import styles from './styles.less'
import * as ycore from 'ycore'
import * as antd from 'antd'
import { PageHeaderWrapper } from '@ant-design/pro-layout'
import { CustomIcons, MainFeed, PostCreator } from 'components'
import { SetHeaderSearchType } from 'components/HeaderSearch'
import * as Icons from '@ant-design/icons'
import Icon from '@ant-design/icons'
import Follow_btn from './components/Follow_btn.js'
import { BadgesType } from 'globals/badges_list'
import classnames from 'classnames'

const isMobile = localStorage.getItem('mobile_src')

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
            return ycore.booleanFix(this.state.RenderValue.is_pro)
          case 'dev':
            return ycore.booleanFix(this.state.RenderValue.dev)
          case 'nsfw':
            return ycore.booleanFix(this.state.RenderValue.nsfw_flag)
        }
      } catch (err) {
        ycore.notify.error(err)
        return false
      }
    }
    return false
  }

  handleFollowUser = () => {
    const payload = { user_id: this.state.UUID }
    ycore.comty_user.follow((err, res) => {
      if (err) {
        return false
      }
      this.setState({ Followed: !this.state.Followed })
      return
    }, payload)
  }

  componentDidMount() {
    this.initUser(this.props.regx)
    SetHeaderSearchType.disable()
  }

  initUser = e => {
    const parsed = e.shift()
    const raw = parsed.toString()
    const string = raw.replace('/@', '')

    const payload = { key: string }
    ycore.comty_user.find((err, res) => {
      err ? ycore.notify.error(err) : null
      try {
        const rp = JSON.parse(res)
        ycore.yconsole.log(rp)
        if (!rp['0']) {
          ycore.yconsole.log('Bad response / User not found')
          const val = { id: null, username: 'User not found!' }
          this.setState({ invalid: true, RenderValue: val, loading: false })
          ycore.router.go(`main`)
          antd.message.warning(`Its seams like @${string} not exist`)
          return
        }
        const c1 = rp['0'].username.toLowerCase()
        const c2 = string.toLowerCase()
        if (c1 !== c2) {
          ycore.yconsole.log(`Using aproximate user! => ${c1}  /  ${c2}`)
          ycore.router.go(`@${c1}`)
        }

        this.setState({
          UUID: rp['0'].user_id,
          RenderValue: rp['0'],
          loading: false,
          Followed: ycore.booleanFix(rp['0'].is_following),
        })

        ycore.comty_user.__tags(
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
        ycore.notify.error(err)
      }
    }, payload)
  }

  render() {
    const { loading, UUID, invalid, RenderValue } = this.state
    return (
      <div>
        {loading ? (
          <antd.Skeleton active />
        ) : (
          <div>
            {invalid ? null : (
              <div
                className={classnames(styles.userWrapper, {
                  [styles.mobile]: isMobile,
                })}
              >
                <div className={styles.UserCover}>
                  <img src={RenderValue.cover} />
                </div>

                <PageHeaderWrapper
                  content={
                    <div className={styles.pageHeaderContent}>
                      <div className={styles.avatar}>
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
                        {ycore.IsThisUser.same(RenderValue.id) ? null : (
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
                            {RenderValue.username}
                            <antd.Tooltip title="User Verified">
                              {ycore.booleanFix(RenderValue.verified) ? (
                                <Icon
                                  style={{
                                    color: 'blue',
                                    verticalAlign: 'top',
                                  }}
                                  component={CustomIcons.VerifiedBadge}
                                />
                              ) : null}
                            </antd.Tooltip>
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
                  }
                />
              </div>
            )}
            {ycore.IsThisUser.same(UUID) ? (
              <PostCreator userData={ycore.userData()} />
            ) : null}
            <MainFeed get="user" uid={UUID} />
          </div>
        )}
      </div>
    )
  }
}
export default UserProfile
