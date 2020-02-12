import React from 'react'
import PropTypes from 'prop-types'
import { Menu, Icon, Button, Divider, Tooltip, message } from 'antd'
import Navlink from 'umi/navlink'
import withRouter from 'umi/withRouter'
import { arrayToTree, addLangPrefix} from 'utils'
import store from 'store'
import styles from './style.less'

@withRouter
class CustomMenu extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      pins: store.get('pins') || [],
      EditMode: false
    }
    this.HandleEditMode = this.HandleEditMode.bind(this);
  }
  SetDefaultPins(){
    this.setState({ pins: [{id: "1", icon: "bug", name: "Debug", route: "/debug"}, {id: "2", icon: "fire", name: "Empty Pin", route: ""}] })
  }
  DeletePin = (item) => {
    const items = this.state.pins.filter(pin => pin.id !== item.id);
    this.setState({ pins: items });
    message.success(`Deleted ${item.name} of your pins...`)
  }
  HandleEditMode(){
    if (this.state.EditMode == true) {
      store.set('pins', this.state.pins)
      message.success('Changes have been saved successfully')
    }
    this.setState({ EditMode: !this.state.EditMode })
  }
 
  generateMenus = data => {
    const { EditMode } = this.state;
    return data.map(item => {
      if (EditMode == true) {
        return (
            <div className={styles.RemovePin} key={item.id}>
              <Button className={styles.RemovePin} onClick={ () => this.DeletePin(item)} type='dashed'>
                <Icon type="delete" style={{ color: 'rgb(245, 48, 48)' }} />
                <span>{item.name}</span>
              </Button>
            </div>

        )
      }else {
          return (
            <Menu.Item key={item.id} >
              <Navlink to={addLangPrefix(item.route) || '#'}>
                  {item.icon && <Icon type={item.icon} />}
                  <span>{item.name}</span>
              </Navlink>
            </Menu.Item>
          )
        }
      }
    )
  }

  componentDidUpdate(){
    const { EditMode } = this.state;
    const { collapsed } = this.props;
    if (EditMode == true && collapsed){
      this.HandleEditMode()
    }
  }
  isDarkMode = () => {
    const { theme } = this.props
    if (theme == "light") {
      return false;
    }
    return true;
  }
  render() {
    const {
      collapsed,
      theme,
      isMobile,
      onCollapseChange,
    } = this.props
    const { pins, EditMode } = this.state;
    // Generating tree-structured data for menu content.
    const menuTree = arrayToTree(pins, 'id', 'menuParentId')
    const menuProps = collapsed
      ? {}
      : {
          openKeys: this.state.openKeys,
        }
    return (  
      <Menu
        theme={theme}
        mode="inline"
        onClick={
          isMobile
            ? () => {
                onCollapseChange(true)
              }
            : undefined
        }
        {...menuProps}
      >
        <div className={styles.DividerZT}><Divider dashed className={ styles.DividerZT } style={{ margin: '15px 0 5px 0' }} /></div>
        {collapsed? null : <div className={styles.EditBTN}>
          <Button className={EditMode? styles.edit_pins_active : styles.edit_pins} onClick={this.HandleEditMode} id={this.isDarkMode()? styles.edit_btn_dark : styles.edit_btn_light} type="link">
            <span className={styles.circle}><Icon className={EditMode? styles.icon_active : styles.icon} type={EditMode? "save" : "pushpin"}/> </span>
            <span className={styles.button_text}>{EditMode? 'Save' : 'Edit pins'}</span>
          </Button>
          
        </div>}
      

       {this.generateMenus(menuTree)}

       {EditMode? (pins.length < 1)? <div style={{ marginTop: '15px', textAlign: 'center', }} ><Button type='ghost' style={{  width: 'auto' }} onClick={() => this.SetDefaultPins()}>Set Default Pins</Button></div> : null : (pins.length < 1)? <Icon style={{ marginTop: '15px', width: '100%', fontSize: '20px', color: '#666' }} type="unordered-list" /> : null }
      
      </Menu>
    )
  }
}

CustomMenu.propTypes = {
  menus: PropTypes.array,
  theme: PropTypes.string,
  isMobile: PropTypes.bool,
  collapsed: PropTypes.bool,
  onCollapseChange: PropTypes.func,
}

export default CustomMenu
