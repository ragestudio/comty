import React from 'react'
import * as antd from 'antd'
import * as ycore from 'ycore'
import styles from './index.less'
import * as Icons from '@ant-design/icons'
import Icon from '@ant-design/icons'
import { CustomIcons } from 'components'

const { Meta } = antd.Card

class SearchCard extends React.PureComponent {
  render() {
    const { source } = this.props
    const { username, avatar, about, id } = source
    const DevInfo = `ID #${id} | Dev ${
      ycore.booleanFix(source.dev) ? 'yes' : 'no'
    } | `
    const AdminInfo = `RID #${source.country_id} | IP ${source.ip_address} | `

    const DataStrip = {
      title: e => {
        if (this.props.type == 'Users') {
          return `@${username}`
        }
        if (this.props.type == 'Groups') {
          return `${source.name}`
        }
        return null
      },
      description: e => {
        if (this.props.type == 'Users') {
          return `${DevInfo}${AdminInfo}`
        }
        if (this.props.type == 'Groups') {
          return `GID #${source.group_id} | Created ${source.registered} | CAT ID #${source.category_id} / ${source.category} |`
        }
        return null
      },
      about: e => {
        return about
      },
    }
    return (
      <div className={styles.cardWrapper}>
        <antd.Card>
          <Meta
            avatar={
              <div className={styles.postAvatar}>
                <antd.Avatar shape="square" size={50} src={avatar} />
              </div>
            }
            title={
              <div className={styles.titleWrapper}>
                <h4
                  onClick={() => ycore.router.go(`@${username}`)}
                  className={styles.titleUser}
                >
                  {DataStrip.title()}
                </h4>
                <antd.Tooltip title="User Verified">
                  {ycore.booleanFix(source.verified) ? (
                    <Icon
                      style={{ color: 'blue', verticalAlign: 'top' }}
                      component={CustomIcons.VerifiedBadge}
                    />
                  ) : null}{' '}
                </antd.Tooltip>
              </div>
            }
            description={
              ycore.IsThisUser.dev() ? (
                <span className={styles.textAgo}>
                  {DataStrip.description()}
                </span>
              ) : null
            }
            bordered="false"
          />
          <div className={styles.postContent}>
            {' '}
            <h3 dangerouslySetInnerHTML={{ __html: DataStrip.about() }} />{' '}
          </div>
        </antd.Card>
      </div>
    )
  }
}
export default SearchCard
