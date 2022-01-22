const express = require("express")
const router = express.Router()
const Permission = require("../middleware/permission.middleware")
const { AdminRouter } = require("./admin.route")
const { CustomerRouter } = require("./customer.route")

// Admin routes
router.use("/admin", Permission.Permission, AdminRouter)
router.use("/customer", CustomerRouter)

module.exports = router