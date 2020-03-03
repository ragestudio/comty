import React, { Component } from 'react'
import {GetAuth, InitSDCP, DevOptions, asyncSDCP} from 'ycore';
import PropTypes from 'prop-types';
import { connect } from 'dva';
import { Form, Icon as LegacyIcon } from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.css';
import { Button, Input, Drawer, Collapse } from 'antd';
import styles from './index.less';
import formstyle from './formstyle.less'

const FormItem = Form.Item

@connect(({ loading }) => ({ loading }))
@Form.create()
class YulioID extends Component {
  
  constructor(props) {
    super(props)
    this.state = {
      // Drawers Visibility (Default on False)
      MainLoginVisible: true,
      ShowLoading: false,
      Answered: false,
    }
    this.handleRetry = this.handleRetry.bind(this);
  }
  // Handlers & others
  handleUsername(text) {
    this.setState({ RawUsername: text.target.value });
  }
  handlePassword(text) {
    this.setState({ RawPassword: text.target.value });
  }
  handleRetry() {
    this.setState({ShowLoading: false, StateException: false, StateIcon: ''})
  }
  handleEnter = (e) => {
    this.handleLogin();
  }
 
  handleLogin = () => {
    var prefix = '[YID]: ';
    const { RawUsername, RawPassword } = this.state;
    var EncPassword = btoa(RawPassword);
    var EncUsername = btoa(RawUsername);
    
    if (!EncUsername || !EncPassword) {
      var message = 'Incomplete information!'
      console.log(prefix, message)
    }

    if (EncUsername && EncPassword){
      this.setState({ ShowLoading: true, StateMessage: 'Wait a sec...' });
      if (DevOptions.InfiniteLogin == true) {
        console.log(prefix, 'InfiniteLogin is enabled! Disabled getAuth')
      }
      else {
        console.log(prefix, 'Initialising login process...')
        GetAuth(EncUsername, EncPassword, (exception, response) =>  this.handleResponse(response))
      }
    }
  }

  handleResponse = (response) => {
    if (response == '200') {
      this.setState({ StateIcon: 'login', StateMessage: 'Wait a sec...', StateException: false })
    }
    if (response == '400') {
      this.setState({ StateIcon: 'exclamation-circle', StateMessage: 'Invalid credentials', StateException: true })
    }
    if (response == '404') {
      this.setState({ StateIcon: 'exclamation-circle', StateMessage: 'Invalid Data', StateException: true })
    }
    if (response == '500') {
      this.setState({ StateIcon: 'cluster', StateMessage: 'Server Error', StateException: true })
    }
  }
  

  render() {
    const { visible } = this.props
    const { getFieldDecorator } = this.props.form;
    const { ShowLoading, StateIcon, StateMessage, StateException } = this.state;
    const { Panel } = Collapse;
  
  
    return (
      <div className={styles.loginWrapper}>
        <Drawer
          width="100%"
          mask={false}
          getContainer={false}
          closable={false}
          visible={visible}
          className={styles.loginWrapper}
        >
          <div className={styles.preheader}><h6><img src={"https://api.ragestudio.net/id.svg"} /> YulioID&trade;</h6>
          <h1>Login</h1></div>
          <main className={styles.mainlp}>
      
              

              {/* <RenderInclude data={include} /> */}

              <form className={styles.formlogin}>
                {ShowLoading ? (
                  <div style={{ height: '329px' }}>
                    <div className={styles.spinner__wrapper} id="loadingspn">
                      {StateIcon ? (<LegacyIcon type={StateIcon} className={StateException? styles.StateIcon_exception : styles.StateIcon} /> ) : (<LegacyIcon type="loading" style={{ fontSize: 24, margin: '13px' }} spin />)}
                      <div><br/><br/><br/>
                        <div className={styles.resultbox}>
                          <h6 > {StateMessage} </h6>
                          {StateException ? <div className={styles.retryBTN}><Button style={{ width: '270px' }} type='dashed' onClick={this.handleRetry}>Retry</Button></div> : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className={styles.input__wrapper}>
                      <label className={styles.labelform}>
                        <LegacyIcon type="user" style={{ fontSize: '15px' }} />{' '}
                        Username
                      </label>
                      <FormItem>
                        {getFieldDecorator('Username', {
                          rules: [{ required: true }],
                        })(
                          <Input
                            onPressEnter={this.handleEnter}
                            className={styles.inputform}
                            type="text"
                            placeholder="Username"
                            onChange={text => {
                              this.handleUsername(text)
                            }}
                          />
                        )}
                      </FormItem>
                    </div>
                    <div className={styles.input__wrapper}>
                      <label className={styles.labelform}>
                        <LegacyIcon type="unlock" style={{ fontSize: '15px' }} />{' '}
                        Password
                      </label>
                      <FormItem>
                        {getFieldDecorator('Password', {
                          rules: [{ required: true }],
                        })(
                          <Input.Password
                            onPressEnter={this.handleEnter}
                            className={styles.inputform}
                            placeholder="Password"
                            onChange={text => {
                              this.handlePassword(text)
                            }}
                          />
                        )}
                      </FormItem>
                    </div>
                    <div style={{ margin: 'auto' }}>
                      <a className={styles.buttonlp} id="login" onClick={this.handleLogin}>
                        Login
                      </a>
                    </div>
                    <h2
                      style={{
                        textAlign: 'center',
                        margin: '8px',
                        color: '#666',
                      }}
                    >
                      Or
                    </h2>
                    <div className={styles.moreActions}>
                      <Button type="dashed"><LegacyIcon type="question-circle" /> Forgotten password </Button>
                      <Button type="dashed" ><LegacyIcon type="user-add" /> Create an account </Button>
                    </div>
                  
                  </div>
                )}
              </form>
            
          </main>
        </Drawer>
      </div>
    );
  }
}

YulioID.propTypes = {
  form: PropTypes.object,
  dispatch: PropTypes.func,
  loading: PropTypes.object,
  include: PropTypes.object,
}

export default YulioID
