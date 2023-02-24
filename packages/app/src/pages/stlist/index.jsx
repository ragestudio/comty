import React from "react"
import * as antd from "antd"
import { TransitionMotion, spring, presets } from "react-motion"

import "./index.less"

export default (props) => {
    const [data, setData] = React.useState([])

    const enterRandom = () => {
        setData(data.concat({
            key: Math.random(),
            data: {
                text: `Entry ${data.length + 1}`,
            }
        }))
    }

    const getDefaultStyles = () => {
        return data.map((todo) => ({
            ...todo,
            style: { height: 0, opacity: 1 }
        }))
    }

    const getStyles = () => {
        return data.map((todo, i) => {
            console.log(todo, i)
            return {
                ...todo,
                style: {
                    height: spring(60, presets.gentle),
                    opacity: spring(1, presets.gentle),
                }
            }
        })
    }

    const willEnter = () => {
        return {
            height: 0,
            opacity: 1,
        }
    }

    const willLeave = () => {
        return {
            height: spring(0),
            opacity: spring(0),
        }
    }

    return <div class="list">
        <antd.Button
            type="primary"
            onClick={enterRandom}
        >
            Add new
        </antd.Button>
        <TransitionMotion
            defaultStyles={getDefaultStyles()}
            styles={getStyles()}
            willLeave={willLeave}
            willEnter={willEnter}
        >
            {(styles) => {
                return <ul className="ullist">
                    {
                        styles.map(({ key, style, data }) =>
                            <li
                                key={key}
                                style={style}
                            >
                                <h1>{data.text}</h1>
                            </li>
                        )
                    }
                </ul>
            }}
        </TransitionMotion>
    </div>
}