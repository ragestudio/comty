import cloudlink from '@nodecorejs/cloudlink'

let controllers = {
    TestController: {
        get: (req, res, next) => {
            console.log("Testing controller, it works!")
        }
    }
}

let endpoints = [
    {
        "path": "test",
        "controller": "TestController"
    },
]

cloudlink.register({
    origin: "localhost",
    originPort: 6050,
    listenPort: 5050,
    controllers,
    endpoints
})