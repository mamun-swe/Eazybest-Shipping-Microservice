const ObjectId = require("mongoose").Types.ObjectId
const Area = require("../../models/area.model")
const District = require("../../models/district.model")
const Validator = require("../validators/area.validator")
const { RedisClient } = require("../cache")
const { isMongooseId } = require("../middleware/mongooseId.middleware")
const { PaginateQueryParams, Paginate } = require("../helpers/paginate.helper")

// List of items
const Index = async (req, res, next) => {
    try {
        const { query } = req.query
        const { limit, page } = PaginateQueryParams(req.query)

        if (query) {
            const searchResults = await Search(query)
            return res.status(200).json({
                status: true,
                data: searchResults
            })
        }

        const totalItems = await Area.countDocuments().exec()
        const results = await Area.find({},
            { district: 0, created_by: 0 }
        )
            .sort({ _id: -1 })
            .skip((parseInt(page) * parseInt(limit)) - parseInt(limit))
            .limit(parseInt(limit))
            .exec()

        res.status(200).json({
            status: true,
            data: results,
            pagination: Paginate({ page, limit, totalItems })
        })
    } catch (error) {
        if (error) next(error)
    }
}

// Store item
const Store = async (req, res, next) => {
    try {
        const created_by = req.user.id
        const {
            upazila,
            upazila_bn_name,
            post_office,
            post_office_bn_name,
            post_code,
            district
        } = req.body

        // Validate check
        const validate = await Validator.Store(req.body)
        if (!validate.isValid) {
            return res.status(422).json({
                status: false,
                message: validate.error
            })
        }

        await isMongooseId(district)

        // check exsting area
        const isExist = await Area.findOne({ post_code })
        if (isExist) {
            return res.status(409).json({
                status: false,
                message: `Post code ${post_code} already available.`
            })
        }

        const newArea = new Area({
            upazila,
            upazila_bn_name,
            post_office,
            post_office_bn_name,
            post_code,
            district,
            created_by
        })

        await District.findByIdAndUpdate(district, { $push: { areas: newArea._id } })
        await newArea.save()
        await RedisClient.flushdb()

        res.status(201).json({
            status: true,
            message: 'Successfully area created.'
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
        const result = await Area.findById(id)
            .populate("district", "name bn_name")
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
            upazila,
            upazila_bn_name,
            post_office,
            post_office_bn_name,
            post_code,
            district
        } = req.body

        // Validate check
        const validate = await Validator.Store(req.body)
        if (!validate.isValid) {
            return res.status(422).json({
                status: false,
                message: validate.error
            })
        }

        await isMongooseId(id)

        const isAvailable = await Area.findById(id)
        if (!isAvailable) {
            return res.status(404).json({
                status: false,
                message: "Area not available."
            })
        }

        const isPostCodeAvailable = await Area.findOne({ $and: [{ post_code }, { _id: { $ne: id } }] })
        if (isPostCodeAvailable) {
            return res.status(409).json({
                status: false,
                message: `Post code ${post_code} already available.`
            })
        }

        // remove from district areas
        const removeFromDistrict = await District.findByIdAndUpdate(
            isAvailable.district,
            { $pull: { "areas": { "$in": [new ObjectId(isAvailable._id)] } } },
        )

        if (!removeFromDistrict) {
            return res.status(500).json({
                status: false,
                message: "Something going wrong."
            })
        }

        await Area.findByIdAndUpdate(id,
            {
                $set: {
                    upazila,
                    upazila_bn_name,
                    post_office,
                    post_office_bn_name,
                    post_code,
                    district
                }
            },
            { new: true }
        )

        // add to district areas
        await District.findByIdAndUpdate(district, { $push: { areas: isAvailable._id } })
        await RedisClient.flushdb()

        res.status(200).json({
            status: true,
            message: "Successfully area updated."
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

        const isAvailable = await Area.findById(id)
        if (!isAvailable) {
            return res.status(404).json({
                status: false,
                message: "Area not available."
            })
        }

        // Remove form district
        await District.findByIdAndUpdate(
            isAvailable.district,
            { $pull: { "areas": { "$in": [new ObjectId(isAvailable._id)] } } },
        )

        await Area.findByIdAndDelete(id)
        await RedisClient.flushdb()

        res.status(200).json({
            status: true,
            message: "Successfully area deleted."
        })
    } catch (error) {
        if (error) next(error)
    }
}

// Search items
const Search = async (query) => {
    try {
        const queryValue = new RegExp(query, 'i')
        const results = await Area.find(
            {
                $or: [
                    { upazila: queryValue },
                    { upazila_bn_name: queryValue },
                    { post_office: queryValue },
                    { post_office_bn_name: queryValue },
                    { post_code: queryValue }
                ]
            },
            { district: 0, created_by: 0 }
        )
            .sort({ _id: -1 })
            .exec()

        return results
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