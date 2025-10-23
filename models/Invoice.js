const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    taxPercent: { type: Number, default: 0 },
    total: { type: Number, required: true },
});

const billFromSchema = new mongoose.Schema({
    businessName: { type: String, required: true },
    email: { type: String },
    address: { type: String },
    phoneNumber: { type: String }
}, { _id: false });

const billToSchema = new mongoose.Schema({
    clientName: { type: String, required: true },
    email: { type: String },
    address: { type: String },
    phoneNumber: { type: String }
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    invoiceNumber: {
        type: String,
        required: true,
    },
    invoiceDate: {
        type: Date,
        default: Date.now
    },
    dueDate: {
        type: Date,
    },
    billFrom: {
        type: billFromSchema,
        required: true
    },
    billTo: {
        type: billToSchema,
        required: true
    },
    items: [itemSchema],
    notes: {
        type: String
    },
    paymentTerms: {
        type: String,
        default: 'Net 15'
    },
    status: {
        type: String,
        enum: ["Paid", "Unpaid"],
        default: "Unpaid"
    },
    subTotal: Number,
    taxTotal: Number,
    total: Number,
},
    { timestamps: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);