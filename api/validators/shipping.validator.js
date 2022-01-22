
const { isEmpty } = require("./helpers.validator")

/* Store validation */
const store = data => {
    let error = {}

    if (!data.title || isEmpty(data.title)) error.title = "Title is required."
    if (!data.start_from || isEmpty(data.start_from)) error.start_from = "Start date is required"
    if (!data.end_to || isEmpty(data.end_to)) error.end_to = "End date is required"
    if (!data.start_time || isEmpty(data.start_time)) error.start_time = "Start time is required"
    if (!data.end_time || isEmpty(data.end_time)) error.end_time = "End time is required"

    if (!data.discount_type || isEmpty(data.discount_type)) error.discount_type = "Discount type is required"
    if (data.discount_type && !['Flat', 'Percentage'].find(item => item === data.discount_type)) error.discount_type = `${data.discount_type} is not valid`

    if (!data.discount_amount || isEmpty(data.discount_amount)) error.discount_amount = "Discount amount is required"
    if (!data.area || isEmpty(data.area)) error.area = "Area is required."

    if (!data.min_order_amount || isEmpty(data.min_order_amount)) error.min_order_amount = "Minimum order amount is required."
    if (!data.max_order_amount || isEmpty(data.max_order_amount)) error.max_order_amount = "Maximum order amount is required."
    if (!data.min_quantity || isEmpty(data.min_quantity)) error.min_quantity = "Minimum product quantity is required."
    if (!data.max_quantity || isEmpty(data.max_quantity)) error.max_quantity = "Maximum product quantity is required."

    if (!data.assign_to || isEmpty(data.assign_to)) error.assign_to = "Assign to is required"
    if (data.assign_to) {
        const assign_types = [
            'Anything',
            'Brand',
            'Category',
            'Sub-category',
            'Leaf-category',
            'Vendor',
            'Product',
            'Customer'
        ].find(item => item === data.assign_to)

        if (!assign_types) error.assign_to = `${data.assign_to} is not valid`
        if (data.assign_to !== "Anything") {
            if (!data.assign_items || isEmpty(data.assign_items)) error.assign_items = "Assign items is required"
        }
    }

    return {
        error,
        isValid: Object.keys(error).length === 0
    }
}

/* Match validation */
const match = data => {
    let error = {}
    const item_errors = []

    if (!data.post_code || isEmpty(data.post_code)) error.post_code = "Post code is required."
    if (!data.items || isEmpty(data.items)) error.items = "Items is required."
    if (data.items && data.items.length > 0) {
        for (let i = 0; i < data.items.length; i++) {
            const element = data.items[i]
            let item_error = {}

            // if (element && !element.assign_to || isEmpty(element.assign_to)) item_error.assign_to = "Assign to is required."
            // if (element.assign_to) {
            //     const assign_types = [
            //         'Anything',
            //         'Brand',
            //         'Category',
            //         'Sub-category',
            //         'Leaf-category',
            //         'Vendor',
            //         'Product',
            //         'Customer'
            //     ].find(item => item === element.assign_to)

            //     if (!assign_types) item_error.assign_to = `${element.assign_to} is not valid`
            // }

            if (element && !element.product_id || isEmpty(element.product_id)) item_error.product_id = "Product Id is required."
            if (element && !element.quantity || isEmpty(element.quantity)) item_error.quantity = "Quantity is required."
            if (element && !element.total_amount || isEmpty(element.total_amount)) item_error.total_amount = "Total amount is required."
            if (element && !element.shipping_charge || isEmpty(element.shipping_charge)) item_error.shipping_charge = "Shipping charge is required."

            if (Object.keys(item_error).length > 0) item_errors.push(item_error)
        }
    }

    if (item_errors.length > 0) error = item_errors

    return {
        error,
        isValid: Object.keys(error).length === 0
    }
}

module.exports = {
    store,
    match
}