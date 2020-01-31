import React, { Component } from 'react';
import { getRandomBG } from 'ycore';
import { YulioID } from 'components';
let imgRend;

class Login extends Component {
  constructor(props){
    super(props)
    this.state = {
      // Setting default method
      type: 'stable'
    }
    this.changeMethod = this.changeMethod.bind(this);
  }

  componentDidMount(){
  // INIT   
  var arrayBg = new Array();
  arrayBg[0] = "bg-1-an";
  arrayBg[1] = "bg-2-an";
  arrayBg[2] = "bg-3-an";
  arrayBg[3] = "bg-4-an";
  arrayBg[4] = "bg-5-an";
  arrayBg[5] = "bg-6-an";
  arrayBg[6] = "bg-1-an";
  imgRend = getRandomBG(arrayBg)
  }

  changeMethod() {
    this.setState({type: 'stable'})
  }
  render() {
    const { type } = this.state;
    return (
     <YulioID include={<div>Using stable</div>} />
     )
  }
}

export default Login
