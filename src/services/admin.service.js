// user model import
const { User, Employee, Membership, Lab } = require("../models")
const Joi = require("joi")
const { employeeValidation } = require("../validation")

// login admin service
const logIn = async (user) => {
    try{
        return {success:true,message:"admin loggedIn succcessfully", data:user}
    } catch(error){
        return {sucess:false,message:"Internal server error", data: error.message}
    }
}

// show admin info service
const showAdminInfo = async (user) => {
    try{
        return {success:true, message:"admin info", data:user}
    } catch(error){
        return {sucess:false,message:"Internal server error", data: error.message}
    }
}

// create user service
const createUser = async (body) => {
    try{
        // destruct user data from body of the request
        const { email, name, phone, designation, typeOfUser } = body;

        // joi input validation
        const { error } =  employeeValidation.createEmployeeValidationSchema.validate({ ...body })
        
        // return error if input validation fails
        if(error) {
            return {success:false, message:"Input validation failed", data:error.message}
        }

        // create user data object as per schema requirment
        const userData = {
            email: email.toLowerCase(),
            name,
            phone,
            designation,
            typeOfUser
        };

        // create user in backend
        const user = await Employee.create(userData);
        return {success:true, message:"User created successfully", data: user}
    } catch (error) {
        
        return {sucess:false,message:"Internal server error", data: error.message}
    }
}

// show users with pagination
// query
// type -> type of user (creator, legal, finance)
// page -> current page
// limit -> number of document in single page
// ex. page = 3, limit = 5 will give 11-15 number documents
const showUsers = async (query) => {
    try{
        let { page, limit } = query;

        // if page is not there in query of page is < 0 then set page as 1
        if(!page || page <= 0){
            page = 1;
        }
        
        // if limit is not there in query of limit is < 0 then set limit as 1
        if(!limit || limit <= 0){
            limit = 1;
        }

        // count total number of documents for perticular type of user
        const totalUsersCount = await Employee.countDocuments({});

        // count last page for pagination
        const lastPage = Math.ceil(totalUsersCount / limit)

        // if requested page is not exists of exceed the total count 
        if (page != lastPage && (page * limit) > totalUsersCount + 1) {
            return { sucess:false, "message": "reached to the end of the users data" }
        }

        // find users as par pagination requirment
        const employeeData = await Employee.find({}).sort({'updatedAt':-1,'createdAt':-1}).select({ __v: 0, password:0 }).limit(limit * 1).skip((page - 1) * limit).exec()
        
        // return users data
        return {success:true, message:`All Employees`, data: {employee: employeeData, totalPages: lastPage, totalDocuments: totalUsersCount, currentPage: page}}
    } catch (error) {
        return {sucess:false,message:"Internal server error", data: error.message}
    }
}

// delete user service
const deleteUser = async (params) => {
    try{
        // fetch user id from param
        const { phone } = params;

        // joi input validation
        const { error } = employeeValidation.phoneValidationSchema.validate({phone})
        
        // return error if input validation fails
        if(error) {
            return {success:false, message:"Enter valid phone number", data:error.message}
        }

        // find user and delete
        const user = await Employee.findOneAndDelete({phone})

        // if no user is there, means user does not exists
        if(!user){
            return {sucess:false, message: "No employee with given id"}
        }

        const approverAssignedMemberships = await Membership.find({'approver.phone':user.phone})

        // assigning pending memberships of deleting approver to other approvers
        approverAssignedMemberships.forEach(async (membership) => {
            const approver = await Employee.findOne({typeOfUser:"approver"}).sort({totalMemberships:1})

            membership.membershipStatus = "pending"
            membership.approver.phone = approver.phone
            await membership.save()

            approver.totalMemberships = approver.totalMemberships + 1
            await approver.save()
        })

        // return response
        return {success:true, message:"Employee deleted successfully"}
    } catch (error) {
        return {sucess:false,message:"Internal server error", data: error.message}
    }
}

// update user service
const updateUser = async (body) => {
    try{
        // destruct user info from body of the request
        const { id, name, password } = body;

        // joi input validation
        const { error } = userValidation.updateUserValidationSchema.validate({id, name, password})
        
        // return error if input validation fails
        if(error) {
            return {success:false, message:"Input validation failed", data:error.message}
        }

        // find user and update its information
        const user = await User.findOneAndUpdate({id}, {name, password}, {returnOriginal: false});

        // if no user is there, means there is no user exists with given id
        if(!user){
            return {sucess:false, message: "No user with given id, cannot update"}
        }

        // return response
        return {success:true, message:"User updated successfully", data: user}
    } catch (error) {
        return {sucess:false,message:"Internal server error", data: error.message}
    }
}

const adminDashboardData = async () => {
    try {
        const pendingMembershipsCount = await Membership.countDocuments({membershipStatus: "pending"})
        const approvedMembershipsCount = await Membership.countDocuments({membershipStatus: "approved"})
        const totalMembershipsCount = await Membership.countDocuments({membershipStatus: {$in: ["approved", "rejected", "pending"]}})
        const employeeCount = await Employee.countDocuments()
        
        const associateMembershipsCount = await Membership.countDocuments({typeOfMembership: "Associate"})
        const ordinaryMembershipsCount = await Membership.countDocuments({typeOfMembership: "Ordinary"})
        const typeOfMembershipData = [associateMembershipsCount, ordinaryMembershipsCount]

        const d1 = await Lab.countDocuments({name: "power electronic"})
        const d2 = await Lab.countDocuments({name: "advance materials"})
        const d3 = await Lab.countDocuments({name: "cable"})
        const d4 = await Lab.countDocuments({name: "high voltage"})
        const d5 = await Lab.countDocuments({name: "magnetic material"})
        const d6 = await Lab.countDocuments({name: "calibration"})

        const labData = [d1, d2, d3, d4, d5, d6]

        const e1 = await Membership.countDocuments({ companyType: "private" })
        const e2 = await Membership.countDocuments({ companyType: "public" })
        const e3 = await Membership.countDocuments({ companyType: "cooperative" })
        const e4 = await Membership.countDocuments({ companyType: "others" })

        const companyTypeData = [e1, e2, e3, e4]

        return { success: true, data: { pendingMembershipsCount, approvedMembershipsCount, totalMembershipsCount, employeeCount, typeOfMembershipData, labData, companyTypeData } }

    } catch (error) {
        return {sucess:false,message:"Internal server error", data: error}
    }
}

module.exports = {
    logIn,
    showAdminInfo,
    createUser,
    showUsers,
    deleteUser,
    updateUser,
    adminDashboardData
}
