const mongoose = require('mongoose')

// check validate mongoose ID
const isMongooseId = id => {
    if (!mongoose.isValidObjectId(id)) {
        let error = new Error()
        error.status = 400
        throw error
    }
}

module.exports = {
    isMongooseId
}