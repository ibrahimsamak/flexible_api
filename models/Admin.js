const { boolean } = require("@hapi/joi");
const mongoose = require("mongoose");

const Adminschema = mongoose.Schema(
  {
    full_name: {
      type: String,
      required: [true, "Name is required"],
      minlength: [2, "Name must be least 2 character"],
    },
    email: {
      type: String,
      required: [true, "Admin email is required"],
      match: [/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$/, "Invalid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 digit"],
    },
    phone_number: {
      type: String,
      required: false,
    },
    token: {
      type: String,
      required: false,
    },
    fcmToken: {
      type: String,
      required: false,
    },
    roles: {
      type: [{ name: { type: String }, sort: { type: Number } }],
    },
    isBlock:{
      type: Boolean,
      required:false,
      default:false
    }
  },
  { versionKey: false }
);

const Admin = mongoose.model("admins", Adminschema);

exports.Admin = Admin;
