const mongoose = require("mongoose");

// employee schema
const employeeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    employeeId : {
        type : String
    },
    
    designation: {
        type: String,
        enum: ["manager", "employee"],
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },
    
    phone: {
        type: String,
        required: true,
        unique: true
    },

    typeOfUser: {
        type: String,
        enum: ["approver", "magazine-manager"],
        required: true
    },

    totalMemberships: {
        type: Number,
        default: 0
    },

    completedMemberships: {
        type: Number,
        default: 0
    },

    profileImage: {
        type: String,
        default: "images/dp.jpg"
    }
});

// create employee model from user schema
const Employee = mongoose.model("employee", employeeSchema);

// employee model export
module.exports = Employee;
