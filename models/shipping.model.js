const { Schema, model } = require("mongoose")

const shippingSchema = new Schema({
    title: {
        type: String,
        trim: true,
        required: true,
        unique: true
    },
    start_from: {
        type: Date,
        trim: true,
        required: true
    },
    end_to: {
        type: Date,
        trim: true,
        required: true
    },
    start_time: {
        hour: {
            type: Number,
            trim: true,
            required: true
        },
        minute: {
            type: Number,
            trim: true,
            required: true
        }
    },
    end_time: {
        hour: {
            type: Number,
            trim: true,
            required: true
        },
        minute: {
            type: Number,
            trim: true,
            required: true
        }
    },
    discount_type: {
        type: String,
        trim: true,
        required: true,
        enum: ['Flat', 'Percentage']
    },
    discount_amount: {
        type: Number,
        trim: true,
        required: true
    },
    assign_to: {
        type: String,
        trim: true,
        default: 'Anything',
        enum: ['Anything', 'Brand', 'Category', 'Sub-category', 'Leaf-category', 'Vendor', 'Product', 'Customer']
    },
    min_order_amount: {
        type: Number,
        trim: true,
        required: true
    },
    max_order_amount: {
        type: Number,
        trim: true,
        required: true
    },
    min_quantity: {
        type: Number,
        trim: true,
        required: true
    },
    max_quantity: {
        type: Number,
        trim: true,
        required: true
    },
    area: {
        type: Schema.Types.ObjectId,
        ref: "Area",
        required: true
    },
    brands: [{
        type: Schema.Types.ObjectId,
        default: null
    }],
    categories: [{
        type: Schema.Types.ObjectId,
        default: null
    }],
    sub_categories: [{
        type: Schema.Types.ObjectId,
        default: null
    }],
    leaf_categories: [{
        type: Schema.Types.ObjectId,
        default: null
    }],
    vendors: [{
        type: Schema.Types.ObjectId,
        default: null
    }],
    products: [{
        type: Schema.Types.ObjectId,
        default: null
    }],
    customers: [{
        type: Schema.Types.ObjectId,
        default: null
    }],
    created_by: {
        type: Schema.Types.ObjectId,
        required: true
    }
}, {
    timestamps: true
})


const Shipping = model("Shipping", shippingSchema)
module.exports = Shipping
