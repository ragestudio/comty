import React from 'react'
import * as antd from 'antd'
import { connect } from 'umi'

@connect(({ app }) => ({ app }))
export default class InternalDebug extends React.Component{
    state = {
        internals: window.Internal
    }

    handleDispatch(){
        this.props.dispatch({
            type: "app/initializeInternal",
            payload: [
                {
                    id: "test",
                    payload: () => {
                        console.log("Hey i am alivee")
                    }
                }
            ]
        })
    }
    
    handleCallTest(){
        if (window.Internal.test != null) {
            window.Internal.test()            
        }
    }

    render(){
        return(
            <div>
                <antd.Card>
                    {JSON.stringify(this.state.internals) ?? "No internals to show"}      
                </antd.Card>       
                <div style={{ marginTop: "12px" }}>
                    <antd.Button onClick={() => this.handleDispatch()} > init example </antd.Button>
                    <antd.Button onClick={() => this.handleCallTest()} > Call test </antd.Button>  
                </div>
            </div>
        )
    }
}