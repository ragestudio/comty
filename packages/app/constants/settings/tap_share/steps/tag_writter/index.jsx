import React from "react"
import * as antd from "antd"

import AnimationPlayer from "components/AnimationPlayer"

import NFC_ERRORS from "../../errors"
import StepsContext from "../../context"

export default (props) => {
    const context = React.useContext(StepsContext)

    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState(null)

    const abortController = React.useRef(new AbortController())

    const handleWritter = async (error, tag) => {
        if (error) {
            console.error(error)

            setError(NFC_ERRORS.NFC_READ_ERROR)
            return false
        }

        setError(null)
        setLoading(true)

        if (tag.serialNumber !== context.values.serial) {
            setError(NFC_ERRORS.NFC_NOT_MATCH)

            setLoading(false)

            return false
        }

        app.cores.nfc.writeNdef({
            records: [{
                recordType: "url",
                data: context.values.endpoint_url
            }]
        }, {
            signal: abortController.current.signal
        }).then(() => {
            app.message.success("Tag written successfully.")
            setLoading(false)

            return context.next()
        })
            .catch((err) => {
                console.error(err)

                setError(NFC_ERRORS.NFC_WRITE_ERROR)
                setLoading(false)
            })
    }

    React.useEffect(() => {
        app.cores.nfc.subscribe(handleWritter)

        return () => {
            app.cores.nfc.unsubscribe(handleWritter)
            abortController.current.abort("finished")
        }
    }, [])

    return <div className="tap-share-register_step centered">
        <h1>
            Your tag is ready to write!
        </h1>

        <p>
            Tap your tag to your phone to write the data.
            <br />
            This is only necessary the first time you use your tag.
        </p>


        <h2 style={{
            opacity: loading ? 1 : 0,
            color: loading ? "red" : "inherit"
        }}>
            Please do not pick up the tag
        </h2>

        <AnimationPlayer
            src="https://storage.ragestudio.net/comty-static-assets/animations/nfc_tap.json"
            className={[
                {
                    ["loading"]: loading,
                    ["error"]: error
                }
            ]}
            loop
        />

        {
            error && <antd.Alert
                type="error"
                message={error}
            />
        }
    </div>
}