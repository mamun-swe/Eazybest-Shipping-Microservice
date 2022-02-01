
const Area = require("../../models/area.model")
const Division = require("../../models/division.model")
const District = require("../../models/district.model")
const Validator = require("../validators/division.validator")
const { RedisClient } = require("../cache")
const { isMongooseId } = require("../middleware/mongooseId.middleware")
const { PaginateQueryParams, Paginate } = require("../helpers/paginate.helper")

// List of items
const Index = async (req, res, next) => {
    try {
        const items = []
        const { query } = req.query
        const { limit, page } = PaginateQueryParams(req.query)

        if (query) {
            const searchResults = await Search(query)
            return res.status(200).json({
                status: true,
                data: searchResults
            })
        }

        const totalItems = await Division.countDocuments().exec()
        const results = await Division.find({}, { created_by: 0 })
            .sort({ _id: -1 })
            .skip((parseInt(page) * parseInt(limit)) - parseInt(limit))
            .limit(parseInt(limit))
            .exec()

        if (results && results.length > 0) {
            for (let i = 0; i < results.length; i++) {
                const element = results[i]
                items.push({
                    _id: element._id,
                    name: element.name,
                    bn_name: element.bn_name,
                    // is_deleteable: element.areas.length > 0 ? false : true
                })
            }
        }

        res.status(200).json({
            status: true,
            data: items,
            pagination: Paginate({ page, limit, totalItems })
        })
    } catch (error) {
        if (error) {
            console.log(error);
            next(error)
        }
    }
}

// Store item
const Store = async (req, res, next) => {
    try {
        const created_by = req.user.id
        const { name, bn_name } = req.body

        // Validate check
        const validate = await Validator.Store(req.body)
        if (!validate.isValid) {
            return res.status(422).json({
                status: false,
                message: validate.error
            })
        }

        // check exsting area
        const isExist = await Division.findOne({ name })
        if (isExist) {
            return res.status(409).json({
                status: false,
                message: `${name} already available.`
            })
        }

        const newDivision = new Division({
            name,
            bn_name,
            created_by
        })

        await newDivision.save()
        await RedisClient.flushdb()

        res.status(201).json({
            status: true,
            message: 'Successfully division created.'
        })
    } catch (error) {
        if (error) next(error)
    }
}

// Show specific item
const Show = async (req, res, next) => {
    try {
        const { id } = req.params

        await isMongooseId(id)
        const result = await Division.findById(id)
            // .populate("areas", "upazila upazila_bn_name post_office post_office_bn_name post_code")
            .exec()

        res.status(200).json({
            status: true,
            data: result
        })
    } catch (error) {
        if (error) next(error)
    }
}

// Update specific item
const Update = async (req, res, next) => {
    try {
        const { id } = req.params
        const {
            name,
            bn_name
        } = req.body

        await isMongooseId(id)

        // Validate check
        const validate = await Validator.Store(req.body)
        if (!validate.isValid) {
            return res.status(422).json({
                status: false,
                message: validate.error
            })
        }

        const isAvailable = await Division.findById(id)
        if (!isAvailable) {
            return res.status(404).json({
                status: false,
                message: "Division not available."
            })
        }

        await Division.findByIdAndUpdate(id,
            { $set: { name, bn_name } },
            { new: true }
        )
        await RedisClient.flushdb()

        res.status(200).json({
            status: true,
            message: "Successfully division updated."
        })
    } catch (error) {
        if (error) next(error)
    }
}

// Delete specific item
const Delete = async (req, res, next) => {
    try {
        const { id } = req.params

        await isMongooseId(id)

        const isAvailable = await Division.findById(id)
        if (!isAvailable) {
            return res.status(404).json({
                status: false,
                message: "Division not available."
            })
        }

        // if (isAvailable.areas.length > 0) {
        //     return res.status(403).json({
        //         status: false,
        //         message: "Division not deleteable, some area already available."
        //     })
        // }

        await Area.findOneAndDelete({ division: id })
        await District.findOneAndDelete({ division: id })
        await Division.findByIdAndDelete(id)
        await RedisClient.flushdb()

        res.status(200).json({
            status: true,
            message: "Successfully division deleted."
        })
    } catch (error) {
        if (error){
            console.log(error);
            next(error)
        }
    }
}

// Search items
const Search = async (query) => {
    try {
        const items = []

        const queryValue = new RegExp(query, 'i')
        const results = await Division.find(
            {
                $or: [
                    { name: queryValue },
                    { bn_name: queryValue }
                ]
            },
            { created_by: 0 }
        )
            .sort({ _id: -1 })
            .exec()

        if (results && results.length > 0) {
            for (let i = 0; i < results.length; i++) {
                const element = results[i]
                items.push({
                    _id: element._id,
                    name: element.name,
                    bn_name: element.bn_name,
                    is_deleteable: element.areas.length > 0 ? false : true
                })
            }
        }

        return items
    } catch (error) {
        if (error) return []
    }
}

module.exports = {
    Index,
    Store,
    Show,
    Update,
    Delete
}