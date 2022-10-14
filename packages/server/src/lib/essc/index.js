// random 5 digits number
const random5 = () => Math.floor(Math.random() * 90000) + 10000

// secure random 5 digits number
const random5Secure = () => {
    const random = random5()
    return random.toString().padStart(5, '0')
}

// aa-bbbbb-cccc
//* a: type (2 digits)
//* b: serial (5 digits)
//* c: manufacturer (4 digits)

const typesNumber = {
    "computers-desktop": [1],
    "computers-laptop": [2],
    "computers-tablet": [3],
    "computers-smartphone": [4],
    "networking": [5],
    "peripherals-printer": [6],
    "peripherals-monitor": [7],
}

export function genV1(params) {
    let { type, serial, manufacturer } = params // please in that order
    type = type.toLowerCase()
    
    let str = []

    // Type parsing
    let typeBuf = []

    if (typeof typesNumber[type] === "undefined") {
        typeBuf[0] = 0
        typeBuf[1] = "X"
    } else {
        typeBuf[0] = typesNumber[type][0]
        typeBuf[1] = typesNumber[type][1] ?? "X"
    }

    str.push(typeBuf.join(""))

    // Serial parsing
    // if serial is not defined, generate a random 4 digits number
    if (typeof serial === "undefined") {
        str.push(random5().toString())
    } else {
        // push last 5 digits of serial, if serial is not 5 digits, pad with 0
        let serialBuf = []
        
        serialBuf[0] = serial.slice(-5, -4) ?? "0"
        serialBuf[1] = serial.slice(-4, -3) ?? "0"
        serialBuf[2] = serial.slice(-3, -2) ?? "0"
        serialBuf[3] = serial.slice(-2, -1) ?? "0"
        serialBuf[4] = serial.slice(-1) ?? "0"

        str.push(serialBuf.join(""))
    }

    // Manufacturer parsing
    // abreviate manufacturer name to 4 letters
    if (typeof manufacturer === "undefined") {
        str.push("GENR")
    } else {
        str.push(manufacturer.slice(0, 4).toUpperCase())
    }

    return str.join("-")
}