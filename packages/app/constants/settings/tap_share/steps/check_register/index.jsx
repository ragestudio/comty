import React from "react"
import * as antd from "antd"
import NFCModel from "comty.js/models/nfc"

import AnimationPlayer from "components/AnimationPlayer"

import NFC_ERRORS from "../../errors"
import StepsContext from "../../context"

export default (props) => {
    const [error, setError] = React.useState(null)
    const [loading, setLoading] = React.useState(false)
    const context = React.useContext(StepsContext)

    const readTagRegister = async (error, data) => {
        if (error) {
            console.error(error)

            setError(NFC_ERRORS.NFC_READ_ERROR)

            return false
        }

        if (!data) {
            return false
        }

        setError(null)
        setLoading(true)

        console.log(data)

        const registerResult = await NFCModel.getTagBySerial(data.serialNumber).catch((err) => {
            if (err.response.status === 404) {
                return false
            }

            return {
                error: err,
                is_owner: false
            }
        })

        console.log(registerResult)

        setLoading(false)

        if (!registerResult) {
            // this means that the tag is not registered, step to the next step
            context.setValue("serial", data.serialNumber)

            unregisterScan()

            return context.next()
        } else {
            if (registerResult.error) {
                return setError("Cannot check if the tag is registered. Please try again.")
            }

            if (!registerResult.is_owner) {
                // this means that the tag is registered but not owned by the user
                return setError(NFC_ERRORS.NFC_NOT_OWNER)
            }

            context.setValue("serial", data.serialNumber)
            context.setValue("alias", registerResult.alias)
            context.setValue("behavior", registerResult.behavior)

            unregisterScan()

            return context.next()
        }
    }

    const unregisterScan = () => {
        app.cores.nfc.unsubscribe(readTagRegister)
    }

    React.useEffect(() => {
        app.cores.nfc.subscribe(readTagRegister)

        return () => {
            unregisterScan()
        }
    }, [])

    return <div className="tap-share-register_step centered">
        <AnimationPlayer
            src="https://storage.ragestudio.net/comty-static-assets/animations/nfc_tap.json"
            loop={true}
            className={[
                {
                    ["loading"]: loading,
                    ["error"]: error
                }
            ]}
        />

        {
            error && <antd.Alert
                type="error"
                message={error}
            />
        }

        <h1 style={{
            opacity: loading ? 0 : 1
        }}>
            Tap your tag to your phone
        </h1>

        {
            loading && <antd.Spin />
        }
    </div>
}