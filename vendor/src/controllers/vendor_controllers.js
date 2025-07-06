import Vendor from "../models/Vendor.js";
import logger from "../utils/logger.js";
import withTransaction from "../helpers/transactions.js";
import rabbitMQClient from "../utils/rabbit.js";
import { error } from "console";



class VendorControllers {
    static async vendorProfile(req, res) {
        logger.info("Fetching vendor profile")

        try {
            const userId = req.user.userId
            const vendor = await Vendor.findOne({ userId })

            if (!vendor) {
                logger.warn("Vendor not found", { userId })
                return res.status(404).json({ success: false, message: "Vendor not found" })
            }
            logger.info("Vendor profile fetched successfully", { userId })

            return res.status(200).json({ success: true, data: vendor })
        } catch (error) {
            logger.error("Error fetching vendor profile", error);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    }

    static async completeVendorProfile(req, res) {
        logger.info("Completing Vendor Profile")

        const userId = req.user.userId
        const { businessName, phone } = req.body

        try {
            const KYC = await withTransaction(async (session) => {
                const vendor = await Vendor.findOne({ userId }).session(session)

                if (!vendor) {
                    logger.warn("Vendor not found", { userId })
                    throw new error("NOT_FOUND")
                }
                const formattedContent = businessName
                    .split(" ")
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(" ")

                    vendor.businessName = formattedContent
                    vendor.phone = phone

                    await vendor.save({session})

                    await rabbitMQClient.publish("vendor.KYC", {
                        userId,
                        businessName: vendor.businessName,
                        phone: vendor.phone
                    })
                    return vendor
            }, "completeVendorProfile")
            return res.status(200).json({
                success: true,
                vendor: KYC
            })
        }catch (error) {
            if (err.message === "NOT_FOUND") {
                return res.status(404).json({ success: false, message: "Vendor not found" });
            }

            logger.error("Error Completing vendor profile", err);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }

    }
}


export default VendorControllers