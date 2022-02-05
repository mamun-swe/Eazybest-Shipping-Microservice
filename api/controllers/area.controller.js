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
            const searchResults = await Search(JSON.parse(req.query.query).query, JSON.parse(req.query.query).district)
            return res.status(200).json({
                status: true,
                data: searchResults
            })
        }

        const totalItems = await Area.countDocuments().exec()
        const results = await Area.find({},
            { created_by: 0 }
        ).populate('division')
            .populate('district')
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
            district,
            division
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
        await isMongooseId(division)

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
            division,
            created_by
        })

        // await District.findByIdAndUpdate(district, { $push: { areas: newArea._id } })
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
            .populate("division", "name bn_name")
            .exec()

        res.status(200).json({
            status: true,
            data: result
        })
    } catch (error) {
        if (error) {
            console.log(error);
            next(error)
        }
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
            district,
            division
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
        // const removeFromDistrict = await District.findByIdAndUpdate(
        //     isAvailable.district,
        //     { $pull: { "areas": { "$in": [new ObjectId(isAvailable._id)] } } },
        // )

        // if (!removeFromDistrict) {
        //     return res.status(500).json({
        //         status: false,
        //         message: "Something going wrong."
        //     })
        // }

        await Area.findByIdAndUpdate(id,
            {
                $set: {
                    upazila,
                    upazila_bn_name,
                    post_office,
                    post_office_bn_name,
                    post_code,
                    district,
                    division
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
        if (error) {
            console.log(error);
            next(error)
        }
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
        // await District.findByIdAndUpdate(
        //     isAvailable.district,
        //     { $pull: { "areas": { "$in": [new ObjectId(isAvailable._id)] } } },
        // )

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

const getAreaByDistrict = async (req, res, next) => {
    try {

        let items = req.body.items, data

        data = await Area.find({ district: { $in: [...items] } })
            .populate('district')
            .populate('division')

        res.status(200).json({
            status: true,
            data: data,
        })
    } catch (error) {
        if (error) {
            console.log(error);
            next(error)
        }
    }
}


// Search items
const Search = async (query, district) => {
    try {
        let items = []
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
            { created_by: 0 }
        )
            // .sort({ _id: -1 })
            .exec()

        if (results && results.length > 0) {
            for (let i = 0; i < results.length; i++) {
                const element = results[i]
                console.log(element);
                district.map(v => {
                    if (element.district == v) {
                        items.push({
                            _id:element._id,
                            upazila: element.upazila,
                            upazila_bn_name: element.upazila_bn_name,
                            post_office: element.post_office,
                            post_office_bn_name: element.post_office_bn_name,
                            post_code: element.post_code,
                            district: element.district,
                            division:element.district
                            // is_deleteable: element.areas.length > 0 ? false : true
                        })
                    }
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
    getAreaByDistrict,
    Delete
}