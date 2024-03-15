export default async () => {
    global.rtengine.io.of("/").emit("new", {
        hi: "hola xd"
    })
    
    return {
        hi: "hola xd"
    }
}