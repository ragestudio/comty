import React from "react"
import { Skeleton } from "antd"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import ProcessString from "utils/processString"
import { Icons } from "components/Icons"

import "./index.less"

const LocationProcessRegexs = [
    {
        regex: /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi,
        fn: (key, result) => {
            return <a key={key} href={result[1]} target="_blank" rel="noopener noreferrer">{result[1]}</a>
        }
    }
]

export default (props) => {
    const eventId = props.match.params["id"]

    const [eventData, setEventData] = React.useState(null)

    const fetchEventData = async () => {
        const { data } = await app.api.customRequest("main", {
            method: "GET",
            url: `/featured_event/${eventId}`
        }).catch((err) => {
            console.error(err)
            app.message.error("Failed to fetch event data")

            return {
                data: null
            }
        })

        if (data) {
            try {
                data.announcement = JSON.parse(data.announcement)
                setEventData(data)
            } catch (error) {
                console.error(error)
                app.message.error("Failed to parse event data")
            }
        }
    }

    const renderDates = (dates) => {
        return <div className="dates">
            <div className="startsAt">
                {
                    dates[0]
                }
            </div>
            <span className="separator">
                to
            </span>
            <div className="endsAt">
                {
                    dates[1]
                }
            </div>
        </div>
    }

    console.log(eventData)

    React.useEffect(() => {
        fetchEventData()
    }, [])

    if (!eventData) {
        return <Skeleton active />
    }

    return <div className="event">
        <div className="header" style={eventData.announcement.backgroundStyle}>
            {eventData.announcement.logoImg &&
                <div className="logo">
                    <img src={eventData.announcement.logoImg} />
                </div>
            }
            <div className="title">
                <h1>{eventData.name}</h1>
                <h2>{eventData.announcement.description}</h2>
            </div>
        </div>

        <div className="content">
            <div className="panel">
                <div className="dates">
                    <Icons.Calendar /> {Array.isArray(eventData.dates) && renderDates(eventData.dates)}
                </div>

                <div className="location">
                    <Icons.MapPin /> {ProcessString(LocationProcessRegexs)(eventData.location)}
                </div>
            </div>

            <div className="panel">
                <div className="description">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {eventData.description}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    </div>
}