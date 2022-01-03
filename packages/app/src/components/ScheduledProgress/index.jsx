import React from "react"
import moment from "moment"
import * as antd from "antd"
import classnames from "classnames"

import "./index.less"

const defaultDateFormat = "DD-MM-YYYY hh:mm"

export default class ScheduledProgress extends React.Component {
    isDateReached = (date) => {
        const format = this.props.dateFormat ?? defaultDateFormat
        const now = moment().format(format)
        const result = moment(date, format).isSameOrBefore(moment(now, format))

        console.debug(`[${date}] is before [${now}] => ${result}`)

        return result
    }

    getDiffBetweenDates = (start, end) => {
        // THIS IS NOT COUNTING WITH THE YEAR
        const format = "DD-MM-YYYY"

        const startDate = moment(start, format)
        const endDate = moment(end, format)
        const now = moment().format(format)

        // count days will took to complete
        const days = endDate.diff(startDate, "days")

        const daysLeft = endDate.diff(moment(now, format), "days")
        const daysPassed = moment(now, format).diff(startDate, "days")

        let percentage = 0

        switch (daysLeft) {
            case 0: {
                percentage = 99
                break
            }
            case 1: {
                percentage = 95
                break
            }
            default: {
                if (daysPassed > 0 && daysPassed < days) {
                    percentage = (daysPassed / days) * 100
                }
                break
            }
        }

        if (daysPassed > days) {
            percentage = 100
        }

        return { daysLeft, daysPassed, percentage }
    }

    render() {
        const startReached = this.isDateReached(this.props.start)
        const finishReached = this.isDateReached(this.props.finish)
        const datesDiff = this.getDiffBetweenDates(this.props.start, this.props.finish)

        return <div className="scheduled_progress">
            <div className={classnames("scheduled_progress point", "scheduled_progress point left", { ["reached"]: startReached })}>
                {this.props.start}
            </div>
            <antd.Progress
                size="small"
                percent={datesDiff.percentage}
                showInfo={false}
                className={classnames("ant-progress", {
                    startReached: startReached,
                    finishReached: finishReached,
                })}
                type="line"
            />
            <div className={classnames("point", "right", { reached: finishReached })}>
                {this.props.finish}
            </div>
        </div>
    }
}