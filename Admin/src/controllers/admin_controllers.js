import Users from "../models/users.js";
import Customers from "../models/customers.js";
import logger from "../utils/logger.js";
import withTransaction from "../helpers/transactions.js";
import paginationResults from "../helpers/pagination.js";
import { buildPaginatedResponse } from "../helpers/paginatonResponse.js";



class AdminControllers {
    static async getAllUsers(req, res) {
        logger.info("Getting all users...")

        try {
            if (!req.user || req.user?.role !== "admin") {
                logger.warn("Unauthorized access attempt to getAllUsers")
                return res.status(403).json({
                    success: false,
                    message: "Access Denied. Admin only."
                });
            }
            const totalItems = await Users.countDocuments()
            const pagination = paginationResults(req, totalItems)
            
            const users = await Users.find()
                .limit(pagination.limit)
                .skip(pagination.skip)
                
            if (!users || users.length === 0) {
                logger.warn("No Users found")
                return res.status(404).json(buildPaginatedResponse({
                    data: [],
                    message: "No users found",
                    pagination,
                    dataKey: "users"
                }));
            }

            res.status(200).json(buildPaginatedResponse({
                data: users,
                message: "Users retrieved successfully",
                pagination,
                dataKey: "users"
            }));
        } catch(error) {
            logger.error("Error fetching all users", error.stack)
            res.status(500).json({
                success: false,
                message: "Internal Server Error"
            })
        }
    }

    static async getAllCustomers(req, res) {
        logger.info("Fetching all Customers...")

        try {
            if (!req.user || req.user?.role !== "admin") {
                logger.warn("Unauthorized access attempt to getAllUsers")
                return res.status(403).json({
                    success: false,
                    message: "Access Denied. Admin only."
                });
            }
            const totalItems = await Customers.countDocuments()
            const pagination = paginationResults(req, totalItems)

            const customers = await Customers.find()
                .limit(pagination.limit)
                .skip(pagination.skip)
            
            if(!customers || customers.length === 0) {
                logger.warn("No Customers found")
                return res.status(404).json(buildPaginatedResponse({
                    data: [],
                    message: "No Customers found",
                    pagination,
                    dataKey: "customers"
                }));
            }

            res.status(200).json(buildPaginatedResponse({
                data: customers,
                message: "Customers retrieved successfully",
                pagination,
                dataKey: "customers"
            }));

        } catch(error) {
            logger.error("Error fetching all customers", error.stack)
            res.status(500).json({
                success: false,
                message: "Internal Server Error"
            })
        }
    }
}


export default AdminControllers