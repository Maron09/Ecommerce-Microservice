import Vendor from "../models/Vendor.js";
import logger from "../utils/logger.js";
import withTransaction from "../helpers/transactions.js";
import rabbitMQClient from "../utils/rabbit.js";
import PaystackServices from "../utils/paystack_modules.js";
import Bank from "../models/Banks.js";
import VendorBankAccount from "../models/vendorBankAccount.js";



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
    
    static async addbankDetails(req, res) {
        logger.info("Adding vendor bank details");

        const userId = req.user.userId;
        const { accountNumber, bankName } = req.body;

        try {
            const bankDetails = await withTransaction(async (session) => {
                const bank = await Bank.findOne({
                    name: new RegExp(`^${bankName}$`, 'i')
                }).session(session);

                if (!bank) {
                    logger.warn("Bank not found", { bankName });
                    throw new Error("NOT_FOUND");
                }

                const bankCode = bank.code;
                const existing = await VendorBankAccount.findOne({
                    userId,
                    accountNumber,
                    bankCode
                }).session(session)

                if (existing) {
                    throw new Error("DUPLICATE_ACCOUNT")
                }
                const resolved = await PaystackServices.resolveAccount(accountNumber, bankCode);
                const accountName = resolved.account_name;

                const vendor = await Vendor.findOne({userId}).session(session);
                if (!vendor) {
                    throw new Error("VENDOR_NOT_FOUND");
                }

                const sub = await PaystackServices.createSubaccount({
                    business_name: vendor.businessName,
                    bank_code: bankCode,
                    account_number: accountNumber,
                    percentage_charge: 2.5
                });

                const newBank = await VendorBankAccount.create([{
                    userId,
                    vendorId: vendor._id.toString(),
                    accountName,
                    accountNumber,
                    bankName: bank.name,
                    bankCode,
                    subaccountCode: sub.subaccount_code,
                    isVerified: true,
                }], { session });

                await rabbitMQClient.publish("vendor.subaccount", {
                    userId,
                    vendorId: vendor._id.toString(),
                    bankName: bank.name,
                    bankCode,
                    subaccountCode: sub.subaccount_code,
                })

                return newBank[0]; 
            });

            return res.status(201).json({
                success: true,
                message: "Bank details added",
                data: bankDetails
            });

        } catch (error) {
            if (error.message === "NOT_FOUND") {
                return res.status(404).json({ success: false, message: "Bank not found" });
            }

            if (error.message === "DUPLICATE_ACCOUNT") {
                return res.status(409).json({
                    success: false,
                    message: "This bank account already exists for the vendor."
                });
            }


            if (error.message === "VENDOR_NOT_FOUND") {
                return res.status(404).json({ success: false, message: "Vendor not found" });
            }

            logger.error("Error Completing vendor profile", error);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    }


}


export default VendorControllers