const ObjectId = require("mongoose").Types.ObjectId
const Area = require("../../models/area.model")
const District = require("../../models/district.model")
const Validator = require("../validators/area.validator")
const { isMongooseId } = require("../middleware/mongooseId.middleware")
const { PaginateQueryParams, Paginate } = require("../helpers/paginate.helper")


// List of items
const Index = async (req, res, next) => {
    try {
        const { limit, page } = PaginateQueryParams(req.query)

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

        await newArea.save()

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

        await isMongooseId(id)

        // Validate check
        const validate = await Validator.Store(req.body)
        if (!validate.isValid) {
            return res.status(422).json({
                status: false,
                message: validate.error
            })
        }

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
        const isRemovedFromDistrict = await District.findByIdAndUpdate(id, {
            $pull: { "areas": { "$in": [new ObjectId(id)] } }
        })

        await Area.findByIdAndDelete(id)

        res.status(200).json({
            status: true,
            message: "Successfully area deleted."
        })
    } catch (error) {
        if (error) next(error)
    }
}


module.exports = {
    Index,
    Store,
    Show,
    Update,
    Delete
}