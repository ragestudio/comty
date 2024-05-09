export default async () => {
    global.websocket.io.of("/").emit("new", {
        hi: "hola xd"
    })
    
    return {
        hi: "hola xd"
    }
}