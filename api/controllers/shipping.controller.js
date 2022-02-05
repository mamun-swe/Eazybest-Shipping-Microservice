
const axios = require("axios")
const Shipping = require("../../models/shipping.model")
const validator = require("../validators/shipping.validator")
const { RedisClient } = require("../cache")
const { isMongooseId } = require("../middleware/mongooseId.middleware")
const { PaginateQueryParams, Paginate } = require("../helpers/paginate.helper")
const { GetHourMinute, FormatDateWithAMPM } = require("../helpers/index.helper")

// List of items
const Index = async (req, res, next) => {
    try {
        let params = { ...req.query }
        const { limit, page } = PaginateQueryParams(req.query)

        if (params.limit) delete params.limit
        if (params.page) delete params.page

        if (Object.keys(params).length > 0) {
            const filterResults = await FilterByQueryParams(params)
            return res.status(200).json({
                status: true,
                data: filterResults
            })
        }

        const totalItems = await Shipping.countDocuments().exec()
        const results = await Shipping.find({},
            {
                title: 1,
                assign_to: 1,
                start_from: 1,
                end_to: 1,
                start_time: 1,
                end_time: 1,
                discount_type: 1,
            }
        )
            .populate('division')
            .populate('district')
            .populate('area')
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

function addHours(date, hours) {
    const newDate = new Date(date);
    newDate.setHours(newDate.getHours() + hours);
    return newDate;
}

const AllShippingInRange = async (req, res, next) => {
    try {
        const results = await Shipping.find({})
        .populate('division')
        .populate('district')
        .populate('area')

        let newDate = new Date()
        let newdate = addHours(newDate, 6)
        let data = []
        results.map(v => {
            // console.log(v.start_from,'startfrom', v.start_time,'start time', v.end_to, 'endTo', v.end_time,'endtime');
            let genDate = new Date(v.start_from.getFullYear(), v.start_from.getMonth(), v.start_from.getDate(), v.start_time.getHours(), v.start_time.getMinutes(), 0, 0)
            let genDate2 = new Date(v.end_to.getFullYear(), v.end_to.getMonth(), v.end_to.getDate(), v.end_time.getHours(), v.end_time.getMinutes(), 0, 0)
            // console.log(genDate, genDate2, newdate, '***');
            if (newdate >= genDate && newdate <= genDate2) {
                data.push(v)
            }
        })
        res.status(200).json({
            status: true,
            data: data,
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
            title,
            start_from,
            end_to,
            start_time,
            end_time,
            discount_type,
            discount_amount,
            assign_to,
            min_order_amount,
            max_order_amount,
            min_quantity,
            max_quantity,
            area,
            district,
            division,
            assign_items
        } = req.body

        // Validate check
        const validate = await validator.store(req.body)
        if (!validate.isValid) {
            return res.status(422).json({
                status: false,
                message: validate.error
            })
        }

        await isMongooseId(area)

        let today_start_time = new Date(start_from)
        let today_end_time = new Date(end_to)

        today_start_time.setUTCHours(GetHourMinute(start_time).hour, GetHourMinute(start_time).minute, 0, 0)
        today_end_time.setUTCHours(GetHourMinute(end_time).hour, GetHourMinute(end_time).minute, 0, 0)

        /* Check title alrady available */
        const is_available = await Shipping.findOne({ title })
        if (is_available) {
            return res.status(408).json({
                status: false,
                message: "Shipping title already available."
            })
        }

        // Assign items with assigned field
        let assignedItems = {}

        if (assign_to === "Anything") assignedItems = null
        if (assign_to === "Brand") assignedItems.brands = JSON.parse(assign_items)
        if (assign_to === "Category") assignedItems.categories = JSON.parse(assign_items)
        if (assign_to === "Sub-category") assignedItems.sub_categories = JSON.parse(assign_items)
        if (assign_to === "Leaf-category") assignedItems.leaf_categories = JSON.parse(assign_items)
        if (assign_to === "Vendor") assignedItems.vendors = JSON.parse(assign_items)
        if (assign_to === "Product") assignedItems.products = JSON.parse(assign_items)
        if (assign_to === "Customer") assignedItems.customers = JSON.parse(assign_items)

        const newShipping = new Shipping({
            title,
            start_from,
            end_to,
            start_time: today_start_time,
            end_time: today_end_time,
            discount_type,
            discount_amount,
            assign_to,
            min_order_amount,
            max_order_amount,
            min_quantity,
            max_quantity,
            area,
            district,
            division,
            created_by,
            ...assignedItems
        })

        // Save shipping
        await newShipping.save()
        await RedisClient.flushdb()

        res.status(201).json({
            status: true,
            message: 'Successfully shipping created.'
        })
    } catch (error) {
        if (error) {
            console.log(error);
            next(error)
        }
    }
}

// Show specific item
const Show = async (req, res, next) => {
    try {
        let item = {}
        let assigned_items = []
        const { id } = req.params
        await isMongooseId(id)

        const result = await Shipping.findById(id)
            .populate({
                path: "area",
                select: "upazila upazila_bn_name post_office post_office_bn_name post_code district",
                populate: {
                    path: "district",
                    select: "name bn_name"
                }
            })
            .populate('district')
            .populate('division')
            .exec()

        if (result) {

            const startHour = new Date(result.start_time).getHours()
            const startMinute = new Date(result.start_time).getMinutes()
            const endHour = new Date(result.end_time).getHours()
            const endMinute = new Date(result.end_time).getMinutes()

            // Assigned items 
            if (result.assign_to === "Anything") assigned_items = null
            if (result.assign_to === "Brand") assigned_items = result.brands
            if (result.assign_to === "Category") assigned_items = result.categories
            if (result.assign_to === "Sub-category") assigned_items = result.sub_categories
            if (result.assign_to === "Leaf-category") assigned_items = result.leaf_categories
            if (result.assign_to === "Vendor") assigned_items = result.vendors
            if (result.assign_to === "Product") assigned_items = result.products
            if (result.assign_to === "Customer") assigned_items = result.customers

            /* fetch items data from communicator */
            let assign_items_data = []
            const formData = {
                type: result.assign_to,
                items: assigned_items
            }

            const communicatorResponse = await axios.post(process.env.MODEL_COMMUNICATOR, formData)
            if (communicatorResponse && communicatorResponse.status === 200) {
                assign_items_data = communicatorResponse.data.data
            }

            item._id = result._id
            item.title = result.title
            item.assign_to = result.assign_to
            item.assign_items = assign_items_data
            item.start_from = result.start_from
            item.end_to = result.end_to
            item.start_time = startHour + ":" + startMinute
            item.end_time = endHour + ":" + endMinute
            item.discount_type = result.discount_type
            item.discount_amount = result.discount_amount
            item.min_order_amount = result.min_order_amount
            item.max_order_amount = result.max_order_amount
            item.min_quantity = result.min_quantity
            item.max_quantity = result.max_quantity
            item.area = result.area
            item.district = result.district
            item.division = result.division
            item.created_by = result.created_by
            item.created_at = FormatDateWithAMPM(result.createdAt)
            item.updated_at = FormatDateWithAMPM(result.updatedAt)
        }

        res.status(200).json({
            status: true,
            data: item
        })
    } catch (error) {
        if (error) {
            console.log(error)
            next(error)
        }
    }
}

// Update specific item
const Update = async (req, res, next) => {
    try {
        const { id } = req.params
        const {
            title,
            start_from,
            end_to,
            start_time,
            end_time,
            discount_type,
            discount_amount,
            assign_to,
            min_order_amount,
            max_order_amount,
            min_quantity,
            max_quantity,
            area,
            district,
            division,
            assign_items
        } = req.body

        // Validate check
        const validate = await validator.store(req.body)
        if (!validate.isValid) {
            return res.status(422).json({
                status: false,
                message: validate.error
            })
        }

        await isMongooseId(id)

        let today_start_time = new Date(start_from)
        let today_end_time = new Date(end_to)

        today_start_time.setUTCHours(GetHourMinute(start_time).hour, GetHourMinute(start_time).minute, 0, 0)
        today_end_time.setUTCHours(GetHourMinute(end_time).hour, GetHourMinute(end_time).minute, 0, 0)

        /* Check title alrady available */
        const is_available_title = await Shipping.findOne({ $and: [{ _id: { $ne: id } }, { title }] })
        if (is_available_title) {
            return res.status(408).json({
                status: false,
                message: "Shipping title already available."
            })
        }

        let new_items = {
            brands: null,
            categories: null,
            sub_categories: null,
            leaf_categories: null,
            vendors: null,
            products: null,
            customers: null
        }

        if (assign_to === "Anything") new_items = new_items
        if (assign_to === "Brand") new_items.brands = JSON.parse(assign_items)
        if (assign_to === "Category") new_items.categories = JSON.parse(assign_items)
        if (assign_to === "Sub-category") new_items.sub_categories = JSON.parse(assign_items)
        if (assign_to === "Leaf-category") new_items.leaf_categories = JSON.parse(assign_items)
        if (assign_to === "Vendor") new_items.vendors = JSON.parse(assign_items)
        if (assign_to === "Product") new_items.products = JSON.parse(assign_items)
        if (assign_to === "Customer") new_items.customers = JSON.parse(assign_items)

        const is_available = await Shipping.findById(id)
        if (!is_available) {
            return res.status(404).json({
                status: false,
                message: "Shipping not available."
            })
        }

        // Update shipping
        await Shipping.findByIdAndUpdate(id, {
            $set: {
                title,
                start_from,
                end_to,
                start_time: today_start_time,
                end_time: today_end_time,
                discount_type,
                discount_amount,
                assign_to,
                min_order_amount,
                max_order_amount,
                min_quantity,
                max_quantity,
                area,
                district,
                division,
                ...new_items
            }
        }).exec()
        await RedisClient.flushdb()

        res.status(201).json({
            status: true,
            message: 'Successfully shipping updated.'
        })
    } catch (error) {
        if (error) {
            console.log(error)
            next(error)
        }
    }
}

// Delete specific item
const Delete = async (req, res, next) => {
    try {
        const { id } = req.params
        await isMongooseId(id)

        const is_available = await Shipping.findById(id)
        if (!is_available) {
            return res.status(404).json({
                status: false,
                message: "Shipping not available."
            })
        }

        await Shipping.findByIdAndDelete(id)
        await RedisClient.flushdb()

        res.status(200).json({
            status: true,
            message: "Successfully shipping deleted."
        })
    } catch (error) {
        if (error) next(error)
    }
}

// Filter using query params
const FilterByQueryParams = async (queryParams) => {
    try {
        const items = []
        let query_obj = {}
        const params = { ...queryParams }

        for (const property in params) {
            if (Object.hasOwnProperty.call(params, property)) {
                const element = params[property]

                if (property === "start_from") {
                    query_obj[property] = { "$gte": new Date(new Date(element).setHours(00, 00, 00)) }
                }

                else if (property === "end_to") {
                    query_obj[property] = { "$lte": new Date(new Date(element).setHours(00, 00, 00)) }
                }

                else {
                    query_obj[property] = element
                }
            }
        }

        const results = await Shipping.find(
            { $and: [{ ...query_obj }] },
            {
                title: 1,
                assign_to: 1,
                start_from: 1,
                end_to: 1,
                start_time: 1,
                end_time: 1,
                discount_type: 1
            }
        )
            .sort({ _id: -1 })
            .exec()

        if (results && results.length > 0) {
            for (let i = 0; i < results.length; i++) {
                const element = results[i]
                items.push({
                    _id: element._id,
                    title: element.title,
                    assign_to: element.assign_to,
                    start_from: FormatDateWithAMPM(element.start_from),
                    end_to: FormatDateWithAMPM(element.end_to),
                    start_time: element.start_time,
                    end_time: element.end_time,
                    discount_type: element.discount_type
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
    AllShippingInRange,
    Store,
    Show,
    Update,
    Delete
}