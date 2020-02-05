import React from 'react'
import * as ycore from 'ycore'
import * as antd from 'antd'
import styles from './index.less'

const { SubMenu } = antd.Menu;
var userData = ycore.SDCP()

class MainSidebar extends React.Component {

    state = {
        collapsed: false,
    };

    toggleCollapsed = () => {
      this.setState({
        collapsed: !this.state.collapsed,
      });
    };    

    render(){
        return(
            <div className={styles.main_menuWrapper}>
                <antd.Menu
                  defaultSelectedKeys={['1']}
                  defaultOpenKeys={['sub1']}
                  mode="inline"
                >
                  <antd.Menu.Item className={styles.profileKey} key="profile">
                    <antd.Avatar size='small' src={userData.avatar} />
                    <span>{userData.username}</span>
                  </antd.Menu.Item>
                  <antd.Menu.Item key="main_feed_key">
                    <antd.Icon type="home" />
                    <span>News Feed</span>
                  </antd.Menu.Item>
                  <antd.Menu.Item key="albums_key">
                    <antd.Icon type="picture" />
                    <span>Albums</span>
                  </antd.Menu.Item>
                  <antd.Menu.Item key="saved_posts_key">
                    <antd.Icon type="save" />
                    <span>Saved Posts</span>
                  </antd.Menu.Item>
                  <antd.Menu.Item key="groups_key">
                    <antd.Icon type="team" />
                    <span>Groups</span>
                  </antd.Menu.Item>
                  <antd.Menu.Item key="events_key">
                    <antd.Icon type="schedule" />
                    <span>Events</span>
                  </antd.Menu.Item>
                <antd.Divider orientation="left"><antd.Icon type="compass" /> <span>Explore</span></antd.Divider>
                  <antd.Menu.Item key="5"><antd.Icon type="star" /> Popular Posts</antd.Menu.Item>
                  <antd.Menu.Item key="6"><antd.Icon type="eye" /> Discover</antd.Menu.Item>
                  <antd.Menu.Item key="7"><antd.Icon type="dollar" /> Fundings</antd.Menu.Item>
                  <antd.Menu.Item key="8"><antd.Icon type="file-done" /> Common Things</antd.Menu.Item>
        
                </antd.Menu>
            </div>  
        )
    }
}
export default MainSidebar;