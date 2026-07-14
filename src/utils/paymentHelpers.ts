import { TSale, TPayment } from "../types/types";
import { randomString, renderDateUpToMilliseconds } from "../../GlobalVariables";
import moment from "moment";
import Realm from "realm";

export const getSalePaymentDetails = (sale: any, realm: Realm) => {
    // Look up local Payments for this sale
    const payments = realm.objects<any>('Payments').filtered('sale_id == $0', sale._id);
    const totalPrice = parseFloat(sale.selling_price) * sale.number + (parseFloat(sale.delivery_price) || 0) - (parseFloat(sale.discount_price) || 0);

    if (payments.length > 0) {
        // Sum successful payments (payment_status: 2 = Success)
        const paidAmount = payments
            .filtered('payment_status == $0', 2)
            .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        
        const isPaid = paidAmount >= totalPrice;
        
        return {
            isPaid,
            paidAmount,
            remainingAmount: Math.max(0, totalPrice - paidAmount),
            useNewSystem: true
        };
    } else {
        // Legacy behavior: check type_sale
        // type_sale === 0 means Cash (Paid immediately), 1 means Credit (Unpaid)
        const isPaid = sale.type_sale === 0;
        
        return {
            isPaid,
            paidAmount: isPaid ? totalPrice : 0,
            remainingAmount: isPaid ? 0 : totalPrice,
            useNewSystem: false
        };
    }
};

export const createPaymentObject = (
    sale: any,
    amount: string,
    paymentMethod: number, // 1 = Cash, 2 = Mobile Money, 3 = Card
    paymentStatus: number, // 1 = Pending, 2 = Success, 3 = Failed, 4 = Cancelled
    agentPaid: string
): TPayment => {
    return {
        _id: renderDateUpToMilliseconds() + randomString(5),
        sale_id: sale._id,
        reservation_id: "",
        item_id: sale.item_id,
        sales_point_id: sale.sales_point_id,
        amount: amount,
        currency: sale.currency,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        payment_details: "{}",
        agent_paid: agentPaid,
        uploaded: 0,
        createdAt: moment(new Date()).format(),
        updatedAt: moment(new Date()).format()
    };
};
