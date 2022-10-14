export default async (additions, obj) => {
    let query = []

    if (Array.isArray(additions)) {
        query = additions
    }else {
        query.push(additions)
    }

    for await(let addition of query) {
        try {
            let script = await import(`./handlers/${addition}.js`)
            script = script.default || script

            obj = await script(obj)
        } catch (error) {
            
        }
    }
    
    return obj
}