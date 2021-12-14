
const { isEmpty } = require("./helpers.validator")

const Store = data => {
    let error = {}

    if (!data.name || isEmpty(data.name)) error.name = "Name is required"
    if (!data.bn_name || isEmpty(data.bn_name)) error.bn_name = "Bengali name is required"

    return {
        error,
        isValid: Object.keys(error).length === 0
    }
}


module.exports = {
    Store
}