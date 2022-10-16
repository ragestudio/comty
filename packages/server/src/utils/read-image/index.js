import fs from "fs"
import jpeg from "jpeg-js"

export default (path) => {
    const buf = fs.readFileSync(path)
    const pixels = jpeg.decode(buf, true)

    return pixels
}