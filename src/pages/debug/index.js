import React from 'react'
import * as app from 'app'

export default class Debug extends React.Component{
 
    render(){
        return(
        <>
            <div>Debug</div><hr/>
            <button onClick={() => app.notify.fatal('Error test! sike')} >Send Critical error</button>
            <button onClick={() => {


            }}> start storage logs </button>
            <button onClick={() =>{
                app.logger.download();
            }}> Download logs </button>
        </>
        )
    }
}