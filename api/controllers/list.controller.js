
const Area = require("../../models/area.model")
const District = require("../../models/district.model")

// Area list
const AreaList = async (req, res, next) => {
    try {
        const results = await Area.find({}, { created_by: 0, createdAt: 0, updatedAt: 0 })
            .populate("district", "name bn_name")
            .exec()

        res.status(200).json({
            status: true,
            data: results
        })
    } catch (error) {
        if (error) next(error)
    }
}


module.exports = {
    AreaList
}