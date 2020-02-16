import React from 'react'
import * as ycore from 'ycore'
import * as antd from 'antd'
import { CustomIcons } from 'components'
import styles from './index.less'

var userData = ycore.SDCP()

class MainSidebar extends React.Component {
    state = {
        collapsed: false,
    };
    render(){
        return(
            <div className={styles.main_menuWrapper}>
              <antd.Divider orientation="left"><antd.Icon type="notification" /> <span>Feed</span></antd.Divider>
                <antd.Menu >
                  <antd.Menu.Item key="main_feed_key">
                    <antd.Icon theme="filled" style={{ color: '#4d91ea' }} type="home" />
                    <span>News Feed</span>
                  </antd.Menu.Item>
                  <antd.Menu.Item key="albums_key">
                    <antd.Icon theme="filled" style={{ color: '#8bc34a' }} type="picture" />
                    <span>Albums</span>
                  </antd.Menu.Item>
                  <antd.Menu.Item key="saved_posts_key">
                    <antd.Icon theme="filled" style={{ color: '#673ab7' }} type="save" />
                    <span>Saved Posts</span>
                  </antd.Menu.Item>
                  <antd.Menu.Item key="groups_key">
                    <antd.Icon style={{ color: '#03A9F4' }} type="team" />
                    <span>Groups</span>
                  </antd.Menu.Item>
                  <antd.Menu.Item key="events_key">
                    <antd.Icon theme="filled" style={{ color: '#f25e4e' }} type="schedule" />
                    <span>Events</span>
                  </antd.Menu.Item>
                </antd.Menu>
                <antd.Divider orientation="left"><antd.Icon type="compass" /> <span>Explore</span></antd.Divider>
                <antd.Menu>
                  <antd.Menu.Item key="5"><antd.Icon theme="filled" style={{ color: '#ff7a45' }} type="fire" /><span>Popular Posts</span></antd.Menu.Item>
                  <antd.Menu.Item key="6"><antd.Icon theme="filled" style={{ color: '#e91e63' }} type="eye" /><span>Discover</span></antd.Menu.Item>
                  <antd.Menu.Item key="7"><antd.Icon style={{ color: '#673AB7' }} type="dollar" /><span>Fundings</span></antd.Menu.Item>
                  <antd.Menu.Item key="8"><antd.Icon theme="filled" style={{ color: '#ff5991' }} component={CustomIcons.CommonThings} /><span>Common Things</span></antd.Menu.Item>
                </antd.Menu>
            </div>  
        )
    }
}
export default MainSidebar;