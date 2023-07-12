import loadable from "@loadable/component"
import DOMPurify from "dompurify"
import axios from "axios"

export default loadable(async (props) => {
    // IMPORTANT: Only use this component for SVG files that you trust.
    console.warn("RemoteSVGToComponent: This component is not safe at all, cause use __dangerouslySetInnerHTML. Only use it for SVG files that you trust.")

    // make sure the url is local
    if (!props.src.startsWith("/") && !props.remote) {
        console.error("RemoteSVGToComponent: The file is not a local file.")
        return () => null
    }

    // make sure the file is a SVG
    if (!props.src.endsWith(".svg")) {
        console.error("RemoteSVGToComponent: The file is not a SVG.")
        return () => null
    }

    const response = await axios({
        method: "GET",
        url: props.src,
    }).catch((err) => {
        console.error(err)
        return false
    })

    if (!response) {
        return () => <></>
    }

    return () => <div dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(response.data, {
            USE_PROFILES: {
                svg: true
            }
        })
    }} />
})