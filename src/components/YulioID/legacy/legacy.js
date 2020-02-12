//****************************************|
//****       Yulio ID v1.6           *****|
//****************************************|
//
// @ Licensed by RageStudio(c) 2019 
// @ Build 03102019EU21700 F/WIAPIS
// @ https://api.ragestudio.net/RS-YIBTP
//
//****************************************|

import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'dva'
import { Button, Row, Form, Input, Drawer, Icon, Collapse, Select, Checkbox, Result, Layout, message, notification } from 'antd'
import { Trans, withI18n } from '@lingui/react'
import { setLocale } from 'utils'
import { UIFxPY, UIFxList, DevOptions, avilableSDCP } from 'ycore';
import { endpoints } from 'ycore';
import router from 'umi/router'
import $ from 'jquery';
import styles from './yid.scss';

// import {getUserData, getUserRGData, getRegister, getAuth, resetToken, processError, processSuccess, processRGSuccess, processJSON, processRGJSON} from './loginFunctions.js';

import Cookies from 'universal-cookie';
import Cryptr from 'cryptr';

const cookies = new Cookies();

const FormItem = Form.Item


const RenderInclude = ({data}) => {if (!data) {return null;}  else {return data;}}



@withI18n()
@connect(({ loading }) => ({ loading }))
@Form.create()
class YulioID extends PureComponent {
  
  constructor(props) {
    super()
    this.state = {
      // Drawers Visibility (Default on False)
      MainLoginVisible: false,
      NOTFdrawer: false,
      SOTFdrawer: false,
      RGSOTFdrawer: false,
      registerVisible: false,
      ForggotPasswordVisible: false,
      // Arrays 
      ErrorType: '',
      FailArray: '',
      username: '',
      password: '',
      server_key: '',
      access_token: '',
      user_data: [],
      ExceptionID: '',
      EXCPMS: '',
      CompleteFORM: '',
      TSDCP: '',
      user_id: '',
      api_response: {},
      api_response_ud: [],
      RGUsername: '',
      RGEmail: '',
      RGPassword: '',
      RGGender: '',
    }
    this.getAuth = this.getAuth.bind(this);
    this.getRegister = this.getRegister.bind(this);
    this.getUserData = this.getUserData.bind(this);
    this.initRegister = this.initRegister.bind(this);
    this.initFPassword = this.initFPassword.bind(this);
    this.cancelRegister = this.cancelRegister.bind(this);
    this.cancelRecoverPassword = this.cancelRecoverPassword.bind(this);
    this.closeNOTF = this.closeNOTF.bind(this);
    this.closeSOTF = this.closeSOTF.bind(this);
    this.closeRGSOTF = this.closeSOTF.bind(this);
    this.processSuccess = this.processSuccess.bind(this);
    this.processRGSuccess = this.processSuccess.bind(this);
    this.processJSON = this.processJSON.bind(this);
    this.processRGJSON = this.processJSON.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }
  // Handlers & others
  handleUsername(text) {
    this.setState({ username: text.target.value })
  }
  handlePassword(text) {
    this.setState({ password: text.target.value })
  }
  handleRGUsername(text) {
    this.setState({ RGUsername: text.target.value })
  }
  handleRGPassword(text) {
    this.setState({ RGPassword: text.target.value })
  }
  handleRGEmail(text) {
    this.setState({ RGEmail: text.target.value })
  }
  handleRGGender(Ivalue) {
    this.setState({ RGGender: Ivalue })
  }
  handleFPEmail(Ivalue) {
    this.setState({ FGEmail: Ivalue })
  }
  
  triggerNOTF() {
    this.setState({ NOTFdrawer: true });
  }
  closeNOTF() {
    this.setState({ NOTFdrawer: false });
  }

  triggerSOTF() {
    this.setState({ SOTFdrawer: true });
  }
  closeSOTF() {
    this.setState({ SOTFdrawer: false });
  }

  triggerRGSOTF() {
    this.setState({ RGSOTFdrawer: true });
  }
  closeRGSOTF() {
    this.setState({ RGSOTFdrawer: false });
  }

  cancelRegister() {
    this.setState({ registerVisible: false })
  }
  cancelRecoverPassword(){
    this.setState({ ForggotPasswordVisible: false })
  }

  initRegister() {
    var messageListener = message.loading('Initialising YulioID...', 1.5)
    { messageListener }
    if (DevOptions.DisableRegister == false) {
      this.setState({ registerVisible: true })
    }
    else {
      messageListener.then(() => message.error('Cannot connect to YulioID Services (Disabled Register)', 2.5))
    }
  }

  initFPassword() {
    var messageListener = message.loading('Initialising YulioID...', 1.5)
    { messageListener }
    if (DevOptions.DisablePasswordRecover == false) {
      this.setState({ ForggotPasswordVisible: true })
    }
    else {
      messageListener.then(() => message.error('Cannot connect to YulioID Services (Disabled Password Recovery)', 2.5))
    }
  }
  ValidateSession() {
    if (DevOptions.DisableLogin == false) {
      this.setState({ MainLoginVisible: true })
    }
    else {
      message.error('Error trying to connect to YulioID services', 2.5)
      $("#ErrorNotification").css({ display: 'block' })
    }
  }

  componentDidMount() {
    // INIT   
    this.setState({ server_key: endpoints.server_key });
    this.ValidateSession();

    const istoken = localStorage.getItem('access_token');
    const isdone = this.state.CompleteFORM;
    const getSDCP = localStorage.getItem('SDCP');
    const availableToken = cookies.get('access_token')
    if (availableToken) {
      this.resetToken()
      
    }

    if (isdone == 'true') {
      setTimeout(() => { location.reload() }, 3000);
    }
    if (!getSDCP) {
      localStorage.setItem('GetNewData', true);
    }
  }

  resetToken() {
    let _this = this;
    const tojb1 = endpoints.removeToken;
    const tobj2 = cookies.get('access_token')
    let urlOBJ = `${tojb1}${tobj2}`;
    UIFxPY(UIFxList.notifyWarning)
    var form = new FormData();
    form.append("server_key", endpoints.server_key);


    var settings = {
      "url": urlOBJ,
      "method": "POST",
      "timeout": 0,
      "processData": false,
      "mimeType": "multipart/form-data",
      "contentType": false,
      "data": form
    };
    $.ajax(settings).done(function (response) {
      notification.open({
        placement: 'topLeft',
        message: 'For continue your request, is necessary to login with YulioID™ again',
        description:
          'LoginBridge™ report a access token expiration, and is required you for continue login again with security reasons.',
        icon: <Icon type="login" style={{ color: '#108ee9' }} />,
      });
      cookies.remove('access_token', { path: '/' })
    });
  }
  getUserData() {
    const nonProccesContainer = this.state.api_response;
    const IdFromLRApi = JSON.parse(nonProccesContainer)['user_id'];
    const getStoragedToken = JSON.parse(nonProccesContainer)['access_token'];

    var form2 = new FormData();
    form2.append("server_key", endpoints.server_key);
    form2.append("fetch", "user_data,email,username,avatar");
    form2.append("user_id", IdFromLRApi);

    let _this = this;
    const yCore_GUDEP = endpoints.get_userData_endpoint;
    let urlOBJ = `${yCore_GUDEP}${getStoragedToken}`;

    var settings2 = {
      "url": urlOBJ,
      "method": "POST",
      "timeout": 0,
      "processData": false,
      "mimeType": "multipart/form-data",
      "contentType": false,
      "data": form2
    };
    $.ajax(settings2)
      .done(function (response2) {
        _this.setState({ api_response_ud: response2 }),
          _this.processSuccess();
      })
  }
  getUserRGData() {
    const nonProccesContainer = this.state.api_response;
    const IdFromLRApi = JSON.parse(nonProccesContainer)['user_id'];
    const getStoragedToken = JSON.parse(nonProccesContainer)['access_token'];

    var form2 = new FormData();
    form2.append("server_key", endpoints.server_key);
    form2.append("fetch", "user_data,email,username,avatar");
    form2.append("user_id", IdFromLRApi);

    let _this = this;
    const yCore_GUDEP = endpoints.get_userData_endpoint;
    let urlOBJ = `${yCore_GUDEP}${getStoragedToken}`;

    var settings2 = {
      "url": urlOBJ,
      "method": "POST",
      "timeout": 0,
      "processData": false,
      "mimeType": "multipart/form-data",
      "contentType": false,
      "data": form2
    };

    $.ajax(settings2)
      .done(function (response2) {
        _this.setState({ api_response_ud: response2 }),
          _this.processRGSuccess();
      })


  }

  getRegister() {
    $("#loadingRGspn").css({ opacity: 1, "z-index": 5 });
    const username = this.state.RGUsername;
    const password = this.state.RGPassword;
    const email = this.state.RGEmail;
    const confirm_password = this.state.RGPassword;
    const server_key = this.state.server_key;

    var form = new FormData();

    form.append("server_key", server_key);
    form.append("username", username);
    form.append("email", email);
    form.append("password", password);
    form.append("confirm_password", confirm_password);

    var settings = {
      "url": endpoints.register_endpoint,
      "method": "POST",
      "timeout": 0,
      "processData": false,
      "mimeType": "multipart/form-data",
      "contentType": false,
      "data": form,
    };

    let _this = this;
    $.ajax(settings)
      .done(function (response) {
        _this.setState({ api_response: response }),
          _this.processRGJSON();
      })
      .fail(function (response) {

        _this.setState({
          FailArray: 'Server Failure',
          ErrorType: '1',
          api_response: 'Cannot catch response, Error 500',
          ExceptionID: '500',
          EXCPMS: 'Cannot catch response, Error 500',

        }),
          $("#loadingRGspn").css({ opacity: 0, "z-index": -1 }),
          _this.triggerNOTF();
      })
  }

 RecoverPassword(inputIO){
    const cookies = new Cookies();
    let _this = this;
    const tojb1 = endpoints.resetPassword_endpoint;
    const tobj2 = cookies.get('access_token')
    let urlOBJ = `${tojb1}${tobj2}`;
    UIFxPY(UIFxList.notifyWarning)
    var form = new FormData();
    form.append("server_key", endpoints.server_key);
    form.append("email", inputIO);
  
    var settings = {
      "url": urlOBJ,
      "method": "POST",
      "timeout": 0,
      "processData": false,
      "mimeType": "multipart/form-data",
      "contentType": false,
      "data": form
    };
    $.ajax(settings).done(function (response) {
      notification.open({
        placement: 'topLeft',
        message: 'The instructions to recover your account have been sent to the email',
        description:
          'If you cant find the email, try looking for it in the spam folder or try again',
        icon: <Icon type="mail" style={{ color: '#108ee9' }} />,
      });
      console.log(response)
    });
  }

  getAuth() {
    $("#loadingspn").css({ opacity: 1, "z-index": 5 });
    const username = this.state.username;
    const password = this.state.password;
    const server_key = this.state.server_key;

    var form = new FormData();

    form.append("server_key", server_key);
    form.append("username", username);
    form.append("password", password);
    var settings = {
      "url": endpoints.auth_endpoint,
      "method": "POST",
      "timeout": 0,
      "processData": false,
      "mimeType": "multipart/form-data",
      "contentType": false,
      "data": form,
    };

    let _this = this;
    $.ajax(settings)
      .done(function (response) {
        _this.setState({ api_response: response }),
          _this.processJSON();
      })
      .fail(function (response) {

        _this.setState({
          FailArray: 'Server Failure',
          ErrorType: '1',
          api_response: 'Cannot catch response, Error 500',
          ExceptionID: '500',
          EXCPMS: 'Cannot catch response, Error 500',

        }),
          notification.open({
            placement: 'topLeft',
            message: 'Currently our servers are having operating problems',
            description: 'Please be patient until the services become available again, try again later. We apologize for the inconveniences',
            icon: <Icon type="login" style={{ color: '#ff0f2f' }} />
          }),
          $("#loadingspn").css({ opacity: 0, "z-index": -1 }),
          _this.triggerNOTF();
      })


  }

  processError() {
    const nonProccesContainer = this.state.api_response;
    const stringParsed = JSON.parse(nonProccesContainer)['api_status'];
    const ExceptionMensage = JSON.parse(this.state.api_response)['errors'];
    const ExcepID = ExceptionMensage.error_id;
    const ExceptionMensagePRC = ExceptionMensage.error_text;

    if (stringParsed == '400') {
      this.triggerNOTF();
      this.setState({ FailArray: 'Bad credentials' });
      this.setState({
        ErrorType: stringParsed,
        ExceptionID: ExcepID
      });
      $("#loadingspn").css({ opacity: 0, "z-index": -1 });
      $("#loadingRGspn").css({ opacity: 0, "z-index": -1 });
      this.setState({ EXCPMS: ExceptionMensagePRC });
    }
    if (stringParsed == '404') {
      this.triggerNOTF();
      this.setState({ ErrorType: stringParsed });
      $("#loadingspn").css({ opacity: 0, "z-index": -1 });
      $("#loadingRGspn").css({ opacity: 0, "z-index": -1 });
      this.setState({ EXCPMS: ExceptionMensagePRC });
    }
  }

  processSuccess() {
    // CREATE SDCP PACKAGE
    const nonProccesContainer = this.state.api_response;
    const accessTokesParsed = JSON.parse(this.state.api_response)['access_token'];
    const userDataParsed = JSON.parse(this.state.api_response_ud)['user_data'];
    this.setState({ user_data: userDataParsed });
    const proccessForParse = JSON.stringify(this.state.user_data);
    const icryptr = new Cryptr(accessTokesParsed);
    const encryptedString = icryptr.encrypt(proccessForParse);

    this.setState({ access_token: accessTokesParsed, TSDCP: encryptedString });

    cookies.set('access_token', accessTokesParsed, { path: '/' });
    cookies.set('last_api_response', nonProccesContainer, { path: '/' });
    cookies.set('last_api_response_ud', (this.state.TSDCP), { path: '/' });

    localStorage.setItem('UIfx', 0.6);
    localStorage.setItem('SDCP', (this.state.TSDCP));

    const usernameST = this.state.username;

    this.triggerSOTF();

    const userID = JSON.parse(proccessForParse)['user_id'];
    let avatar = JSON.parse(proccessForParse)['avatar'];

    const { dispatch } = this.props;
    let dispatchPayloadValue = { userID, usernameST, avatar, accessTokesParsed };
    setTimeout(function () { dispatch({ type: 'login/login', payload: dispatchPayloadValue }) }, 1300)
    UIFxPY(UIFxList.notifySuccess, 0.5);
    console.log('%c 🎉 Your data has been storaged in SDCP with this values 🎉 =>', 'background: orange; font-size: 16px; color: white; display: block;', dispatchPayloadValue);

  }
  processRGSuccess() {
    // CREATE SDCP PACKAGE
    const nonProccesContainer = this.state.api_response;
    const accessTokesParsed = JSON.parse(this.state.api_response)['access_token'];
    const userDataParsed = JSON.parse(this.state.api_response_ud)['user_data'];
    this.setState({ user_data: userDataParsed });
    const proccessForParse = JSON.stringify(this.state.user_data);
    const icryptr = new Cryptr(accessTokesParsed);
    const encryptedString = icryptr.encrypt(proccessForParse);

    this.setState({ access_token: accessTokesParsed, TSDCP: encryptedString });

    cookies.set('access_token', accessTokesParsed, { path: '/' });
    cookies.set('last_api_response', nonProccesContainer, { path: '/' });
    cookies.set('last_api_response_ud', (this.state.TSDCP), { path: '/' });

    localStorage.setItem('UIfx', 0.6);
    localStorage.setItem('SDCP', (this.state.TSDCP));

    const usernameST = this.state.RGUsername;

    this.triggerRGSOTF();

    const userID = JSON.parse(proccessForParse)['user_id'];
    const identADMINType = JSON.parse(proccessForParse)['admin'];
    const identDEVELOPERType = JSON.parse(proccessForParse)['dev'];

    let avatar = JSON.parse(proccessForParse)['avatar'];

    const { dispatch } = this.props;
    let dispatchPayloadValue = { userID, usernameST, avatar, accessTokesParsed };
    setTimeout(function () { dispatch({ type: 'login/login', payload: dispatchPayloadValue }) }, 1300)
    UIFxPY(UIFxList.notifySuccess, 0.3);
    console.log('%c 🎉 Your data has been storaged in SDCP with this values 🎉 =>', 'background: orange; font-size: 16px; color: white; display: block;', dispatchPayloadValue);

  }

  processJSON() {
    const nonProccesContainer = this.state.api_response;
    const stringParsed = JSON.parse(nonProccesContainer);
    const identStatus = JSON.parse(nonProccesContainer)['api_status'];
    if (DevOptions.InfiniteLogin == false) {
      if (identStatus == '400') {
        this.processError();
      }

      if (identStatus == '200') {
        this.getUserData();
      }
    }
  }

  processRGJSON() {
    const nonProccesContainer = this.state.api_response;
    const stringParsed = JSON.parse(nonProccesContainer);
    const identStatus = JSON.parse(nonProccesContainer)['api_status'];
    if (identStatus == '400') {
      $("#loadingRGspn").css({ opacity: 0, "z-index": -1 }),
        this.processError();
    }

    if (identStatus == '200') {
      this.getRGUserData();
    }

  }
  
  handleKeyDown = (e) => {
    const _this = this;
    if (e.key === 'Enter') {
     this.getAuth
    }
  }




  render() {
    const { loading, form, i18n, include} = this.props
    const ErrorType = this.state.ErrorType;
    const MensageException = this.state.EXCPMS;
    const ExceptionID = this.state.ExceptionID;
    const { Panel } = Collapse;

    const { getFieldDecorator } = this.props.form;

    return (
      <div>
        <div id='ErrorNotification' style={{ display: 'none', marginTop: '15%' }}><Result status="error" title="There are some problems with your operation." /></div>


        {/* LOGIN SECTION */}
        <Drawer width={520} closable={false} visible={this.state.MainLoginVisible}>

          <main className={styles.mainlp}>
            <section className={styles.forms}>

              <h6 className={styles.h6lp}>YulioID&trade;</h6>
              <h1 className={styles.h1lp}>Welcome Back !</h1>
          

              <form className={styles.formlogin}>

                <div className={styles.input__wrapper}>

                  <label className={styles.labelform}><Icon type="user" style={{ fontSize: '15px' }} /> Username</label>
                  <FormItem hasFeedback>{getFieldDecorator('Username', { rules: [{ required: true }] })(
                    <input className={styles.inputform} type="text" onKeyDown={this.handleKeyDown} placeholder="Username" onChange={(text) => { this.handleUsername(text) }} />
                  )}
                  </FormItem>
                </div>

                <div className={styles.input__wrapper}>
                  <label className={styles.labelform}><Icon type="unlock" style={{ fontSize: '15px' }} /> Password</label>
                  <FormItem hasFeedback>{getFieldDecorator('Password', { rules: [{ required: true }] })(
                    <input className={styles.inputform} type="password" onKeyDown={this.handleKeyDown} dplaceholder="Password (At least 8 characters)" onChange={(text) => { this.handlePassword(text) }} />
                  )}
                  </FormItem>
                </div>

                <div style={{ margin: 'auto' }}><a className={styles.buttonlp} id="login" onClick={this.getAuth}  >Login</a></div>
                <h2 style={{ textAlign: 'center', margin: '8px', color: '#666' }}>Or</h2>
                <div style={{ float: 'left' }}><Button type="dashed" onClick={this.initFPassword} style={{ top: '8px' }}><Icon type="exclamation-circle" /> Forgotten password</Button></div>
                <div style={{ float: 'right' }}><Button type="dashed" onClick={this.initRegister} style={{ top: '8px' }}><Icon type="user-add" /> Create an account</Button></div><br/><br/>
                <div style={{ textAlign: 'center', margin: '20px' }}> <RenderInclude data={include} /></div>
                <div className={styles.spinner__wrapper} id="loadingspn">
                  <div><Icon type="loading" style={{ fontSize: 24, margin: '13px' }} spin /></div>
                  <div>
                    <br /><br /><br />
                    <div style={{ margin: 'auto' }}><h6 className={styles.h6lp} style={{ textAlign: 'center', marginTop: '15%' }}>Wait a sec...</h6></div>

                  </div>

                </div>
              </form>

            </section>



          </main>

        </Drawer>

        {/* REGISTER SECTION */}
        <Drawer width={680} closable={true} onClose={this.cancelRegister} visible={this.state.registerVisible}>
          <main className={styles.mainlp}>
            <section className={styles.forms}>
              <h6 className={styles.h6lp}>YulioID&trade;</h6>
              <h1 className={styles.h1lp}>Register</h1>
              <h3>Wow congratulations, very soon you will begin to discover rStudio, but first you will have to start by filling out this form</h3>
              <form className={styles.formlogin}>
                <div className={styles.inputRG__wrapper}>
                  <label className={styles.labelform}> Choose your Username</label>
                  <FormItem hasFeedback>{getFieldDecorator('rgUsername', { rules: [{ required: true }] })(
                    <Input type="text" prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="Username" onChange={(text) => { this.handleRGUsername(text) }} />
                  )}
                  </FormItem>
                </div>
                <div className={styles.inputRG__wrapper}>
                  <label className={styles.labelform}> Fill with your email</label>
                  <FormItem hasFeedback>{getFieldDecorator('rgEmail', { rules: [{ required: true }] })(
                    <Input type="text" prefix={<Icon type="link" style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="Email" onChange={(text) => { this.handleRGEmail(text) }} />
                  )}
                  </FormItem>
                </div>
                <div className={styles.inputRG__wrapper}>
                  <label className={styles.labelform}> Fill with your password</label>
                  <FormItem hasFeedback>{getFieldDecorator('rgPassword', { rules: [{ required: true }] })(
                    <Input type="password" prefix={<Icon type="key" style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="Password" onChange={(text) => { this.handleRGPassword(text) }} />
                  )}
                  </FormItem>
                </div>
                <div className={styles.inputRG__wrapper}>
                </div>
                <div className={styles.TOSAccept}><span><span style={{ color: 'red', fontSize: '17px' }}>*</span> Clicking the register button you accept our <a href="#">terms and conditions</a></span> </div>
                <a className={styles.buttonlp} id="register" onClick={this.getRegister}>Register</a>
                <div className={styles.spinner__wrapper} id="loadingRGspn">
                  <div style={{ position: 'absolute', marginLeft: '86%', marginTop: '-65%' }}><Icon type="loading" style={{ fontSize: 24 }} spin /></div>
                  <div>
                    <div><Icon style={{ fontSize: '160px', margin: '30px', color: '#5B2A86' }} type="smile" /></div>
                    <h6 className={styles.h6lp} style={{ textAlign: 'center' }}>Ok thanks, wait a minute...</h6>
                  </div>
                </div>
              </form>
            </section>
          </main>
        </Drawer>

        {/*  FORGOTTEN PASSWORD SECTION */}
        <Drawer width={420} closable={true} onClose={this.cancelRecoverPassword} visible={this.state.ForggotPasswordVisible}>
          <main className={styles.mainlp}>
            <section className={styles.forms}>
              <h6 className={styles.h6lp}>YulioID&trade;</h6>
              <h1 className={styles.h1lp}>Forgotten Password!</h1>
              <h3>To recover your account enter the email used to register</h3>
              <form className={styles.formlogin}>
                <div className={styles.input__wrapper}>
                  <label className={styles.labelform}><Icon type="mail" style={{ fontSize: '15px' }} /> Email</label>
                  <FormItem hasFeedback>{getFieldDecorator('Email', { rules: [{ required: true }] })(
                    <input className={styles.inputform} type="text" placeholder="myaccount@example.com" onChange={(text) => { this.handleFPEmail(text) }} /> )}
                  </FormItem>
                </div>
                {/* <div style={{ margin: 'auto' }}><a className={styles.buttonlp} id="login" onClick={this.RecoverPassword(this.state.FGEmail)}>Recover</a></div> */}
                <div className={styles.spinner__wrapper} id="loadingspn">
                  <div><Icon type="loading" style={{ fontSize: 24, margin: '13px' }} spin /></div>
                  <div>
                    <br /><br /><br />
                    <div style={{ margin: 'auto' }}><h6 className={styles.h6lp} style={{ textAlign: 'center', marginTop: '15%' }}>Wait a sec...</h6></div>
                  </div>
                </div>
              </form>
            </section>
          </main>
        </Drawer>

        {/* NOTF */}
        <Drawer width={320} closable={false} visible={this.state.NOTFdrawer} >
          <div style={{ textAlign: 'center', color: 'orange' }}  ><Icon type="warning" style={{ fontSize: '230px' }} />
            <h2 className={styles.h2lp}> {this.state.FailArray} </h2>
            <h4 className={styles.apierrort}> {MensageException} </h4> <hr />
            <div id="details-collapse" style={{ textAlign: 'center' }}>
              <Collapse bordered={false} defaultActiveKey={['0']} expandIcon={({ isActive }) => <Icon type="caret-right" rotate={isActive ? 90 : 0} />}>
                <Panel header="Details" key="1" style={{ borderRadius: 4, marginBottom: 24, border: 0, overflow: 'hidden', }}>
                  <Icon type="exception" />
                  <h6>STATUS HANDLER  => {this.state.ErrorType}  </h6>
                  <h6>EXCEPTION => {this.state.api_response}  </h6>
                  <h6>EXCEPTION MENSAGE => {MensageException}</h6>
                  <h6><strong>ID {ExceptionID}</strong></h6>
                </Panel>
              </Collapse>
              <hr /><Button type="danger" onClick={this.closeNOTF}>TRY AGAIN</Button>
            </div>
          </div>
        </Drawer>


        {/* SOTF */}
        <Drawer width={320} closable={false} visible={this.state.SOTFdrawer}>
          <div style={{ textAlign: 'center', color: '#4BB543' }}  ><Icon type="check" style={{ fontSize: '200px' }} />
            <h2 className={styles.h2lp} style={{ color: '#4BB543' }}  > Success </h2>
            <h4>Please wait while process your data ...</h4>
          </div>
        </Drawer>
        {/* RGSOTF */}
        <Drawer width={320} closable={false} visible={this.state.RGSOTFdrawer}>
          <div style={{ textAlign: 'center', color: 'green' }}  >
            <Icon type="check" style={{ fontSize: '200px' }} />
            <h2 className={styles.h2lp} style={{ color: 'green' }}  > Registered </h2>
            <h4 className={styles.apierrort}> Welcome to Dashboard, you will start discovering now</h4>
            <h4>Please check your new data while we are process you ...</h4>
          </div>
        </Drawer>
      </div>
    )
  }
}

YulioID.propTypes = {
  form: PropTypes.object,
  dispatch: PropTypes.func,
  loading: PropTypes.object,
  include: PropTypes.object,
}

export default YulioID
