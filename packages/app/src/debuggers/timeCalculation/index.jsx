import React from "react"
import * as antd from "antd"

import momentTimezone from "moment-timezone"
import { DateTime } from "luxon"

const timezones = momentTimezone.tz.names()

import "./index.less"

export default (props) => {
    const [simulatedTime, setSimulatedTime] = React.useState(null)
    const [simlatedTimezone, setSimlatedTimezone] = React.useState(null)

    const localTimezone = momentTimezone.tz.guess()

    const setSimulatedTimezoneAsLocal = () => {
        setSimlatedTimezone(localTimezone)
    }

    const handleSimulatedTimeChange = (moment) => {
        // set with UTC time string and input simlatedTimezone
        const value = momentTimezone.tz(Date.now(), simlatedTimezone).format()

        setSimulatedTime(value)
    }

    const getTimezoneOfString = (value) => {
        const timezone = momentTimezone.tz(value).tz()

        return timezone
    }

    const calculateTimeAgo = (inputTime) => {
        if (!inputTime) {
            return "No time"
        }

        // calculate the absolute time ago between the input time and the current time using luxon, and return a string
        const inputTimezone = momentTimezone.tz(value).tz()

        const inputTimeInLocalTimezone = momentTimezone.tz(inputTime, inputTimezone).tz(localTimezone).format()

        const timeAgo = DateTime.fromISO(inputTimeInLocalTimezone).toRelative()

        return timeAgo
    }

    return <div className="timeCalculation">
        <h2>Adjust simulated params</h2>

        <div className="simulatedTimezone">
            <div className="field">
                <p>
                    Select a simulated a timezone
                </p>
                <antd.Select
                    value={simlatedTimezone}
                    onChange={setSimlatedTimezone}
                >
                    {timezones.map((timezone, index) => {
                        return <antd.Select.Option key={index} value={timezone}>
                            {timezone}
                        </antd.Select.Option>
                    })}
                </antd.Select>

                <antd.Button onClick={setSimulatedTimezoneAsLocal}>
                    Set current {localTimezone}
                </antd.Button>

                <p>
                    value: {simlatedTimezone}
                </p>
            </div>

            <div className="field">
                <p>
                    Set a simulated time
                </p>

                <antd.TimePicker
                    onChange={handleSimulatedTimeChange}
                />

                <p>
                    value: {simulatedTime}
                </p>
            </div>

            <div className="field">
                <antd.Input
                    onChange={(e) => setSimulatedTime(e.target.value)}
                    value={simulatedTime}
                />
            </div>
        </div>

        <h2>Resulting Data</h2>

        <div className="fromNow">
            <p>
                Time ago from now (in your timezone {localTimezone})
            </p>

            <p>
                {
                    calculateTimeAgo(simulatedTime)
                }
            </p>
        </div>
    </div>
}