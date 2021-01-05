import * as antd from "antd";
import * as Icons from 'feather-reactjs'
import { LastestVersion, RemoteActions } from 'components'
import packagejson from 'packageJson'
import React from 'react'

export default class Landing extends React.Component{
  render(){
    return (
      <>
        <div className="container_top">
            <div className="container_wrapper" >

                <div className="floating_card">
                    <h1>Your new</h1>
                    <h4>prototype of an social network.</h4>
                    <div className="links_launcher" style={{ marginTop: "30px" }}>
                      <div><p onClick={() => window.open(packagejson.globalGit) }><Icons.GitHub /> Also it`s open source !</p></div>
                    </div>
                </div>

                <div className="floating_card">
                  <div className="float_divider">
                    <div>
                      <p style={{ fontSize: "18px" }}>Comty is an extensible & modular platform depends on your needs, you can find many functions and features, discover how!</p>
                      <antd.Button type="ghost" shape="round" >Tell me more</antd.Button>
                    </div>
                    <div>
                      <RemoteActions />
                      <LastestVersion />
                    </div>
                  </div>
                </div>

            </div>
        </div>
      </>
    )
  }
}