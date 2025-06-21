import Customer from "../models/Customer.js";
import logger from "../utils/logger.js";
import mongoose from "mongoose";
import rabbitMQClient from "../utils/rabbit.js";
import Address from "../models/Address.js";


class CustomerControllers {
    static async customerProfile(req, res){
        logger.info("Fetching customer profile");
        try {
            const userId = req.user.userId;
            console.log("User ID from request", { userId });

            const customer = await Customer.findOne({ userId });
            if (!customer) {
                logger.warn("Customer not found", { userId });
                return res.status(404).json({ success: false, message: "Customer not found" });
            }

            logger.info("Customer profile fetched successfully", { userId });
            return res.status(200).json({ success: true, data: customer });
        } catch (error) {
            logger.error("Error fetching customer profile", error);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    }

    static async updateCustomerProfile(req, res) {
        logger.info("Updating Customer profile");
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const userId = req.user.userId;
            const { firstName, lastName, email, phone } = req.body;

            const customer = await Customer.findOne({  userId }).session(session);
            if (!customer) {
                logger.warn("Customer not found for update", { userId });
                return res.status(404).json({ success: false, message: "Customer not found" });
            }
            const emailChanged = email && email !== customer.email;

            customer.firstName = firstName || customer.firstName;
            customer.lastName = lastName || customer.lastName;
            customer.email = email || customer.email;
            customer.phone = phone || customer.phone;
            customer.fullName = `${customer.firstName} ${customer.lastName}`;
            await customer.save({ session });
            await session.commitTransaction();
            logger.info("Customer profile updated successfully", { userId });
            await rabbitMQClient.publish("user.profile.updates", {
                userId,
                firstName: customer.firstName,
                lastName: customer.lastName,
                email: customer.email,
            })
            const responseMessage = emailChanged
                ? "Profile updated successfully, email change requires verification. check your inbox."
                : "Customer profile updated successfully";

            return res.status(200).json({ success: true, message: responseMessage, data: customer });

        }catch (error) {
            logger.error("Error updating customer profile", error);
            await session.abortTransaction();
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        } finally {
            session.endSession();
        }
    }

    static async customerAddresses(req, res) {
        logger.info("Fetching customer addresses");
        try{
            const userId = req.user.userId;
            if (!userId) {
                logger.warn("User ID not found in request", { userId });
                return res.status(400).json({ success: false, message: "User ID is required" });
            }

            const customer = await Customer.findOne({ userId });
            if (!customer) {
                logger.warn("Customer not found for address retrieval", { userId });
                return res.status(404).json({ success: false, message: "Customer not found" });
            }

            const addresses = await Address.find({ userId, customerId: customer._id }).sort({ createdAt: -1 });

            logger.info("Customer addresses fetched successfully", { userId, addressCount: addresses.length });
            return res.status(200).json({ success: true, data: addresses });
        } catch (error) {
            logger.error("Error fetching customer addresses", error);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    }

    static async addCustomerAddress(req, res) {
        logger.info("Adding new customer address");
        const session = await mongoose.startSession();
        session.startTransaction()
        try {
            const userId = req.user.userId;
            if (!userId) {
                logger.warn("User ID not found in request", { userId });
                return res.status(400).json({ success: false, message: "User ID is required" });
            }

            const customer = await Customer.findOne({ userId }).session(session);
            if (!customer) {
                logger.warn("Customer not found for address addition", { userId });
                return res.status(404).json({ success: false, message: "Customer not found" });
            }

            let { label, street, city, state, country, postalCode, isDefault } = req.body;

            // Sanitize & trim fields
            label = label?.trim();
            street = street?.trim();
            city = city?.trim();
            state = state?.trim();
            country = country?.trim();
            postalCode = postalCode?.trim();

            // Validate required fields
            if (!label || !street || !city || !state || !country) {
                logger.warn("Missing required address fields", { label, street, city, state, country });
                return res.status(400).json({ success: false, message: "All fields are required" });
            }

            const allowedLabels = ["Home", "Work", "Other"];
            if (!allowedLabels.includes(label)) {
                return res.status(400).json({ success: false, message: "Label must be 'Home', 'Work', or 'Other'" });
            }
            const existingAddress = await Address.findOne({
                userId,
                customerId: customer._id,
                street,
                city,
                state,
                country,
                postalCode
            }).session(session);

            if (existingAddress) {
                logger.warn("Duplicate address detected", { userId, label });
                return res.status(409).json({ success: false, message: "This address already exists." });
            }
            if (isDefault) {
                await Address.updateMany(
                    { userId, customerId: customer._id, isDefault: true },
                    { $set: { isDefault: false } },
                    { session }
                );
            }

            const newAddress = await Address.create([{
                userId,
                customerId: customer._id,
                label,
                street,
                city,
                state,
                country,
                postalCode,
                isDefault
            }], { session });

            await session.commitTransaction();
            logger.info("Customer address added successfully", { userId, addressId: newAddress._id });
            return res.status(201).json({ success: true, message: "Address added successfully", data: newAddress });
        } catch (error) {
            logger.error("Error adding customer address", error);
            await session.abortTransaction();
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
        finally {
            session.endSession();
        }
    }

    static async getCustomerAddress(req, res) {
        logger.info("Fetching customer address by ID");
        try {
            const userId = req.user.userId;
            const { addressId } = req.params;

            if (!userId || !addressId) {
                logger.warn("User ID or Address ID not provided", { userId, addressId });
                return res.status(400).json({ success: false, message: "User ID and Address ID are required" });
            }

            if (!mongoose.Types.ObjectId.isValid(addressId)) {
                return res.status(400).json({ success: false, message: "Invalid address ID format" });
            }

            const customer = await Customer.findOne({ userId });
            if (!customer) {
                logger.warn("Customer not found for address retrieval", { userId });
                return res.status(404).json({ success: false, message: "Customer not found" });
            }

            const address = await Address.findOne({ _id: addressId, userId, customerId: customer._id });
            if (!address) {
                logger.warn("Address not found", { addressId, userId });
                return res.status(404).json({ success: false, message: "Address not found" });
            }

            logger.info("Customer address fetched successfully", { addressId });
            return res.status(200).json({ success: true, data: address });
        } catch (error) {
            logger.error("Error fetching customer address", error);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    }


    static async updateCustomerAddress(req, res) {
        logger.info("Updating customer address");
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const userId = req.user.userId;
            const { addressId } = req.params;
            let { label, street, city, state, country, postalCode, isDefault } = req.body;

            if (!userId || !addressId) {
                logger.warn("User ID or Address ID not provided", { userId, addressId });
                return res.status(400).json({ success: false, message: "User ID and Address ID are required" });
            }

            const customer = await Customer.findOne({ userId }).session(session);
            if (!customer) {
                logger.warn("Customer not found for address update", { userId });
                return res.status(404).json({ success: false, message: "Customer not found" });
            }

            const address = await Address.findOne({ _id: addressId, userId, customerId: customer._id }).session(session);
            if (!address) {
                logger.warn("Address not found for update", { addressId, userId });
                return res.status(404).json({ success: false, message: "Address not found" });
            }

            // Sanitize input
            label = label?.trim();
            street = street?.trim();
            city = city?.trim();
            state = state?.trim();
            country = country?.trim();
            postalCode = postalCode?.trim();

            // Validate required fields
            const required = [label || address.label, street || address.street, city || address.city, state || address.state, country || address.country];
            if (required.some(field => !field)) {
                logger.warn("Missing required fields for update", { label, street, city, state, country });
                return res.status(400).json({ success: false, message: "All fields are required" });
            }

            const allowedLabels = ["Home", "Work", "Other"];
            if (label && !allowedLabels.includes(label)) {
                return res.status(400).json({ success: false, message: "Label must be 'Home', 'Work', or 'Other'" });
            }

            // If changing default, unset others
            if (typeof isDefault === "boolean" && isDefault === true) {
                await Address.updateMany(
                    { userId, customerId: customer._id, isDefault: true },
                    { $set: { isDefault: false } },
                    { session }
                );
            }

            // Assign new values
            address.label = label || address.label;
            address.street = street || address.street;
            address.city = city || address.city;
            address.state = state || address.state;
            address.country = country || address.country;
            address.postalCode = postalCode || address.postalCode;

            if (typeof isDefault === "boolean") {
                address.isDefault = isDefault;
            }

            await address.save({ session });
            await session.commitTransaction();

            logger.info("Customer address updated successfully", { userId, addressId });
            return res.status(200).json({ success: true, message: "Address updated successfully", data: address });
        } catch (error) {
            logger.error("Error updating customer address", error.stack);
            await session.abortTransaction();
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
        finally {
            session.endSession();
        }
    }

    static async deleteCustomerAddress(req, res) {
        logger.info("Deleting customer address");
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const userId = req.user.userId;
            const { addressId } = req.params;

            if (!userId || !addressId) {
                logger.warn("User ID or Address ID not provided", { userId, addressId });
                return res.status(400).json({ success: false, message: "User ID and Address ID are required" });
            }

            const customer = await Customer.findOne({ userId }).session(session);
            if (!customer) {
                logger.warn("Customer not found for address deletion", { userId });
                return res.status(404).json({ success: false, message: "Customer not found" });
            }

            const address = await Address.findOne({ _id: addressId, userId, customerId: customer._id }).session(session);
            if (!address) {
                logger.warn("Address not found for deletion", { addressId, userId });
                return res.status(404).json({ success: false, message: "Address not found" });
            }

            if (address.isDefault) {
                const anotherDefaultAddress = await Address.findOne({
                    userId,
                    customerId: customer._id,
                    isDefault: true,
                    _id: { $ne: addressId }
                }).session(session);
                if (anotherDefaultAddress) {
                    anotherDefaultAddress.isDefault = true;
                    await anotherDefaultAddress.save({ session });
                } else {
                    logger.warn("No other default address found, cannot delete default address", { addressId, userId });
                    return res.status(400).json({ success: false, message: "Cannot delete default address without another default address" });
                }
            }

            await Address.deleteOne({ _id: addressId, userId, customerId: customer._id }, { session });
            await session.commitTransaction();

            logger.info("Customer address deleted successfully", { userId, addressId });
            return res.status(200).json({ success: true, message: "Address deleted successfully" });
        } catch (error) {
            logger.error("Error deleting customer address", error.stack);
            await session.abortTransaction();
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        } finally {
            session.endSession();
        }
    }
}

export default CustomerControllers;