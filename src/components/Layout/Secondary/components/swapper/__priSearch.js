import React from 'react'
import styles from './__priSearch.less'

import * as antd from 'antd'
import * as ycore from 'ycore'
import Icon from '@ant-design/icons'

const VerifiedBadge = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="#55acee"
    width="15"
    height="15"
    viewBox="0 0 24 24"
  >
    <path d="M23 12l-2.44-2.78.34-3.68-3.61-.82-1.89-3.18L12 3 8.6 1.54 6.71 4.72l-3.61.81.34 3.68L1 12l2.44 2.78-.34 3.69 3.61.82 1.89 3.18L12 21l3.4 1.46 1.89-3.18 3.61-.82-.34-3.68L23 12m-13 5l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"></path>
  </svg>
)

export default class __priSearch extends React.PureComponent {
    renderResult = source => {
      try {
        const Empty = (
          <div>
            <antd.Result
              status="404"
              title="Nothing..."
              subTitle="Sorry, this does not exist."
            />
          </div>
        )
  
        // TO DO:  Settings serach & Post Search
        const usersParsed = JSON.parse(source)['users']
        const groupsParsed = JSON.parse(source)['groups']
        const pagesParsed = JSON.parse(source)['pages']
  
        const users = () => {
          if (usersParsed.length >= 1) {
            ycore.yconsole.log('Users => ', usersParsed)
            return this.EntryComponent('Users', usersParsed)
          }
        }
        const groups = () => {
          if (groupsParsed.length >= 1) {
            ycore.yconsole.log('Groups => ', groupsParsed)
            return this.EntryComponent('Groups', groupsParsed)
          }
        }
        const pages = () => {
          if (pagesParsed.length >= 1) {
            ycore.yconsole.log('Pages => ', pagesParsed)
            return this.EntryComponent('Pages', pagesParsed)
          }
        }
  
        if (
          !usersParsed.length >= 1 &&
          !groupsParsed.length >= 1 &&
          !pagesParsed.length >= 1
        ) {
          return Empty
        }
  
        return [users(), groups(), pages()]
      } catch (error) {
        return (
          <center>
            <h2>Render Error</h2>
          </center>
        )
      }
    }
    EntryComponent = (t, source) => {
      try {
        return (
              <antd.List
                dataSource={source}
                renderItem={item => 
                  <div id={item.id} className={styles.search_card} onClick={() => {ycore.router.go(`@${item.username}`)}}>
                    <div className={styles.search_title}>
                      <img src={item.avatar} />
                      <p className={styles.search_user_username}>
                        @{item.username}
                        {ycore.booleanFix(item.verified) ? (
                          <Icon component={VerifiedBadge} />
                        ) : null}
                      </p>
                     
                    </div>
                    <div className={styles.search_text}>
                      <p>{item.about}</p>
                    </div>
                  </div>
                }
              />
  
        )
      } catch (error) {
        return (
          <center>
            <h2>Render Error</h2>
          </center>
        )
      }
    }
    render(){
      return(      
        <div className={styles.search_wrapper}>
            {this.renderResult(this.props.payload)}
        </div>
      )
    }
  }