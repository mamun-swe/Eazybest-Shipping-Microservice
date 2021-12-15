
const { isEmpty } = require("./helpers.validator")

const Store = data => {
    let error = {}

    if (!data.start_from || isEmpty(data.start_from)) error.start_from = "Start date is required"
    if (!data.end_to || isEmpty(data.end_to)) error.end_to = "End date is required"
    if (!data.start_time || isEmpty(data.start_time)) error.start_time = "Start time is required"
    if (!data.end_time || isEmpty(data.end_time)) error.end_time = "End time is required"

    if (!data.discount_type || isEmpty(data.discount_type)) error.discount_type = "Discount type is required"
    if (data.discount_type && !['Flat', 'Percentage'].find(item => item === data.discount_type)) error.discount_type = `${data.discount_type} is not valid`

    if (!data.discount_amount || isEmpty(data.discount_amount)) error.discount_amount = "Discount amount is required"
    if (data.discount_amount && typeof data.discount_amount !== "number") error.discount_amount = "Amount must be in number"
    if (!data.area || isEmpty(data.area)) error.area = "Area is required."

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

module.exports = {
    Store
}