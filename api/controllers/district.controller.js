
const Area = require("../../models/area.model")
const District = require("../../models/district.model")
const Validator = require("../validators/district.validator")
const { isMongooseId } = require("../middleware/mongooseId.middleware")
const { PaginateQueryParams, Paginate } = require("../helpers/paginate.helper")

// List of items
const Index = async (req, res, next) => {
    try {
        const items = []
        const { limit, page } = PaginateQueryParams(req.query)

        const totalItems = await District.countDocuments().exec()
        const results = await District.find({}, { created_by: 0 })
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
                    is_deleteable: element.areas.length > 0 ? false : true
                })
            }
        }

        res.status(200).json({
            status: true,
            data: items,
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
        const isExist = await District.findOne({ name })
        if (isExist) {
            return res.status(409).json({
                status: false,
                message: `${name} already available.`
            })
        }

        const newDistrict = new District({
            name,
            bn_name,
            created_by
        })

        await newDistrict.save()

        res.status(201).json({
            status: true,
            message: 'Successfully district created.'
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
        const result = await District.findById(id)
            .populate("areas", "upazila upazila_bn_name post_office post_office_bn_name post_code")
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

        const isAvailable = await District.findById(id)
        if (!isAvailable) {
            return res.status(404).json({
                status: false,
                message: "District not available."
            })
        }

        await District.findByIdAndUpdate(id,
            { $set: { name, bn_name } },
            { new: true }
        )

        res.status(200).json({
            status: true,
            message: "Successfully district updated."
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

        const isAvailable = await District.findById(id)
        if (!isAvailable) {
            return res.status(404).json({
                status: false,
                message: "District not available."
            })
        }

        if (isAvailable.areas.length > 0) {
            return res.status(403).json({
                status: false,
                message: "District not deleteable, some area already available."
            })
        }

        await Area.findOneAndDelete({ district: id })
        await District.findByIdAndDelete(id)

        res.status(200).json({
            status: true,
            message: "Successfully district deleted."
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