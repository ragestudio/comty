import React from 'react'
import * as ycore from 'ycore'
import interact from 'interact.js'
import styles from './drag.css'
import reactable from 'reactablejs'
import Demo from './drag_t.tsx'

export default class __Drag extends React.PureComponent{
    render(){
        const Reactable = reactable(Demo);
  
        const BasicDemo = () => {
            const [coordinate, setCoordinate] = React.useState({  y: 0 });
            return (
              <Reactable
                draggable
                onDragMove={event => {
                  const { dy } = event;
                  setCoordinate(prev => ({
                    y: prev.y + dy,
                  }));
                }}
                y={coordinate.y}
              />
            );
          };
          
          
        return(
            <div>
                <h3>DRAG _TEST</h3>
                <button onClick={() => ycore.SwapMode.openFragment(<></>)} >Open drag</button>
                <hr/>
                <BasicDemo />
            </div>
        )
    }
}