// External Dependancies
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const boom = require("boom");
const jwt = require("jsonwebtoken");
const config = require("config");
const fs = require("fs");
const NodeGeocoder = require("node-geocoder");
const cloudinary = require("cloudinary");
const multer = require("multer");
var moment = require("moment-timezone");
var nodemailer = require("nodemailer");
const async = require("async");
const lodash = require("lodash");
var xhr = new XMLHttpRequest();
var request = require("request");
var ejs = require("ejs");
const Joi = require("@hapi/joi");

// Get Data Models
const { employee } = require("../models/Employee");
const {
  getCurrentDateTime,
  walletsettings,
  setting,
} = require("../models/Constant");
const {
  encryptPassword,
  mail_reset_password,
  makeid,
  emailRegex,
  uploadImages,
  decryptPasswordfunction,
  mail_welcome,
  handleError,
  sendSMS,
} = require("../utils/utils");
const { Adv } = require("../models/adv");
const { Notifications } = require("../models/Notifications");
const { Favorite } = require("../models/Favorite");
const { success, errorAPI } = require("../utils/responseApi");
const {
  MESSAGE_STRING_ENGLISH,
  MESSAGE_STRING_ARABIC,
  LANGUAGE_ENUM,
  USER_TYPE,
  VALIDATION_MESSAGE_ARABIC,
  VALIDATION_MESSAGE_ENGLISH,
  ORDER_STATUS,
  ACTORS,
} = require("../utils/constants");
const { Order } = require("../models/Order");
const { Place_Delivery, Supervisor } = require("../models/Product");

// Add a new Users
exports.loginEmployee = async (req, reply) => {
  const language = req.headers["accept-language"];
  try {
    const pass = encryptPassword(req.body.password);
    const _user = await employee.findOne({
      $and: [{ phone_number: req.body.phone_number }, { password: pass },{isDeleted:false}],
    });
    if (_user) {
      //login
      // send sms
      if (_user.isBlock == true) {
        reply
          .code(200)
          .send(
            errorAPI(
              language,
              405,
              MESSAGE_STRING_ARABIC.USER_BLOCK,
              MESSAGE_STRING_ENGLISH.USER_BLOCK,
              _user
            )
          );
        return;
      } else if (_user.isVerify == false) {
        // please verify your mobile
        reply
          .code(200)
          .send(
            errorAPI(
              language,
              410,
              MESSAGE_STRING_ARABIC.USER_VERIFY,
              MESSAGE_STRING_ENGLISH.USER_VERIFY,
              _user
            )
          );
        return;
      } else {
        //login
        const rs = await employee.findByIdAndUpdate(
          _user.id,
          {
            verify_code: "1234",
            fcmToken: req.body.fcmToken,
            address: req.body.address,
            os: req.body.os,
            lat: parseFloat(req.body.lat),
            lng: parseFloat(req.body.lng),
            token: jwt.sign(
              { _id: _user._id, userType: USER_TYPE.DRIVER },
              config.get("jwtPrivateKey"),
              {
                expiresIn: "365d",
              }
            ),
          },
          { new: true }
        );

        var user = rs.toObject();
        user.CompleteOrder = await Order.find({
          $and: [{ employee_id: user._id }, { StatusId: 4 }],
        }).countDocuments();
        user.ActiveOrder = await Order.find({
          $and: [{ employee_id: user._id }, { StatusId: { $in: [2, 3] } }],
        }).countDocuments();
        reply
          .code(200)
          .send(
            success(
              language,
              200,
              MESSAGE_STRING_ARABIC.SUCCESS,
              MESSAGE_STRING_ENGLISH.SUCCESS,
              user
            )
          );
        return;
      }
    } else {
      reply
        .code(200)
        .send(
          errorAPI(
            language,
            400,
            MESSAGE_STRING_ARABIC.USER_LOGIN_FAILD,
            MESSAGE_STRING_ENGLISH.USER_LOGIN_FAILD
          )
        );
      return;
    }
  } catch (err) {
    reply.code(200).send(errorAPI(language, 400, err.message, err.message));
    return;
  }
};

exports.verify = async (req, reply) => {
  const language = req.headers["accept-language"];

  if (!req.body.phone_number) {
    reply
      .code(200)
      .send(
        errorAPI(
          language,
          400,
          VALIDATION_MESSAGE_ARABIC.PHONE_REQUIRED,
          VALIDATION_MESSAGE_ENGLISH.PHONE_REQUIRED
        )
      );
    return;
  }

  const _user = await employee.findOne({
    $and: [{ _id: req.body.id }, { phone_number: req.body.phone_number },{isDeleted:false}],
  });

  if (!_user) {
    reply
      .code(200)
      .send(
        errorAPI(
          language,
          400,
          MESSAGE_STRING_ARABIC.USER_NOT_FOUND,
          MESSAGE_STRING_ENGLISH.USER_NOT_FOUND
        )
      );
    return;
  }

  if (_user.verify_code == req.body.verify_code) {
    const _Users = await employee.findById(req.body.id);
    if (_Users) {
      const update = await employee.findByIdAndUpdate(
        req.body.id,
        {
          isVerify: true,
          token: jwt.sign(
            { _id: _user._id, userType: USER_TYPE.DRIVER },
            config.get("jwtPrivateKey"),
            {
              expiresIn: "365d",
            }
          ),
        },
        { new: true }
      );
      let user = update.toObject();
      user.CompleteOrder = await Order.find({
        $and: [{ employee_id: user._id }, { StatusId: 4 }],
      }).countDocuments();
      user.ActiveOrder = await Order.find({
        $and: [{ employee_id: user._id }, { StatusId: { $in: [2, 3] } }],
      }).countDocuments();
      reply
        .code(200)
        .send(
          success(
            language,
            200,
            MESSAGE_STRING_ARABIC.USER_CHANGE_PHONE_SUCCESS,
            MESSAGE_STRING_ENGLISH.USER_CHANGE_PHONE_SUCCESS,
            user
          )
        );
      return;
    } else {
      reply
        .code(200)
        .send(
          errorAPI(
            language,
            400,
            MESSAGE_STRING_ARABIC.USER_VERIFY_SUCCESS,
            MESSAGE_STRING_ENGLISH.USER_VERIFY_SUCCESS
          )
        );
      return;
    }
  } else {
    reply
      .code(200)
      .send(
        errorAPI(
          language,
          400,
          MESSAGE_STRING_ARABIC.USER_VERIFY_ERROR,
          MESSAGE_STRING_ENGLISH.USER_VERIFY_ERROR
        )
      );
    return;
  }
};

exports.forgetPassword = async (req, reply) => {
  const language = req.headers["accept-language"];
  try {
    if (!req.body) {
      reply
        .code(200)
        .send(
          errorAPI(
            language,
            400,
            MESSAGE_STRING_ARABIC.USER_NOT_FOUND,
            MESSAGE_STRING_ENGLISH.USER_NOT_FOUND
          )
        );
      return;
    }
    const _Users = await employee.findOne({
      $and:[{isDeleted:false},{phone_number: req.body.phone_number}]
    });
    if (_Users) {
      var newPassword = makeid(8);
      var verify_code = makeid(4);
      // var verify_code = 1234;
      let pass = encryptPassword(newPassword);
      const update = await employee.findByIdAndUpdate(
        _Users._id,
        { password: pass, isVerify: false, verify_code: verify_code },
        { new: true }
      );
      //send sms to activation code
      //send sms to new password

      //mail_reset_password(req, req.body.email, "استعادة كلمة المرور", "", data);

      let user = update.toObject();
      user.CompleteOrder = await Order.find({
        $and: [{ employee_id: user._id }, { StatusId: 4 }],
      }).countDocuments();
      user.ActiveOrder = await Order.find({
        $and: [{ employee_id: user._id }, { StatusId: { $in: [2, 3] } }],
      }).countDocuments();

      reply
        .code(200)
        .send(
          success(
            language,
            200,
            MESSAGE_STRING_ARABIC.USER_FORGET_PASSWORD_SUCCESS,
            MESSAGE_STRING_ENGLISH.USER_FORGET_PASSWORD_SUCCESS,
            user
          )
        );
      return;
    } else {
      reply
        .code(200)
        .send(
          errorAPI(
            language,
            400,
            MESSAGE_STRING_ARABIC.USER_FORGET_PASSWORD_ERROR,
            MESSAGE_STRING_ENGLISH.USER_FORGET_PASSWORD_ERROR
          )
        );
      return;
    }
  } catch (err) {
    reply.code(200).send(errorAPI(language, 400, err.message, err.message));
    return;
  }
};

exports.getSingleEmployee = async (req, reply) => {
  const language = req.headers["accept-language"];
  try {
    const user_id = req.user._id;
    const _Users = await employee.findById(user_id).select();
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
    let user = _Users.toObject();
    user.CompleteOrder = await Order.find({
      $and: [{ employee_id: user._id }, { StatusId: 4 }],
    }).countDocuments();
    user.ActiveOrder = await Order.find({
      $and: [{ employee_id: user._id }, { StatusId: { $in: [2, 3] } }],
    }).countDocuments();
    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          user
        )
      );
    return;
  } catch (err) {
    reply.code(200).send(errorAPI(language, 400, err.message, err.message));
    return;
  }
};

exports.changePassword = async (req, reply) => {
  const language = req.headers["accept-language"];
  try {
    const User_id = req.user._id;
    let pass = encryptPassword(req.body.password);
    let old_password = encryptPassword(req.body.old_password);
    const _Users = await employee.findById(User_id);
    if (_Users) {
      if (old_password != _Users.password) {
        reply
          .code(200)
          .send(
            errorAPI(
              language,
              400,
              MESSAGE_STRING_ARABIC.USER_CHANGE_PASSOWRD_ERROR_OLD_PASSWORD,
              MESSAGE_STRING_ENGLISH.USER_CHANGE_PASSOWRD_ERROR_OLD_PASSWORD
            )
          );
        return;
      }
      const update = await employee.findByIdAndUpdate(
        User_id,
        { password: pass },
        { new: true }
      );

      let user = update.toObject();
      user.CompleteOrder = await Order.find({
        $and: [{ employee_id: user._id }, { StatusId: 4 }],
      }).countDocuments();
      user.ActiveOrder = await Order.find({
        $and: [{ employee_id: user._id }, { StatusId: { $in: [2, 3] } }],
      }).countDocuments();

      reply
        .code(200)
        .send(
          success(
            language,
            200,
            MESSAGE_STRING_ARABIC.SUCCESS,
            MESSAGE_STRING_ENGLISH.SUCCESS,
            user
          )
        );
      return;
    } else {
      reply
        .code(200)
        .send(
          errorAPI(
            language,
            400,
            MESSAGE_STRING_ARABIC.USER_CHANGE_PASSOWRD_ERROR,
            MESSAGE_STRING_ENGLISH.USER_CHANGE_PASSOWRD_ERROR
          )
        );
      return;
    }
  } catch (err) {
    reply.code(200).send(errorAPI(language, 400, err.message, err.message));
    return;
  }
};

exports.Resend = async (req, reply) => {
  const language = req.headers["accept-language"];
  var msg = "";
  const sms_code = makeid(4);
  const user = await employee.findByIdAndUpdate(
    req.body.id,
    {
      verify_code: sms_code,
    },
    { new: true }
  );

  sendSMS(user.phone_number, "", "", msg);
  reply
    .code(200)
    .send(
      success(
        language,
        200,
        MESSAGE_STRING_ARABIC.SUCCESS,
        MESSAGE_STRING_ENGLISH.SUCCESS,
        user
      )
    );
};

//logout
exports.logout = async (req, reply) => {
  const language = req.headers["accept-language"];
  try {
    const User_id = req.params.id;
    const checkUser = await employee.findById(req.params.id);
    if (!checkUser) {
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
    const user = await employee.findByIdAndUpdate(
      User_id,
      {
        fcmToken: "",
        token: "",
      },
      { new: true }
    );
    if (!user) {
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
    } else {
      reply
        .code(200)
        .send(
          success(
            language,
            200,
            MESSAGE_STRING_ARABIC.USER_LOGOUT,
            MESSAGE_STRING_ENGLISH.USER_LOGOUT,
            null
          )
        );
      return;
    }
  } catch (err) {
    reply.code(200).send(errorAPI(language, 400, err.message, err.message));
    return;
  }
};

exports.updateAvailable = async (req, reply) => {
  const language = req.headers["accept-language"];
  try {
    const User_id = req.user._id;
    const checkUser = await employee.findById(User_id);
    if (!checkUser) {
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
    var user = await employee.findByIdAndUpdate(
      User_id,
      {
        isAvailable: req.body.isAvailable,
      },
      { new: true }
    );

    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          user
        )
      );
    return;
  } catch (err) {
    reply.code(200).send(errorAPI(language, 400, err.message, err.message));
    return;
  }
};

///////////Admin////////////
exports.getStoresEmployees = async (req, reply) => {
  try {
    var supplier_id = ""
    if(req.user.userType == ACTORS.ADMIN || req.user.userType == ACTORS.ADMIN){
      supplier_id = req.params.id
      const item = await employee
        .find({$and:[{supplier_id: supplier_id},{isAvailable:true}] })
        .sort({ _id: -1 });

      const response = {
        status_code: 200,
        status: true,
        message: "تمت العملية بنجاح",
        items: item,
      };
      reply.send(response);
    }
    if(req.user.userType == ACTORS.SUPERVISOR){
      const item = await employee
      .find({$and:[{supplier_id: req.user._id},{isAvailable:true}] })
      .sort({ _id: -1 });

      const response = {
        status_code: 200,
        status: true,
        message: "تمت العملية بنجاح",
        items: item,
      };
      reply.send(response);
    }

  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getEmployees = async (req, reply) => {
  try {
    var page = parseFloat(req.query.page, 10);
    var limit = parseFloat(req.query.limit, 10);
    let search_field = req.body.search_field;
    let search_value = req.body.search_value;

    let query1 = {};
    query1[search_field] = { $regex: new RegExp(search_value, "i") };
    query1["isDeleted"] = false
    if(req.user.userType == ACTORS.STORE){
      query1["provider"] = req.user._id
    }
    if(req.user.userType == ACTORS.SUPERVISOR){
      query1["supervisor"] = req.user._id
    }
    const total = await employee.find(query1).countDocuments();
    const item = await employee
      .find(query1)
      .skip(page * limit)
      .limit(limit)
      .sort({ _id: -1 });

    var newArr = [];
    for await (const data of item) {
      var newUser = data.toObject();
      var _order = await Order.countDocuments({$and: [{ employee: newUser._id }]});
      
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

exports.getEmployeesExcel = async (req, reply) => {
  try {
    let search_field = req.body.search_field;
    let search_value = req.body.search_value;

    let query1 = {};
    query1["isDeleted"] = false
    query1[search_field] = { $regex: new RegExp(search_value, "i") };
    if(req.user.userType == ACTORS.STORE){
      query1["supplier_id"] = req.user._id
    }
    if(req.user.userType == ACTORS.SUPERVISOR){
      query1["supervisor_id"] = req.user._id
    }
    const item = await employee
      .find(query1)
      .populate("city_id")
      .populate("country_id")
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

exports.sendEmployeeSMS = async (req, reply) => {
  let user = await employee.findById(req.params.id);
  if (!user) {
    const response = {
      status_code: 400,
      status: false,
      message: "حدث خطأ .. الرجاء المحاولة فيما بعد",
      items: {},
    };
    reply.code(200).send(response);
  }
  let msg = req.body.msg;

  sendSMS(user.phone_number, "", "", msg);
  const response = {
    status_code: 200,
    status: true,
    message: "تم ارسال الرسالة بنجاح",
    items: {},
  };
  reply.code(200).send(response);
};

exports.getSingleEmployeesAdmin = async (req, reply) => {
  const language = "ar";
  try {
    const user_id = req.params.id;
    const _Users = await employee.findById(user_id).select();
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
      $and: [{ employee_id: newUser._id }, { StatusId: 4 }],
    }).countDocuments();

    newUser.orders = _order;
    newUser.password = decryptPasswordfunction(newUser.password);

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

exports.updateEmploye = async (req, reply) => {
  const language = "ar";
  try {
    var newUser = new employee({
      phone_number: req.raw.body.phone_number,
    });
    // newUser.validate((err) => {
    //   if (err) {
    //     let msg = getErrors(err);
    //     reply.code(200).send(errorAPI(language, 400, msg, msg));
    //     return;
    //   }
    // });

    if (
      !req.raw.body.email ||
      !req.raw.body.full_name ||
      !req.raw.body.address
    ) {
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
    const _Users = await employee.findOne({
      $and: [
        { _id: { $ne: req.raw.body._id } },
        { isDeleted:false },
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
      let supervisor = await Supervisor.findById(req.raw.body.supervisor_id)

      if (req.raw.files) {
        const files = req.raw.files;
        let fileArr = [];
        for (let key in files) {
          fileArr.push({
            name: files[key].name,
            mimetype: files[key].mimetype,
          });
        }
        var data = Buffer.from(files.image.data);
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

        let img = "";
        await uploadImages(files.image.name).then((x) => {
          img = x;
        });

        const _newUser = await employee
          .findByIdAndUpdate(
            req.raw.body._id,
            {
              image: img,
              email: String(req.raw.body.email).toLowerCase(),
              address: req.raw.body.address,
              full_name: req.raw.body.full_name,
              supervisor_id: req.raw.body.supervisor_id,
              password: encryptPassword(req.raw.body.password),
              supplier_id: supervisor ? supervisor.supplier_id : null
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
          )
          .select();

        var newUser = _newUser.toObject();
        var _order = await Order.find({
          $and: [{ employee_id: newUser._id }, { StatusId: 4 }],
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
        const _newUser = await employee
          .findByIdAndUpdate(
            req.raw.body._id,
            {
              email: String(req.raw.body.email).toLowerCase(),
              address: req.raw.body.address,
              full_name: req.raw.body.full_name,
              supervisor_id: req.raw.body.supervisor_id,
              password: encryptPassword(req.raw.body.password),
              supplier_id: supervisor ? supervisor.supplier_id : null
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
          )
          .select();

        var newUser = _newUser.toObject();
        var _order = await Order.find({
          $and: [{ employee_id: newUser._id }, { StatusId: 4 }],
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

exports.addEmployee = async (req, reply) => {
  const language = "ar";
  try {
    var newUser = new employee({
      phone_number: req.raw.body.phone_number,
    });

    if (
      !req.raw.body.email ||
      !req.raw.body.full_name ||
      !req.raw.body.phone_number
    ) {
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
    const _Users = await employee.findOne({
      $and:[
        {isDeleted:false},
        { 
          $or: [
            { email: String(req.raw.body.email).toLowerCase() },
            { phone_number: req.raw.body.phone_number },
          ]
        }]
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

      let img = "";
      let cover = "";
      await uploadImages(files.image.name).then((x) => {
        img = x;
      });

      let supervisor = await Supervisor.findById(req.raw.body.supervisor_id)
      const _newUser = new employee({
        image: img,
        email: String(req.raw.body.email).toLowerCase(),
        phone_number: req.raw.body.phone_number,
        password: encryptPassword(req.raw.body.password),
        full_name: req.raw.body.full_name,
        supervisor_id: req.raw.body.supervisor_id,
        address: req.raw.body.address,
        supplier_id: supervisor ? supervisor.supplier_id : null,
        lat: 0.0,
        lng: 0.0,
        licenseNo: "",
        os: "",
        verify_code: "1234",
        token: "",
        fcmToken: "",
        isBlock: false,
        isDeleted: false,
        isVerify: true,
        isAvailable: false,
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
        $and: [{ employee_id: newUser._id }, { StatusId: 4 }],
      }).countDocuments();
      newUser.orders = _order;

      //send email
      var data = {
        name: rs.full_name,
        email: rs.email,
        password: decryptPasswordfunction(rs.password),
      };
      mail_welcome(req, rs.email, "منصة شعلة", "", data);

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
    const user = await employee.findByIdAndUpdate(
      req.body._id,
      {
        isBlock: req.body.isBlock,
        isDeleted: true
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


exports.testsend = async (req, reply) => {
  const language = req.headers["accept-language"];
  var msg = "مرحبا بكم في تطبيق شعلة كود التفعيل الخاص بكم 1233";
  // const sms_code = makeid(4);
  // const user = await employee.findByIdAndUpdate(
  //   req.body.id,
  //   {
  //     verify_code: sms_code,
  //   },
  //   { new: true }
  // );

  await sendSMS("966580260392", "", "", msg);
  reply
    .code(200)
    .send(
      success(
        language,
        200,
        MESSAGE_STRING_ARABIC.SUCCESS,
        MESSAGE_STRING_ENGLISH.SUCCESS,
        {}
      )
    );
};



exports.addSupplierPlace = async (req, reply) => {
  try {
    const checkBefore = await Place_Delivery.findOne({
      $and: [
        { place_id: req.body.place_id },
        { city_id: req.body.city_id },
        // { supplier_id: req.body.supplier_id },
        {isDeleted:false}
      ],
    });
    if (checkBefore) {
      const response = {
        status_code: 400,
        status: false,
        message: "تم اضافة المزود لهذه المنطقة مسبقا",
        items: [],
      };
      reply.code(200).send(response);
      return
    }
    let _place = new Place_Delivery({
      place_id: req.body.place_id,
      supplier_id: req.body.supplier_id,
      city_id: req.body.city_id,
    });

    var _return = handleError(_place.validateSync());
    if (_return.length > 0) {
      reply.code(200).send({
        status_code: 400,
        status: false,
        message: _return[0],
        items: _return,
      });
      return;
    }

    let rs = await _place.save();
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

exports.updateSupplierPlace = async (req, reply) => {
  try {
    const checkBefore = await Place_Delivery.findOne({
      $and: [
        { _id: { $ne: req.params.id } },
        { place_id: req.body.place_id },
        { city_id: req.body.city_id },
        { supplier_id: req.body.supplier_id },
        { isDelete: false }
      ],
    });
    if (checkBefore) {
      const response = {
        status_code: 400,
        status: false,
        message: "هذه البيانات موجودة من قبل",
        items: [],
      };
      reply.code(200).send(response);
      return
    }
    const _place = await Place_Delivery.findByIdAndUpdate(
      req.params.id,
      {
        place_id: req.body.place_id,
        supplier_id: req.body.supplier_id,
        city_id: req.body.city_id,
      },
      { new: true }
    );

    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: _place,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.deleteSupplierPlace = async (req, reply) => {
  try {
    const _place = await Place_Delivery.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );

    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: [],
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getSupplierPlaceAdmin = async (req, reply) => {
  try {
    var page = parseFloat(req.query.page, 10);
    var limit = parseFloat(req.query.limit, 10);

    var arr = [];
    const language = "ar";
    const total = await Place_Delivery.find({
      $and: [{ place_id: req.body.place_id }, { city_id: req.body.city_id },{isDeleted:false}],
    }).countDocuments();
    const cities = await Place_Delivery.find({
      $and: [{ place_id: req.body.place_id }, { city_id: req.body.city_id },{isDeleted:false}],
    })
      .populate("supplier_id")
      .populate("place_id")
      .populate("city_id")
      .skip(page * limit)
      .limit(limit)
      .sort({ _id: -1 });

    reply.code(200).send(
      success(
        language,
        200,
        MESSAGE_STRING_ARABIC.SUCCESS,
        MESSAGE_STRING_ENGLISH.SUCCESS,
        cities,
        {
          size: cities.length,
          totalElements: total,
          totalPages: Math.floor(total / limit),
          pageNumber: page,
        }
      )
    );
    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getSingleSupplierPlace = async (req, reply) => {
  try {
    const language = "ar";
    const _place = await Place_Delivery.findById(req.params.id)
      .populate("supplier_id")
      .populate({
        path: "supplier_id",
        populate: {
          path: "cities",
        },
      });
    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          _place
        )
      );
    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getEmployeesBySupervisor = async (req, reply) => {
  try {
    const item = await employee
      .find({supervisor_id:req.params.id, isDeleted:false})
      .sort({ _id: -1 });

    var newArr = [];
    for await (const data of item) {
      var newUser = data.toObject();
      var _order = await Order.find({$and: [{ employee_id: newUser._id }, { stauts: {$in:[ORDER_STATUS.finished , ORDER_STATUS.rated]} }]}).countDocuments();
      newUser.orders = _order;
      newArr.push(newUser);
    }

    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: newArr
    };
    reply.send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};