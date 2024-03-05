const clearQueryRegexs = [
    // remove titles with (feat. Something)
    new RegExp(/\(feat\..*\)/, "gi"),
    // remplace $ with S
    new RegExp(/\$/, "gi"),
    // remove special characters
    new RegExp(/[\(\)\[\]\$\&\*\#\@\!\%\+\=\_\-\:\;\'\"\,\.]/, "gi"),
    // remove words like "official video", "official audio", "official music video"
    new RegExp(/official\s(video|audio|music\svideo)/, "gi"),
]

export default async ({
    title,
    artist,
    sessionToken,
} = {}) => {
    let query = `${title} artist:${artist}`

    // run clear query regexs
    for (const regex of clearQueryRegexs) {
        query = query.replace(regex, "")
    }

    const { data } = await global.comty.instances.default({
        method: "GET",
        headers: {
            "Authorization": `Bearer ${sessionToken}`,
        },
        params: {
            query: query,
            type: "track",
        },
        url: "/sync/spotify/search",
    }).catch((error) => {
        console.error(error.response.data)

        return null
    })

    if (!data) {
        return null
    }

    return data.tracks.items[0].id
}