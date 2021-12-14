
const { isEmpty } = require("./helpers.validator")

const Store = data => {
    let error = {}

    if (!data.upazila || isEmpty(data.upazila)) error.upazila = "Upazila is required"
    if (!data.upazila_bn_name || isEmpty(data.upazila_bn_name)) error.upazila_bn_name = "Upazila bengali name is required"
    if (!data.post_office || isEmpty(data.post_office)) error.post_office = "Post office name is required"
    if (!data.post_office_bn_name || isEmpty(data.post_office_bn_name)) error.post_office_bn_name = "Post office bengali name is required"
    if (!data.post_code || isEmpty(data.post_code)) error.post_code = "Post code is required"
    if (!data.district || isEmpty(data.district)) error.district = "District is required."

    return {
        error,
        isValid: Object.keys(error).length === 0
    }
}


module.exports = {
    Store
}