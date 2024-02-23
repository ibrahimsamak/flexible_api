const boom = require("boom");
const lodash = require("lodash");

const { Admin } = require("../models/Admin");
const { Users } = require("../models/User");
const { Order } = require("../models/Order");
const { Supplier, Product, Product_Price } = require("../models/Product");
const { USER_TYPE, ORDER_STATUS, ACTORS } = require("../utils/constants");
const { employee } = require("../models/Employee");

exports.getTop10NewUsers = async (req, reply) => {
  try {
    const item = await Users.find()
      .populate("city_id")
      .populate("country_id")
      .limit(7)
      .sort({ _id: -1 });
    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: item,
    };
    reply.send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getTop10Orders = async (req, reply) => {
  try {
    var query = {$and:[{status: ORDER_STATUS.new}]};
    query["status"] = ORDER_STATUS.new
    if(req.user.userType == ACTORS.STORE){
      query.$and.push({provider: req.user._id}) 
    }
    console.log(query)
    const item = await Order.find(query)
      .populate("user", "-token")
      .populate({ path: "offers.user", populate: { path: "user" } })
      .limit(10)
      .sort({ _id: -1 });
    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: item,
    };
    reply.send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getCounterOrdersWithStatus = async (req, reply) => {
  try {
    if (req.user.userType == ACTORS.ADMIN) {
      const NewOrder = await Order.countDocuments({ status: ORDER_STATUS.new })
      const ProccessingOrder = await Order.countDocuments({$or: [{ status: ORDER_STATUS.started }, { status: ORDER_STATUS.accpeted }, { status: ORDER_STATUS.updated }, { status: ORDER_STATUS.progress }]});
      const DoneOrder = await Order.countDocuments({ $or:[{status: ORDER_STATUS.prefinished }, {status: ORDER_STATUS.finished }, {status: ORDER_STATUS.rated }]})
      const CancelOrder = await Order.countDocuments({$or: [{ status: ORDER_STATUS.canceled_by_driver }, { status: ORDER_STATUS.canceled_by_admin }, { status: ORDER_STATUS.canceled_by_user }]})
      const AllOrder = await Order.countDocuments({});

      const response = {
        status_code: 200,
        status: true,
        message: "تمت العملية بنجاح",
        NewOrder: NewOrder,
        ProccessingOrder: ProccessingOrder,
        DoneOrder: DoneOrder,
        CancelOrder: CancelOrder,
        AllOrder: AllOrder,
      };
      reply.send(response);
    }
    // else if (req.user.userType == ACTORS.STORE){
    //   let provider_id = req.user._id;
    //   const NewOrder = await Order.countDocuments({ $and: [{ status: ORDER_STATUS.new }, { provider: provider_id }],});
    //   const ProccessingOrder = await Order.countDocuments({ $or:[{status: ORDER_STATUS.accpeted }, {status: ORDER_STATUS.progress }, {status: ORDER_STATUS.updated }, {status: ORDER_STATUS.started }]});
    //   const DoneOrder = await Order.countDocuments({$and: [{$or: [{status: ORDER_STATUS.prefinished }, {status: ORDER_STATUS.finished }, {status: ORDER_STATUS.rated }]}, { provider: provider_id }]});
    //   const CancelOrder = await Order.countDocuments({$and: [{$or: [{status: ORDER_STATUS.canceled_by_admin }, {status: ORDER_STATUS.canceled_by_driver }, {status: ORDER_STATUS.canceled_by_user }]}, { provider: provider_id }]});
    //   const AllOrder = await Order.countDocuments({provider: provider_id});

    //   const response = {
    //     status_code: 200,
    //     status: true,
    //     message: "تمت العملية بنجاح",
    //     NewOrder: NewOrder,
    //     ProccessingOrder: ProccessingOrder,
    //     DoneOrder: DoneOrder,
    //     CancelOrder: CancelOrder,
    //     AllOrder: AllOrder,
    //   };
    //   reply.send(response);
    // }
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getCounterUsers = async (req, reply) => {
  try {

    const _Supplier = await Users.countDocuments({register_type:'personal'});
    const _Users = await Users.countDocuments({register_type:'company'});
    const _Admin = await Admin.countDocuments();
    const _Orders = await Order.countDocuments();

    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      Users: _Users,
      Supplier: _Supplier,
      Orders: _Orders,
      Admins: _Admin,
    };
    reply.send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.UsersproviderPerYear = async (req, reply) => {
  try {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    var items = [];
    var items2 = [];
    const result = await Users.find({app_type:'provider'}).sort({ createAt: 1 });
    const result2 = await Users.find({app_type:'customer'}).sort({ createAt: 1 });
    result.forEach((element) => {
      var month_number = new Date(element.createAt).getMonth();
      var month_year = new Date(element.createAt).getFullYear();
      let current_year = new Date().getFullYear()
      var month_name = monthNames[month_number];
      if(month_year == current_year){
        items.push({ month: month_name, user: element._id });
      }
    });

    result2.forEach((element) => {
      var month_number = new Date(element.createAt).getMonth();
      var month_year = new Date(element.createAt).getFullYear();
      let current_year = new Date().getFullYear()
      var month_name = monthNames[month_number];
      if(month_year == current_year){
        items2.push({ month: month_name, user: element._id });
      }
    });

    var _result = lodash(items)
      .groupBy("month")
      .map(function (items, _name) {
        return { name: _name, value: items.length };
      })
      .value();

      var _result2 = lodash(items2)
      .groupBy("month")
      .map(function (items, _name) {
        return { name: _name, value: items.length };
      })
      .value();

    var orderedResult = lodash.orderBy(_result, ["count"], ["desc"]);
    var orderedResult2 = lodash.orderBy(_result2, ["count"], ["desc"]);

    const response = {
      items: [
        { name: "مزود جديد", series: orderedResult },
        { name: "مستخدم جديد", series: orderedResult2 },
      ],
    };
    reply.send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getTopProductsCategory = async (req, reply) => {
  try {
    var query = {};
    // if (req.user.userType != USER_TYPE.ADMIN)
    //   query["provider_id"] = req.user._id;

    query["isDeleted"] = false;
    // query["isActive"] = true;
    var products = [];
    const item = await Product.find(query).populate("category_id");
    item.forEach((element) => {
      products.push(element);
    });

    var _result = lodash(products)
      .groupBy("category_id._id")
      .map(function (items, _name) {
        if (items.length > 0)
          return { name: items[0].category_id.arName, value: items.length };
      })
      .value();

    var orderedResult = lodash.orderBy(_result, ["count"], ["desc"]);
    var FinalResult = lodash.take(orderedResult, 10);

    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: FinalResult,
    };
    reply.send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getProviderTarget = async (req, reply) => {
  try {
    const item = await Order.find({status:{$in:[ORDER_STATUS.finished, ORDER_STATUS.rated]}})
    .populate("provider");

    var _result = lodash(item)
      .groupBy("provider._id")
      .map(function (items, _name) {
        if (items.length > 0)
          return { name: `${items[0].provider.name} (${items[0].provider.target})`, value: items.length };
      })
      .value();

    var orderedResult = lodash.orderBy(_result, ["count"], ["desc"]);

    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: orderedResult,
    };
    reply.send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};


exports.getTopProductsPlace = async (req, reply) => {
  try {
    var query = {};
    // if (req.user.userType != USER_TYPE.ADMIN)
    //   query["provider_id"] = req.user._id;
    query["isDeleted"] = false;
    var products = [];
    const item = await Product_Price.find(query)
      .populate("place_id")
      .populate("category_id");
    item.forEach((element) => {
      products.push(element);
    });

    var _result = lodash(products)
      .groupBy("place_id._id")
      .map(function (items, _name) {
        if (items.length > 0) {
        if(items[0].place_id){
          return { name: items[0].place_id.arName, value: items.length };
        }
      }
      })
      .value();

    var orderedResult = lodash.orderBy(_result, ["count"], ["desc"]);
    var FinalResult = lodash.take(orderedResult, 10);

    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: FinalResult,
    };
    reply.send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getProviderOrdersPerYear = async (req, reply) => {
  try {
    var supplier_arr = [];
    var orderedResult = [];
    var count = 0;
    var query = {};
    if (req.params.id != null && req.params.id != "") {
      query["_id"] = req.params.id;
    }
    var sup = await Supplier.find({ $and: [{ isDeleted: false }, query]}).countDocuments();
    const result = await Supplier.find({ $and: [{ isDeleted: false }, query] });

    result.forEach(async function (element) {
      var cancelOrder = await Order.find({
        $and: [{ supplier_id: element._id }, { StatusId: { $in: [4, 5, 6] } }],
      }).countDocuments();
      var DoneOrder = await Order.find({
        $and: [{ supplier_id: element._id }, { StatusId: 4 }],
      }).countDocuments();
      var allOrders = await Order.find({
        supplier_id: element._id,
      }).countDocuments();

      orderedResult.push(
        {
          name: "الطلبات الملغية",
          value: cancelOrder,
        },
        {
          name: "الطلبات المكتملة",
          value: DoneOrder,
        },
        {
          name: "الطلبات الكلية",
          value: allOrders,
        }
      );

      supplier_arr.push({
        name: element.name,
        series: orderedResult,
      });
      orderedResult = [];
      count++;
      if (count === sup) {
        count = 0;

        reply.send(supplier_arr);
        // reply.end()
      }
    });
  } catch (err) {
    throw boom.boomify(err);
  }
};
