const mongoose = require("mongoose");
const { getCurrentDateTime } = require("../models/Constant");

const Orderschema = mongoose.Schema(
  {
    order_type: {type: String, enum:['service','job'] },
    offer_type: {type: String, enum:['online','onfield'] },
    target: {type: String, enum:['personal','company'] },
    price_type: {type: String, enum:['hourly','daily', 'yearly'] },
    execution_type: {type: String, enum:['limited','unlimted'] },
    title: { type: String },
    bio: { type: String },
    employee_no: { type: Number, default:0 },
    days: { type: Number, default:0 },
    lat: { type: Number },
    lng: { type: Number },
    price: { type: Number },
    order_no: { type: String, required: false },
    tax: { type: Number },
    total: { type: Number, required: false },
    new_total: { type: Number, required: false, default: 0 },
    new_tax: { type: Number, required: false, default: 0 },
    totalDiscount: { type: Number },
    netTotal: { type: Number, required: false },
    status: { type: String },
    createAt: { type: Date },
    couponCode: { type: String },
    paymentType: { type: String },
    offers:{type:[{
      user: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
      price:  { type: Number, default: 0  },
      status: { type: String, default: "" },
     }]},
    category: { type: mongoose.Schema.Types.ObjectId, ref: "category"},
    user: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    city: { type: mongoose.Schema.Types.ObjectId, ref: "city" },
    notes: { type: String, default:"" },
    canceled_note: { type: String, default:"" },
    update_code: { type: String, default:"" },
    loc: {
      type: { type: String },
      coordinates: {type:[Number]},
    },
  },
  { versionKey: false }
);


const RateSchema = mongoose.Schema(
  {
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    provider_id: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    rate_from_user: { type: Number },
    note_from_user: { type: String },
    createAt: { type: Date },
    type: { type: Number },
  },
  { versionKey: false }
);

const PaymentSchema = mongoose.Schema(
  {
    no: { type: String },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    to: { type: String },
    amount: { type: Number },
    createAt: { type: Date },
    type: { type: String },
  },
  { versionKey: false }
);

const PaymentTransactionsSchema = mongoose.Schema(
  {
    order_no: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    type: { type: String },
    total: { type: Number },
    createAt: { type: Date },
    paymentType: { type: String, enum: ["Cash", "Online", "Wallet"] },
    details: { type: String },
  },
  { versionKey: false }
);

PaymentTransactionsSchema.index({ provider_id: 1 });
PaymentTransactionsSchema.index({ employee_id: 1 });
PaymentTransactionsSchema.index({ createAt: 1 });

Orderschema.index({ loc: "2dsphere" });
Orderschema.index({ user_id: 1, status: 1 });
Orderschema.index({ createAt: 1 });

RateSchema.index({ createAt: 1 });
RateSchema.index({ Order_no: 1 });

// Orderschema.index({ "supplier": 1 })
// Orderschema.index({ by_user_id: 1, StatusId: 1 });

const Order = mongoose.model("Order", Orderschema);
const Rate = mongoose.model("Rate", RateSchema);
const Payment = mongoose.model("Payment", PaymentSchema);
const Transactions = mongoose.model("Transactions", PaymentTransactionsSchema);

exports.Order = Order;
exports.Rate = Rate;
exports.Payment = Payment;
exports.Transactions = Transactions
