const Razorpay = require('razorpay');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const createOrder = async (amount, receipt, notes = {}) => {
    try {
        const order = await razorpay.orders.create({
            amount: Math.round(amount * 100), // Convert to paise
            currency: 'INR',
            receipt,
            notes,
            payment_capture: 1
        });
        return order;
    } catch (error) {
        throw new Error(`Error creating order: ${error.message}`);
    }
};

const verifyPayment = (razorpayOrderId, razorpayPaymentId, signature) => {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const generated_signature = hmac.digest('hex');
    return generated_signature === signature;
};

const createRefund = async (paymentId, amount) => {
    try {
        const refund = await razorpay.payments.refund(paymentId, {
            amount: Math.round(amount * 100), // Convert to paise
            speed: 'normal'
        });
        return refund;
    } catch (error) {
        throw new Error(`Error creating refund: ${error.message}`);
    }
};

const fetchPayment = async (paymentId) => {
    try {
        const payment = await razorpay.payments.fetch(paymentId);
        return payment;
    } catch (error) {
        throw new Error(`Error fetching payment: ${error.message}`);
    }
};

module.exports = {
    createOrder,
    verifyPayment,
    createRefund,
    fetchPayment
}; 