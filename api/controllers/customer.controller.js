
const _ = require("lodash")
const axios = require("axios")
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
        const { id } = req.user
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
        let current_time = new Date()

        today.setUTCHours(0, 0, 0, 0)
        current_time.setUTCHours(current_time.getHours(), current_time.getMinutes(), 0, 0)

        for (let i = 0; i < items.length; i++) {
            const element = items[i]

            /* Check valid mongoose Id */
            await isMongooseId(element.product_id)

            const formData = {
                type: "Product",
                items: [element.product_id]
            }

            const communicatorResponse = await axios.post(process.env.MODEL_COMMUNICATOR, formData)
            if (!communicatorResponse && !communicatorResponse.status === 200) {
                return res.status(404).json({
                    status: false,
                    message: "Product not available."
                })
            }

            /* find shipping info */
            const shipping_info = await Shipping.findOne({
                $and: [
                    {
                        $or: [
                            { brands: { $in: [communicatorResponse.data.data[0].brand] } },
                            { categories: { $in: [communicatorResponse.data.data[0].mainCategory] } },
                            { sub_categories: { $in: [communicatorResponse.data.data[0].subCategory] } },
                            { leaf_categories: { $in: [communicatorResponse.data.data[0].leafCategory] } },
                            { vendors: { $in: [communicatorResponse.data.data[0].vendor] } },
                            { products: { $in: [communicatorResponse.data.data[0]._id] } },
                            { customers: { $in: [id] } },
                        ]
                    },
                    { "min_quantity": { "$lte": parseInt(element.quantity) } },
                    { "max_quantity": { "$gte": parseInt(element.quantity) } },
                    { "min_order_amount": { "$lte": parseInt(element.total_amount) } },
                    { "max_order_amount": { "$gte": parseInt(element.total_amount) } },
                    { "start_from": { "$lte": new Date(today) } },
                    { "end_to": { "$gte": new Date(today) } }
                ]
            })
                .populate("area")
                .exec()

            let is_matched_flag = false
            let calculated_shipping_charge = 0

            /* Match with expired time */
            if (shipping_info) {
                const core_start_time = new Date(shipping_info.start_time.setUTCHours(shipping_info.start_time.getHours()))
                const core_end_time = new Date(shipping_info.end_time.setUTCHours(shipping_info.end_time.getHours()))

                if (core_start_time <= new Date(current_time) && core_end_time >= new Date(current_time)) is_matched_flag = true
            }

            if (is_matched_flag && shipping_info && shipping_info.area && shipping_info.area.post_code === post_code) {

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