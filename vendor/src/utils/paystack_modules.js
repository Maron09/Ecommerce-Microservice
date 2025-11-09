import paystack from "./paystack.js";

class PaystackServices {
    static async resolveAccount (account_number, bank_code) {
        const res = await paystack.get(`/bank/resolve`, {
            params: { account_number, bank_code }
        })
        return res.data.data
    }

    static async createSubaccount({ business_name, bank_code, account_number, percentage_charge }) {
        const res = await paystack.post("/subaccount", {
            business_name,
            bank_code,
            account_number,
            percentage_charge
        })
        return res.data.data
    }
}


export default PaystackServices