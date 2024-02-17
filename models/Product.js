const mongoose = require("mongoose");
const { number, date, boolean } = require("@hapi/joi");

const Productschema = mongoose.Schema(
  {
    createat: {
      type: Date,
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
      required: [true, "category is required"],
    },
    supplier_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "supplier",
    },
    sort: {
      type: Number,
      default: 0
    },
    isDeleted: {
      type: Boolean,
    },
  },
  { versionKey: false }
);

const schema = mongoose.Schema({
  arName: {
    type: String,
    required: [true, "arabic name is required"],
  },
  enName: {
    type: String,
    required: [true, "english name is required"],
  },
  enDescription: {
    type: String,
  },
  arDescription: {
    type: String,
  },
  image: {
    type: String,
  },
  isDeleted: {
    type: Boolean,
  },
  sort: {
    type: Number,
  },
});


const subschema = mongoose.Schema({
  arName: {
    type: String,
    required: [true, "arabic name is required"],
  },
  enName: {
    type: String,
    required: [true, "english name is required"],
  },
  enDescription: {
    type: String,
  },
  arDescription: {
    type: String,
  },
  image: {
    type: String,
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "category",
    required: [true, "category is required"],
  },
  price: {
    type: Number,
  },
  isDeleted: {
    type: Boolean,
  },
});

const Supplierschema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "name is required"],
  },
  image: {
    type: String,
  },
  details: {
    type: String,
  },
  phone_number: {
    type: String,
  },
  email: {
    type: String,
    required: [true, "email is required"],
    match: [/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$/, "Invalid email"],
  },
  password: {
    type: String,
    required: [true, "password is required"],
  },
  token: {
    type: String,
    default:""
  },
  rate: {
    type: Number,
  },
  isDeleted: {
    type: Boolean,
    default:false
  },
  isBlock: {
    type: Boolean,
  },
  orderPercentage: { type: Number },
  target : {type: Number},
  cities: [{ type: mongoose.Schema.Types.ObjectId, ref: "city"}],
});

const SupervisorSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "name is required"],
  },
  image: {
    type: String,
  },
  phone_number: {
    type: String,
  },
  email: {
    type: String,
    required: [true, "email is required"],
    match: [/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$/, "Invalid email"],
  },
  password: {
    type: String,
    required: [true, "password is required"],
  },
  isDeleted: {
    type: Boolean,
    default:false
  },
  isBlock: {
    type: Boolean,
  },
  token: {
    type: String,
    default:""
  },
  rate: {
    type: Number,
    default:0
  },
  supplier_id: { type: mongoose.Schema.Types.ObjectId, ref: "supplier",required: [true, "supplier is required"]},
  place_id: { type: mongoose.Schema.Types.ObjectId, ref: "place", required: [true, "place is required"], },
  city_id: { type: mongoose.Schema.Types.ObjectId, ref: "city", required: [true, "city is required"], }
});

const ProductPlacePriceSchema = mongoose.Schema({
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "category",
    required: [true, "product is required"],
  },
  place_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "place",
    required: [true, "place is required"],
  },
  supplier_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "supplier",
    required: [true, "supplier is required"],
  },
  city_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "city",
    required: [true, "city is required"],
  },
  createAt: {
    type: Date,
  },
  isDeleted: {
    type: Boolean,
  },
});

const PlaceDeliverySchema = mongoose.Schema({
  supplier_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "supplier",
    required: [true, "supplier is required"],
  },
  place_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "place",
    required: [true, "place is required"],
  },
  city_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "city",
    required: [true, "city is required"],
  },
  isDeleted:{
    type:Boolean,
    default:false
  }
});

// PlaceDeliverySchema.index({ _id: 1 });
Productschema.index({ category_id: 1 });
ProductPlacePriceSchema.index({ product_id: 1 });

const Category = mongoose.model("category", schema);
const Type = mongoose.model("co_type", schema);
const SubCategory = mongoose.model("subcategory", subschema);
const Supplier = mongoose.model("supplier", Supplierschema);
const Supervisor = mongoose.model("supervisor", SupervisorSchema);
const Product = mongoose.model("product", Productschema);
const product_price = mongoose.model("product_price", ProductPlacePriceSchema);
const Place_Delivery = mongoose.model("place_deliveries", PlaceDeliverySchema);

exports.Category = Category;
exports.SubCategory = SubCategory;
exports.Supplier = Supplier;
exports.Product = Product;
exports.Product_Price = product_price;
exports.Place_Delivery = Place_Delivery;
exports.Supervisor = Supervisor;
exports.Type = Type;