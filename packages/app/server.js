const express = require("express")
const path = require("path")
const app = express()

const portFromArgs = process.argv[2]
let portListen = portFromArgs ? portFromArgs : 9000

app.use(express.static(path.join(__dirname, "dist")))

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "dist", "index.html"))
})

app.listen(portListen)
console.log(`🌐  Listening app in port [${portListen}]`)