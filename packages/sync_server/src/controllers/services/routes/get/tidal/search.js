import TidalAPI from "@shared-classes/TidalAPI"

export default async (req, res) => {
    const query = req.query

    const response = await TidalAPI.search({
        query: query.query
    })
    
    return res.json(response)
}