
const _ = require("lodash")
const District = require("../../models/district.model")
const Shipping = require("../../models/shipping.model")
const validator = require("../validators/shipping.validator")
const { RedisClient } = require("../cache")
const { isMongooseId } = require("../middleware/mongooseId.middleware")

/* District list */
const districtList = async (req, res, next) => {
    try {
        const results = await District.find({ "areas.0": { "$exists": true } }, { created_by: 0, createdAt: 0, updatedAt: 0 })
            .populate("areas", "upazila upazila_bn_name post_office post_office_bn_name post_code")
            .exec()

        /* Set data to cache */
        await RedisClient.setex("district-list", 3600, JSON.stringify(results))

        res.status(200).json({
            status: true,
            data: results
        })
    } catch (error) {
        if (error) next(error)
    }
}

/* Match shipping */
const matchShipping = async (req, res, next) => {
    try {
        const { post_code, items } = req.body

        /* Validate check */
        const validate = await validator.match(req.body)
        if (!validate.isValid) {
            return res.status(422).json({
                status: false,
                message: validate.error
            })
        }

        const shipping_charges_items = []

        let today = new Date()
        today.setUTCHours(0, 0, 0, 0)

        // const currentHour = new Date().getHours()
        // const currentMinute = new Date().getMinutes()

        for (let i = 0; i < items.length; i++) {
            const element = items[i]

            /* Check valid mongoose Id */
            await isMongooseId(element.product_id)

            let query = {}

            if (element.assign_to === "Brand") {
                query = { brands: { $in: [element.product_id] } }
            }

            if (element.assign_to === "Category") {
                query = { categories: { $in: [element.product_id] } }
            }

            if (element.assign_to === "Sub-category") {
                query = { sub_categories: { $in: [element.product_id] } }
            }

            if (element.assign_to === "Leaf-category") {
                query = { leaf_categories: { $in: [element.product_id] } }
            }

            if (element.assign_to === "Vendor") {
                query = { vendors: { $in: [element.product_id] } }
            }

            if (element.assign_to === "Product") {
                query = { products: { $in: [element.product_id] } }
            }

            if (element.assign_to === "Customer") {
                query = { customers: { $in: [element.product_id] } }
            }

            if (element.assign_to === "Anything") {
                query = { assign_to: "Anything" }
            }

            /* find shipping info */
            const shipping_info = await Shipping.findOne({
                $and: [
                    { ...query },
                    { "min_quantity": { "$lte": parseInt(element.quantity) } },
                    { "max_quantity": { "$gte": parseInt(element.quantity) } },
                    { "min_order_amount": { "$lte": parseInt(element.total_amount) } },
                    { "max_order_amount": { "$gte": parseInt(element.total_amount) } },
                    { "start_from": { "$lte": new Date(today) } },
                    { "end_to": { "$gte": new Date(today) } },

                    // { "start_time.hour": { "$lte": currentHour } },
                    // { "start_time.minute": { "$lte": currentMinute } },
                    // { "end_time.hour": { "$gte": currentHour } },
                    // { "end_time.minute": { "$gte": currentMinute } },
                ]
            })
                .populate("area")
                .exec()

            let calculated_shipping_charge = 0
            if (shipping_info && shipping_info.area && shipping_info.area.post_code === post_code) {

                /* Calculate flat amount */
                if (shipping_info.discount_type === "Flat") {
                    const value = element.shipping_charge - shipping_info.discount_amount
                    calculated_shipping_charge = value < 0 ? 0 : value
                }

                /* Calculate percentage amount */
                if (shipping_info.discount_type === "Percentage") {
                    calculated_shipping_charge = Math.ceil(element.shipping_charge - ((shipping_info.discount_amount * element.shipping_charge) / 100))
                }

                shipping_charges_items.push(calculated_shipping_charge)
            } else {
                shipping_charges_items.push(element.shipping_charge)
            }
        }

        res.status(200).json({
            status: true,
            shipping_charge: _.max(shipping_charges_items)
        })
    } catch (error) {
        if (error) next(error)
    }
}

module.exports = {
    districtList,
    matchShipping
}