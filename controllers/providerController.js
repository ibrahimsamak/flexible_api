// External Dependancies
const boom = require("boom");
const jwt = require("jsonwebtoken");
const config = require("config");
const fs = require("fs");
const async = require("async");
const lodash = require("lodash");
const _ = require("underscore");
const moment = require("moment-timezone");

const { Supplier, Supervisor } = require("../models/Product");
const { Order } = require("../models/Order");
const { Favorite } = require("../models/Favorite");
const { Notifications } = require("../models/Notifications");
const { Firebase } = require("../utils/firebase");

const {
  encryptPassword,
  mail_welcome,
  uploadImages,
  emailRegex,
  decryptPasswordfunction,
  handleError,
  sendSMS,
} = require("../utils/utils");
const { success, errorAPI } = require("../utils/responseApi");
const {
  MESSAGE_STRING_ENGLISH,
  MESSAGE_STRING_ARABIC,
  LANGUAGE_ENUM,
  USER_TYPE,
  VALIDATION_MESSAGE_ARABIC,
  VALIDATION_MESSAGE_ENGLISH,
  CONTROLLER_ENUM,
  getMessageOnLanguage,
  ACTORS,
  ORDER_STATUS,
} = require("../utils/constants");
const { times } = require("../models/Constant");
const { Users } = require("../models/User");

///////////Admin//////////
exports.addTime = async (req, reply) => {
  try {
    let _times = new times({
      from: req.body.from,
      to: req.body.to,
      isDeleted: false,
      supplier_id: req.body.supplier_id,
    });

    var _return = handleError(_times.validateSync());
    if (_return.length > 0) {
      reply.code(200).send({
        status_code: 400,
        status: false,
        message: _return[0],
        items: _return,
      });
      return;
    }

    let rs = await _times.save();

    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: rs,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.updateTime = async (req, reply) => {
  try {
    const _times = await times.findByIdAndUpdate(
      req.params.id,
      {
        from: req.body.from,
        to: req.body.to,
        supplier_id: req.body.supplier_id,
      },
      { new: true, runValidators: true },
      function (err, model) {
        var _return = handleError(err);
        if (_return.length > 0) {
          reply.code(200).send({
            status_code: 400,
            status: false,
            message: _return[0],
            items: _return,
          });
          return;
        }
      }
    );

    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: null,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.deleteTime = async (req, reply) => {
  try {
    const _times = await times.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted: true,
      },
      { new: true }
    );

    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: null,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getProviderTimes = async (req, reply) => {
  try {
    const item = await times
      .find({ $and: [{ supplier_id: req.params.id }, { isDeleted: false }] })
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

exports.getAllSupplier = async (req, reply) => {
  try {
    const item = await Users.find({app_type:'provider'})
      .populate("cities")
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

exports.getSupplier = async (req, reply) => {
  try {
    var page = parseFloat(req.query.page, 10);
    var limit = parseFloat(req.query.limit, 10);
    let search_field = req.body.search_field;
    let search_value = req.body.search_value;
    let user_type = req.body.user_type;

    let query1 = {};
    query1[search_field] = { $regex: new RegExp(search_value, "i") };
    query1["app_type"] = 'provider'

    if(user_type == "delete"){
      query1['isBlock'] = true
    }
    if(user_type == "active"){
      query1['isBlock'] = false
    }
  if (
      req.body.dt_from &&
      req.body.dt_from != "" &&
      req.body.dt_to &&
      req.body.dt_to != ""
    ) {
      query1["createAt"]= { $gte: new Date(new Date(req.body.dt_from).setHours(0, 0, 0)), $lt: new Date(new Date(req.body.dt_to).setHours(23, 59, 59)) }
    }

    if(req.body.category && req.body.category != ""){
      query1["categories"] = { $all: { _id: req.body.category } }
    }
    const total = await Users.find(query1).countDocuments();
    const item = await Users.find(query1)
      .populate("cities")
      .skip(page * limit)
      .limit(limit)
      .sort({ _id: -1 });

    var newArr = [];
    for await (const data of item) {
      var newUser = data.toObject();
      var _order = await Order.countDocuments({$or: [{ provider: newUser._id },{ user: newUser._id }]});
      newUser.orders = _order;
      newArr.push(newUser);
    }

    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: newArr,
      pagenation: {
        size: newArr.length,
        totalElements: total,
        totalPages: Math.floor(total / limit),
        pageNumber: page,
      },
    };
    reply.send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getProviderExcel = async (req, reply) => {
  try {
    let search_field = req.body.search_field;
    let search_value = req.body.search_value;
    let user_type = req.body.user_type;

    let query1 = {};
    query1[search_field] = { $regex: new RegExp(search_value, "i") };
    query1["app_type"] = 'provider'

    if(user_type == "delete"){
      query1['isBlock'] = true
    }
    if(user_type == "active"){
      query1['isBlock'] = false
    }
  if (
      req.body.dt_from &&
      req.body.dt_from != "" &&
      req.body.dt_to &&
      req.body.dt_to != ""
    ) {
      query1["createAt"]= { $gte: new Date(new Date(req.body.dt_from).setHours(0, 0, 0)), $lt: new Date(new Date(req.body.dt_to).setHours(23, 59, 59)) }
    }
    if(req.body.category && req.body.category != ""){
      query1["categories"] = { $all: { _id: req.body.category } }
    }
    const item = await Users.find(query1)
    .populate("city")
    .populate("work")
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

exports.sendSupplierMS = async (req, reply) => {
  let user = await Users.findById(req.params.id);
  if (!user) {
    const response = {
      status_code: 400,
      status: false,
      message: "حدث خطأ .. الرجاء المحاولة فيما بعد",
      items: null,
    };
    reply.code(200).send(response);
  }
  let msg = req.body.msg;

  sendSMS(user.phone_number, "", "", msg);
  const response = {
    status_code: 200,
    status: true,
    message: "تم ارسال الرسالة بنجاح",
    items: null,
  };
  reply.code(200).send(response);
};

exports.getSingleProviderAdmin = async (req, reply) => {
  const language = req.headers["accept-language"];
  try {
    const user_id = req.params.id;
    const _Users = await Users.findById(user_id).populate("categories").select();
    if (!_Users) {
      reply
        .code(200)
        .send(
          errorAPI(
            language,
            400,
            MESSAGE_STRING_ARABIC.ERROR,
            MESSAGE_STRING_ENGLISH.ERROR
          )
        );
      return;
    }
    var newUser = _Users.toObject();
    var _order = await Order.find({
      $and: [{ supplier_id: newUser._id }, { StatusId: 4 }],
    }).countDocuments();

    newUser.orders = _order;
    newUser.password = decryptPasswordfunction(_Users.password);
    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          newUser
        )
      );
    return;
  } catch (err) {
    reply
      .code(200)
      .send(
        errorAPI(
          language,
          400,
          MESSAGE_STRING_ARABIC.ERROR,
          MESSAGE_STRING_ENGLISH.ERROR
        )
      );
    return;
  }
};

exports.updateProvider = async (req, reply) => {
  const language = "ar";
  try {
    var newUser = new Supplier({
      phone_number: req.raw.body.phone_number,
    });

    if (!req.raw.body.email || !req.raw.body.full_name || !req.raw.body.categories) {
      reply
        .code(200)
        .send(
          errorAPI(
            language,
            400,
            MESSAGE_STRING_ARABIC.ALL_FIELD_REQUIRED,
            MESSAGE_STRING_ENGLISH.ALL_FIELD_REQUIRED
          )
        );
      return;
    }

    if (!emailRegex.test(req.raw.body.email)) {
      reply
        .code(200)
        .send(
          errorAPI(
            language,
            400,
            VALIDATION_MESSAGE_ARABIC.INVALID_EMAIL,
            VALIDATION_MESSAGE_ENGLISH.INVALID_EMAIL
          )
        );
      return;
    }
    const _Users = await Users.findOne({
      $and: [
        { _id: { $ne: req.raw.body._id } },
        {isDeleted:false},
        {
          $or: [
            { email: String(req.raw.body.email).toLowerCase() },
            { phone_number: req.raw.body.phone_number },
          ],
        },
      ],
    });
    if (_Users) {
      reply
        .code(200)
        .send(
          errorAPI(
            language,
            400,
            MESSAGE_STRING_ARABIC.USER_EXSIT,
            MESSAGE_STRING_ENGLISH.USER_EXSIT
          )
        );
      return;
    } else {
      if (req.raw.files) {
        const files = req.raw.files;
        let fileArr = [];
        for (let key in files) {
          fileArr.push({
            name: files[key].name,
            mimetype: files[key].mimetype,
          });
        }
        var data = null;
        var data2 = null;
        if (files.image) {
          data = Buffer.from(files.image.data);
          fs.writeFile(
            "./uploads/" + files.image.name,
            data,
            "binary",
            function (err) {
              if (err) {
                console.log("There was an error writing the image");
              } else {
                console.log("The sheel file was written");
              }
            }
          );
        }
        if (files.cover) {
          data2 = Buffer.from(files.cover.data);
          fs.writeFile(
            "./uploads/" + files.cover.name,
            data2,
            "binary",
            function (err) {
              if (err) {
                console.log("There was an error writing the image");
              } else {
                console.log("The sheel file was written");
              }
            }
          );
        }

        const prevProvider = await Users.findById(req.raw.body._id);
        let img = prevProvider.image;
        let cover = prevProvider.cover;
        if (data)
          await uploadImages(files.image.name).then((x) => {
            img = x;
          });

        if (data2)
          await uploadImages(files.cover.name).then((x) => {
            cover = x;
          });

        const _newUser = await Users.findByIdAndUpdate(
          req.raw.body._id,
          {
            image: img,
            email: String(req.raw.body.email).toLowerCase(),
            phone_number: req.raw.body.phone_number,
            full_name: req.raw.body.full_name,
            address: req.raw.body.address,
            categories: JSON.parse(req.raw.body.categories),
          },
          { new: true, runValidators: true },
          function (err, model) {
            var _return = handleError(err);
            if (_return.length > 0) {
              reply.code(200).send({
                status_code: 400,
                status: false,
                message: _return[0],
                items: _return,
              });
              return;
            }
          }
        ).select();

        var newUser = _newUser.toObject();
        var _order = await Order.find({
          $and: [{ supplier_id: newUser._id }, { StatusId: 4 }],
        }).countDocuments();
        newUser.orders = _order;

        reply
          .code(200)
          .send(
            success(
              language,
              200,
              MESSAGE_STRING_ARABIC.UPDATE_PROFILE,
              MESSAGE_STRING_ENGLISH.UPDATE_PROFILE,
              newUser
            )
          );
        return;
      } else {
        const _newUser = await Users.findByIdAndUpdate(
          req.raw.body._id,
          {
            email: String(req.raw.body.email).toLowerCase(),
            phone_number: req.raw.body.phone_number,
            full_name: req.raw.body.full_name,
            address: req.raw.body.address,
            categories: JSON.parse(req.raw.body.categories),
          },
          { new: true, runValidators: true },
          function (err, model) {
            var _return = handleError(err);
            if (_return.length > 0) {
              reply.code(200).send({
                status_code: 400,
                status: false,
                message: _return[0],
                items: _return,
              });
              return;
            }
          }
        ).select();

        var newUser = _newUser.toObject();
        var _order = await Order.find({
          $and: [{ supplier_id: newUser._id }, { StatusId: 4 }],
        }).countDocuments();

        newUser.orders = _order;

        reply
          .code(200)
          .send(
            success(
              language,
              200,
              MESSAGE_STRING_ARABIC.UPDATE_PROFILE,
              MESSAGE_STRING_ENGLISH.UPDATE_PROFILE,
              newUser
            )
          );
        return;
      }
    }
  } catch (err) {
    reply.code(200).send(errorAPI(language, 400, err.message, err.message));
    return;
  }
};

exports.addProvider = async (req, reply) => {
  const language = "ar";
  try {
    var newUser = new Supplier({
      phone_number: req.raw.body.phone_number,
    });

    if (!req.raw.body.email || !req.raw.body.name || !req.raw.body.cities) {
      reply
        .code(200)
        .send(
          errorAPI(
            language,
            400,
            MESSAGE_STRING_ARABIC.ALL_FIELD_REQUIRED,
            MESSAGE_STRING_ENGLISH.ALL_FIELD_REQUIRED
          )
        );
      return;
    }

    if (!emailRegex.test(req.raw.body.email)) {
      reply
        .code(200)
        .send(
          errorAPI(
            language,
            400,
            VALIDATION_MESSAGE_ARABIC.INVALID_EMAIL,
            VALIDATION_MESSAGE_ENGLISH.INVALID_EMAIL
          )
        );
      return;
    }
    const _Users = await Users.findOne({
      $and:[
        {isDeleted:false},
        { 
          $or: [
          { email: String(req.raw.body.email).toLowerCase() },
          { phone_number: req.raw.body.phone_number },
         ]
      ,}
    ]
     
    });
    if (_Users) {
      reply
        .code(200)
        .send(
          errorAPI(
            language,
            400,
            MESSAGE_STRING_ARABIC.USER_EXSIT,
            MESSAGE_STRING_ENGLISH.USER_EXSIT
          )
        );
      return;
    } else {
      const files = req.raw.files;
      let fileArr = [];
      for (let key in files) {
        fileArr.push({
          name: files[key].name,
          mimetype: files[key].mimetype,
        });
      }
      var data = null;
      var data2 = null;
      if (files.image) {
        data = Buffer.from(files.image.data);
        fs.writeFile(
          "./uploads/" + files.image.name,
          data,
          "binary",
          function (err) {
            if (err) {
              console.log("There was an error writing the image");
            } else {
              console.log("The sheel file was written");
            }
          }
        );
      }

      let img = "";
      await uploadImages(files.image.name).then((x) => {
        img = x;
      });

      const _newUser = new Supplier({
        image: img,
        email: String(req.raw.body.email).toLowerCase(),
        phone_number: req.raw.body.phone_number,
        password: encryptPassword(req.raw.body.password),
        cities: JSON.parse(req.raw.body.cities),
        name: req.raw.body.name,
        isBlock: false,
        isDeleted: false,
        orderPercentage: req.raw.body.orderPercentage,
        rate: 0,
        details: req.raw.body.details,
        roles: JSON.parse(req.raw.body.roles),
        target: req.raw.body.target
      });
      var _return = handleError(_newUser.validateSync());
      if (_return.length > 0) {
        reply.code(200).send({
          status_code: 400,
          status: false,
          message: _return[0],
          items: _return,
        });
        return;
      }
      let rs = await _newUser.save();
      var newUser = rs.toObject();
      var _order = await Order.find({
        $and: [{ supplier_id: newUser._id }, { StatusId: 4 }],
      }).countDocuments();
      newUser.orders = _order;

      //send email
      var data = {
        name: rs.name,
        email: rs.email,
        password: decryptPasswordfunction(rs.password),
      };
      mail_welcome(req, rs.email, "منصة جاز توك", "", data);

      reply
        .code(200)
        .send(
          success(
            language,
            200,
            MESSAGE_STRING_ARABIC.UPDATE_PROFILE,
            MESSAGE_STRING_ENGLISH.UPDATE_PROFILE,
            newUser
          )
        );
      return;
    }
  } catch (err) {
    reply.code(200).send(errorAPI(language, 400, err.message, err.message));
    return;
  }
};

exports.block = async (req, reply) => {
  try {
    const user = await Users.findByIdAndUpdate(
      req.body._id,
      {
        isBlock: req.body.isBlock,
      },
      { new: true }
    );

    // if (String(req.body.isBlock) == "true") {
    //   if (user.type == 2) {
    //     Products.updateMany(
    //       { provider_id: req.body._id },
    //       { isActive: false },
    //       function (err, res) {}
    //     );
    //   }
    //   if (user.type == 1 || user.type == 4) {
    //     Projects.updateMany(
    //       { provider_id: req.body._id },
    //       { isActive: false },
    //       function (err, res) {}
    //     );
    //   }
    // } else {
    //   if (user.type == 2) {
    //     Products.updateMany(
    //       { provider_id: req.body._id },
    //       { isActive: true },
    //       function (err, res) {}
    //     );
    //   }
    //   if (user.type == 1 || user.type == 4) {
    //     Projects.updateMany(
    //       { provider_id: req.body._id },
    //       { isActive: true },
    //       function (err, res) {}
    //     );
    //   }
    // }

    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: user,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.delete = async (req, reply) => {
  try {
    const user = await Users.findByIdAndUpdate(
      req.body._id,
      {
        isDeleted: true,
      },
      { new: true }
    );

    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: user,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};


exports.driversOnFirebase = async (req, reply) => {
  try {
    let database = Firebase.database()
    const ref = database.ref("userLocation");
    var drivers_ids = []
    ref.on('value', async (snapshot) => {
      snapshot.forEach(function(childSnapshot) {
          var childData = childSnapshot.val();
          if(childSnapshot && childData.l &&  childData.l.length > 0){
            let obj = {
              driver_id : childSnapshot.key,
              lat : childData.l[0],
              lng : childData.l[1],
              status: childData.isAvailable,
              name: childData.driverName,
              phone: childData.driverPhone,
            }
            drivers_ids.push(obj)
          }
      });
      
      const response = {
        status_code: 200,
        status: true,
        message: "تمت العملية بنجاح",
        items: drivers_ids,
      };
      reply.code(200).send(response);
    }, (errorObject) => {
      const response = {
        status_code: 400,
        status: false,
        message: "حدث خطأ !!",
        items: null,
      };
      reply.code(200).send(response);
    }); 


  } catch (err) {
    throw boom.boomify(err);
  }
};

///supervisor
exports.getAllSupervisor = async (req, reply) => {
  try {
    const item = await Supervisor.find({isDeleted:false})
      .populate("provider")
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

exports.getSupervisor = async (req, reply) => {
  try {
    var page = parseFloat(req.query.page, 10);
    var limit = parseFloat(req.query.limit, 10);
    let search_field = req.body.search_field;
    let search_value = req.body.search_value;

    let query1 = {};
    query1[search_field] = { $regex: new RegExp(search_value, "i") };
    query1["isDeleted"] = false
    if(req.user.userType == ACTORS.STORE){
      query1["supplier_id"] = req.user._id
    }

    const total = await Supervisor.find(query1).countDocuments();
    const item = await Supervisor.find(query1)
      .populate("provider")
      .skip(page * limit)
      .limit(limit)
      .sort({ _id: -1 });

    var newArr = [];
    for await (const data of item) {
      var newUser = data.toObject();
      var _order = await Order.countDocuments({$and: [{ supervisor: newUser._id }]
});
      newUser.orders = _order;
      newArr.push(newUser);
    }

    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: newArr,
      pagenation: {
        size: newArr.length,
        totalElements: total,
        totalPages: Math.floor(total / limit),
        pageNumber: page,
      },
    };
    reply.send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getSupervisorExcel = async (req, reply) => {
  try {
    let search_field = req.body.search_field;
    let search_value = req.body.search_value;

    let query1 = {};
    query1[search_field] = { $regex: new RegExp(search_value, "i") };
    query1["isDeleted"]=false
    if(req.user.userType == ACTORS.STORE){
      query1["supplier_id"] = req.user._id
    }
    const item = await Supervisor.find(query1)
      .populate("provider")
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

exports.sendSupervisorSMS = async (req, reply) => {
  let user = await Supervisor.findById(req.params.id);
  if (!user) {
    const response = {
      status_code: 400,
      status: false,
      message: "حدث خطأ .. الرجاء المحاولة فيما بعد",
      items: null,
    };
    reply.code(200).send(response);
  }
  let msg = req.body.msg;

  sendSMS(user.phone_number, "", "", msg);
  const response = {
    status_code: 200,
    status: true,
    message: "تم ارسال الرسالة بنجاح",
    items: null,
  };
  reply.code(200).send(response);
};

exports.getSingleSupervisorAdmin = async (req, reply) => {
  const language = req.headers["accept-language"];
  try {
    const user_id = req.params.id;
    const _Users = await Supervisor.findById(user_id).populate("cities").select();
    if (!_Users) {
      reply
        .code(200)
        .send(
          errorAPI(
            language,
            400,
            MESSAGE_STRING_ARABIC.ERROR,
            MESSAGE_STRING_ENGLISH.ERROR
          )
        );
      return;
    }
    var newUser = _Users.toObject();
    var _order = await Order.find({
      $and: [{ supplier_id: newUser._id }, { StatusId: 4 }],
    }).countDocuments();

    newUser.orders = _order;
    newUser.password = decryptPasswordfunction(_Users.password);
    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          newUser
        )
      );
    return;
  } catch (err) {
    reply
      .code(200)
      .send(
        errorAPI(
          language,
          400,
          MESSAGE_STRING_ARABIC.ERROR,
          MESSAGE_STRING_ENGLISH.ERROR
        )
      );
    return;
  }
};

exports.updateSupervisor = async (req, reply) => {
  const language = "ar";
  try {
    var newUser = new Supervisor({
      phone_number: req.raw.body.phone_number,
    });

    if (!req.raw.body.email || !req.raw.body.name) {
      reply
        .code(200)
        .send(
          errorAPI(
            language,
            400,
            MESSAGE_STRING_ARABIC.ALL_FIELD_REQUIRED,
            MESSAGE_STRING_ENGLISH.ALL_FIELD_REQUIRED
          )
        );
      return;
    }

    if (!emailRegex.test(req.raw.body.email)) {
      reply
        .code(200)
        .send(
          errorAPI(
            language,
            400,
            VALIDATION_MESSAGE_ARABIC.INVALID_EMAIL,
            VALIDATION_MESSAGE_ENGLISH.INVALID_EMAIL
          )
        );
      return;
    }
    const _Users = await Supervisor.findOne({
      $and: [
        { _id: { $ne: req.raw.body._id } },
        {isDeleted:false},
        {
          $or: [
            { email: String(req.raw.body.email).toLowerCase() },
            { phone_number: req.raw.body.phone_number },
          ],
        },
      ],
    });
    if (_Users) {
      reply
        .code(200)
        .send(
          errorAPI(
            language,
            400,
            MESSAGE_STRING_ARABIC.USER_EXSIT,
            MESSAGE_STRING_ENGLISH.USER_EXSIT
          )
        );
      return;
    } else {
      if (req.raw.files) {
        const files = req.raw.files;
        let fileArr = [];
        for (let key in files) {
          fileArr.push({
            name: files[key].name,
            mimetype: files[key].mimetype,
          });
        }
        var data = null;
        var data2 = null;
        if (files.image) {
          data = Buffer.from(files.image.data);
          fs.writeFile(
            "./uploads/" + files.image.name,
            data,
            "binary",
            function (err) {
              if (err) {
                console.log("There was an error writing the image");
              } else {
                console.log("The sheel file was written");
              }
            }
          );
        }
        if (files.cover) {
          data2 = Buffer.from(files.cover.data);
          fs.writeFile(
            "./uploads/" + files.cover.name,
            data2,
            "binary",
            function (err) {
              if (err) {
                console.log("There was an error writing the image");
              } else {
                console.log("The sheel file was written");
              }
            }
          );
        }

        const prevProvider = await Supervisor.findById(req.raw.body._id);
        let img = prevProvider.image;
        let cover = prevProvider.cover;
        if (data)
          await uploadImages(files.image.name).then((x) => {
            img = x;
          });

        if (data2)
          await uploadImages(files.cover.name).then((x) => {
            cover = x;
          });

        const _newUser = await Supervisor.findByIdAndUpdate(
          req.raw.body._id,
          {
            image: img,
            email: String(req.raw.body.email).toLowerCase(),
            phone_number: req.raw.body.phone_number,
            password: encryptPassword(req.raw.body.password),
            name: req.raw.body.name,
            supplier_id: req.raw.body.supplier_id,
            place_id: req.raw.body.place_id,
            city_id: req.raw.body.city_id,
          },
          { new: true, runValidators: true },
          function (err, model) {
            var _return = handleError(err);
            if (_return.length > 0) {
              reply.code(200).send({
                status_code: 400,
                status: false,
                message: _return[0],
                items: _return,
              });
              return;
            }
          }
        ).select();

        var newUser = _newUser.toObject();
        var _order = await Order.find({
          $and: [{ supplier_id: newUser._id }, { StatusId: 4 }],
        }).countDocuments();
        newUser.orders = _order;

        reply
          .code(200)
          .send(
            success(
              language,
              200,
              MESSAGE_STRING_ARABIC.UPDATE_PROFILE,
              MESSAGE_STRING_ENGLISH.UPDATE_PROFILE,
              newUser
            )
          );
        return;
      } else {
        const _newUser = await Supervisor.findByIdAndUpdate(
          req.raw.body._id,
          {
            email: String(req.raw.body.email).toLowerCase(),
            phone_number: req.raw.body.phone_number,
            password: encryptPassword(req.raw.body.password),
            name: req.raw.body.name,
            supplier_id: req.raw.body.supplier_id,
            place_id: req.raw.body.place_id,
            city_id: req.raw.body.city_id,
          },
          { new: true, runValidators: true },
          function (err, model) {
            var _return = handleError(err);
            if (_return.length > 0) {
              reply.code(200).send({
                status_code: 400,
                status: false,
                message: _return[0],
                items: _return,
              });
              return;
            }
          }
        ).select();

        var newUser = _newUser.toObject();
        var _order = await Order.find({
          $and: [{ supplier_id: newUser._id }, { StatusId: 4 }],
        }).countDocuments();

        newUser.orders = _order;

        reply
          .code(200)
          .send(
            success(
              language,
              200,
              MESSAGE_STRING_ARABIC.UPDATE_PROFILE,
              MESSAGE_STRING_ENGLISH.UPDATE_PROFILE,
              newUser
            )
          );
        return;
      }
    }
  } catch (err) {
    reply.code(200).send(errorAPI(language, 400, err.message, err.message));
    return;
  }
};

exports.addSupervisor = async (req, reply) => {
  const language = "ar";
  try {
    var newUser = new Supervisor({
      phone_number: req.raw.body.phone_number,
    });

    if (!req.raw.body.email || !req.raw.body.name) {
      reply
        .code(200)
        .send(
          errorAPI(
            language,
            400,
            MESSAGE_STRING_ARABIC.ALL_FIELD_REQUIRED,
            MESSAGE_STRING_ENGLISH.ALL_FIELD_REQUIRED
          )
        );
      return;
    }

    if (!emailRegex.test(req.raw.body.email)) {
      reply
        .code(200)
        .send(
          errorAPI(
            language,
            400,
            VALIDATION_MESSAGE_ARABIC.INVALID_EMAIL,
            VALIDATION_MESSAGE_ENGLISH.INVALID_EMAIL
          )
        );
      return;
    }
    const _Users = await Supervisor.findOne({
      $and:[
        {isDeleted:false},
        { 
          $or: [
          { email: String(req.raw.body.email).toLowerCase() },
          { phone_number: req.raw.body.phone_number },
         ]
      ,}
    ]
     
    });
    if (_Users) {
      reply
        .code(200)
        .send(
          errorAPI(
            language,
            400,
            MESSAGE_STRING_ARABIC.USER_EXSIT,
            MESSAGE_STRING_ENGLISH.USER_EXSIT
          )
        );
      return;
    } else {
      const files = req.raw.files;
      let fileArr = [];
      for (let key in files) {
        fileArr.push({
          name: files[key].name,
          mimetype: files[key].mimetype,
        });
      }
      var data = null;
      var data2 = null;
      if (files.image) {
        data = Buffer.from(files.image.data);
        fs.writeFile(
          "./uploads/" + files.image.name,
          data,
          "binary",
          function (err) {
            if (err) {
              console.log("There was an error writing the image");
            } else {
              console.log("The sheel file was written");
            }
          }
        );
      }

      let img = "";
      await uploadImages(files.image.name).then((x) => {
        img = x;
      });

      const _newUser = new Supervisor({
        image: img,
        email: String(req.raw.body.email).toLowerCase(),
        phone_number: req.raw.body.phone_number,
        password: encryptPassword(req.raw.body.password),
        name: req.raw.body.name,
        isBlock: false,
        isDeleted: false,
        supplier_id: req.raw.body.supplier_id,
        place_id: req.raw.body.place_id,
        city_id: req.raw.body.city_id,
      });
      var _return = handleError(_newUser.validateSync());
      if (_return.length > 0) {
        reply.code(200).send({
          status_code: 400,
          status: false,
          message: _return[0],
          items: _return,
        });
        return;
      }
      let rs = await _newUser.save();
      var newUser = rs.toObject();
      var _order = await Order.find({
        $and: [{ supplier_id: newUser._id }, { StatusId: 4 }],
      }).countDocuments();
      newUser.orders = _order;

      //send email
      var data = {
        name: rs.name,
        email: rs.email,
        password: decryptPasswordfunction(rs.password),
      };
      mail_welcome(req, rs.email, "منصة جاز توك", "", data);

      reply
        .code(200)
        .send(
          success(
            language,
            200,
            MESSAGE_STRING_ARABIC.UPDATE_PROFILE,
            MESSAGE_STRING_ENGLISH.UPDATE_PROFILE,
            newUser
          )
        );
      return;
    }
  } catch (err) {
    reply.code(200).send(errorAPI(language, 400, err.message, err.message));
    return;
  }
};

exports.blockSupervisor = async (req, reply) => {
  try {
    const user = await Supervisor.findByIdAndUpdate(
      req.body._id,
      {
        isBlock: req.body.isBlock,
      },
      { new: true }
    );

    // if (String(req.body.isBlock) == "true") {
    //   if (user.type == 2) {
    //     Products.updateMany(
    //       { provider_id: req.body._id },
    //       { isActive: false },
    //       function (err, res) {}
    //     );
    //   }
    //   if (user.type == 1 || user.type == 4) {
    //     Projects.updateMany(
    //       { provider_id: req.body._id },
    //       { isActive: false },
    //       function (err, res) {}
    //     );
    //   }
    // } else {
    //   if (user.type == 2) {
    //     Products.updateMany(
    //       { provider_id: req.body._id },
    //       { isActive: true },
    //       function (err, res) {}
    //     );
    //   }
    //   if (user.type == 1 || user.type == 4) {
    //     Projects.updateMany(
    //       { provider_id: req.body._id },
    //       { isActive: true },
    //       function (err, res) {}
    //     );
    //   }
    // }

    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: user,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.deleteSupervisor = async (req, reply) => {
  try {
    const user = await Supervisor.findByIdAndUpdate(
      req.body._id,
      {
        isDeleted: true,
      },
      { new: true }
    );

    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: user,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};
