const { Schema, model } = require("mongoose")

const areaSchema = new Schema({
    upazila: {
        type: String,
        trim: true,
        required: true
    },
    upazila_bn_name: {
        type: String,
        trim: true,
        required: true
    },
    post_office: {
        type: String,
        trim: true,
        required: true
    },
    post_office_bn_name: {
        type: String,
        trim: true,
        required: true
    },
    post_code: {
        type: String,
        trim: true,
        required: true
    },
    district: {
        type: Schema.Types.ObjectId,
        ref: "District",
        required: true
    },
    division: {
        type: Schema.Types.ObjectId,
        ref: "Division",
        required: true
    },
    created_by: {
        type: Schema.Types.ObjectId,
        required: true
    }
}, {
    timestamps: true
})


const Area = model("Area", areaSchema)
module.exports = Area
