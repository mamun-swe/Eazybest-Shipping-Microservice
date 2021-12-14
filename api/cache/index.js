const redis = require("redis")
const REDIS_PORT = process.env.REDIS_PORT
const RedisClient = redis.createClient(REDIS_PORT)

// Area cache
const Area = async (req, res, next) => {
    try {
        const key = 'banners'
        RedisClient.get(key, (error, results) => {
            if (results) {
                return res.status(200).json({
                    status: true,
                    data: JSON.parse(results)
                })
            } else {
                next()
            }
        })
    } catch (error) {
        if (error) next(error)
    }
}