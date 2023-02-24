import loadable from "@loadable/component"
import DOMPurify from "dompurify"

export default loadable(async (props) => {
    // IMPORTANT: Only use this component for SVG files that you trust.
    console.warn("RemoteSVGToComponent: This component is not safe at all, cause use __dangerouslySetInnerHTML. Only use it for SVG files that you trust.")

    // make sure the url is local
    if (!props.src.startsWith("/")) {
        console.error("RemoteSVGToComponent: The file is not a local file.")
        return () => null
    }

    // make sure the file is a SVG
    if (!props.src.endsWith(".svg")) {
        console.error("RemoteSVGToComponent: The file is not a SVG.")
        return () => null
    }

    const response = await fetch(props.src, {
        headers: {
            "Content-Type": "image/svg+xml"
        }
    })

    if (!response.ok) {
        return () => <div>Error</div>
    }

    let svg = await response.text()

    svg = DOMPurify.sanitize(svg, {
        USE_PROFILES: {
            svg: true
        }
    })

    return () => <div dangerouslySetInnerHTML={{ __html: svg }} />
})