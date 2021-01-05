import React from 'react'
import * as antd from "antd";
import * as Icons from 'feather-reactjs'
import { connect } from 'umi'

@connect(({ app }) => ({ app }))
export default class RemoteActions extends React.Component{
    render(){
        const { selected, releases } = this.props.app
        
        const nonStableVersion = <p><Icons.Triangle /> This version of the application is a development build, so it is not stable, its use is discouraged</p>
        const errorGather = <p> <Icons.AlertCircle /> It seems that a problem has occurred when searching for a version of the application, check the status of the servers.</p>
        
        if (!releases || releases.length == 0) {
            return errorGather
        }
        
        if(selected.packagejson.stage == "dev"){
            return <div>
               <p>
                <Icons.Triangle /> We can't seem to find a compatible stable version for you.
               </p>
            </div>
        }
        
        return(
            <div>
                { selected.prerelease? nonStableVersion : null }
                <div className="container_actions" >
                  <div><antd.Button type="dashed" >Open on browser</antd.Button></div>
                  <div><antd.Button icon={<Icons.Download />} type="primary" >Download app</antd.Button></div>
                </div>
            </div>
        )
    }
}