// External Dependancies
const boom = require("boom");
const jwt = require("jsonwebtoken");
const config = require("config");
const fs = require("fs");
const async = require("async");
const lodash = require("lodash");
const moment = require("moment-timezone");
const Joi = require("@hapi/joi");
const axios = require("axios");
const utils = require("../utils/utils");

// Get Data Models

const { Order } = require("../models/Order");
const {
  Users,
  User_Address,
  User_Uncovered,
  validateUsers,
  getErrors,
  setLanguage,
} = require("../models/User");
const {
  getCurrentDateTime,
  walletsettings,
  setting,
} = require("../models/Constant");
const { Adv } = require("../models/adv");
const { Notifications } = require("../models/Notifications");
const { emloyee } = require("../models/Employee");
const { Favorite } = require("../models/Favorite");
const {
  encryptPassword,
  mail_reset_password,
  makeid,
  uploadImages,
  CreateGeneralNotification,
  CreateNotification,
  sendSMS,
  getAddress,
  emailRegex,
  handleError,
  NewPayment,
  makeOrderNumber
} = require("../utils/utils");
const { success, errorAPI } = require("../utils/responseApi");
const {
  MESSAGE_STRING_ENGLISH,
  MESSAGE_STRING_ARABIC,
  LANGUAGE_ENUM,
  USER_TYPE,
  VALIDATION_MESSAGE_ARABIC,
  VALIDATION_MESSAGE_ENGLISH,
  ORDER_STATUS,
} = require("../utils/constants");
const { coupon_usage } = require("../models/Coupon");

// Get all Users
exports.getUsers = async (req, reply) => {
  // try {

    var page = parseFloat(req.query.page, 10);
    var limit = parseFloat(req.query.limit, 10);
    let search_field = req.body.search_field;
    let search_value = req.body.search_value;

    let query1 = {};
    query1[search_field] = { $regex: new RegExp(search_value, "i") };

    console.log('xxxxxxxx')
    const total = await Users.find(query1).countDocuments();
    const item = await Users.find(query1)
      .populate("city_id")
      .skip(page * limit)
      .limit(limit);

      for await (const i of item){
        var referal = await Users.find({by:i._id})
        console.log(referal)
        item.favorites = referal.length
      }

      const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: item,
      pagenation: {
        size: item.length,
        totalElements: total,
        totalPages: Math.floor(total / limit),
        pageNumber: page,
      },
    };
    reply.send(response);
  // } catch (err) {
  //   throw boom.boomify(err);
  // }
};

exports.getUsersExcel = async (req, reply) => {
  try {
    console.log(req.body);

    let search_field = req.body.search_field;
    let search_value = req.body.search_value;

    let query1 = {};
    query1[search_field] = { $regex: new RegExp(search_value, "i") };

    const total = await Users.find(query1).countDocuments();
    const item = await Users.find(query1).populate("city_id");
    console.log(item);
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

exports.getSingleUsers = async (req, reply) => {
  const language = req.headers["accept-language"];
  try {
    const user_id = req.user._id;
    const _Users = await Users.findById(user_id)
    .populate("categories")
    .populate("work")
    .populate("country")
    .select();
    var newUser = _Users.toObject();
    var subs = []
    var country = null
    if(newUser.country){
      country = {
        _id: newUser.country._id,
        title: newUser.country[`${language}Name`],
      }
    }
    if(newUser.work){
      work = {
        _id: newUser.work._id,
        title: newUser.work[`${language}Name`],
        description: newUser.work[`${language}Description`],
      }
    }
    if(_Users.categories){
      _Users.categories.forEach(_newObject => {
        var obj = {
          _id: _newObject._id,
          title: _newObject[`${language}Name`],
          description: _newObject[`${language}Description`],
        };
        subs.push(obj)
      });
    }
    
    newUser.country = country
    newUser.categories = subs
    newUser.work = work
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
    reply.code(200).send(errorAPI(language, 400, err.message, err.message));
    return;
  }
};

// Add a new Users
exports.addUsers = async (req, reply) => {
  const language = req.headers["accept-language"];
  try {
    // const _error = validateUsers(req.body, language);

    // console.log(validateUsers2(language, req.body));
    setLanguage(language);
    validateUsers(req.body);

    var _newUser = new Users({
      phone_number: req.body.phone_number,
    });
    _newUser.validate((err) => {
      if (err) {
        let msg = getErrors(err);
        reply.code(200).send(errorAPI(language, 400, msg, msg));
        return;
      }
    });

    // if (_error.error) {
    //   reply
    //     .code(200)
    //     .send(
    //       errorAPI(
    //         language,
    //         400,
    //         _error.error.details[0].message,
    //         _error.error.details[0].message
    //       )
    //     );
    //   return;
    // }
    let verify_code = "1234";//makeid(4);
    const _user = await Users.findOne({ phone_number: req.body.phone_number });
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
      } else {
        //login
        const rs = await Users.findByIdAndUpdate(
          _user._id,
          {
            verify_code: verify_code,
            address: req.body.address,
            fcmToken: req.body.fcmToken,
            isVerify: false,
            os: req.body.os,
            lat: parseFloat(req.body.lat),
            lng: parseFloat(req.body.lng),
            loc: {
              type: "Point",
              coordinates: [Number(req.body.lat), Number(req.body.lng)],
            },
            token: jwt.sign(
              { _id: _user._id, userType: USER_TYPE.USER },
              config.get("jwtPrivateKey"),
              {
                expiresIn: "365d",
              }
            ),
          },
          { new: true }
        )
        .populate("categories")
        .populate("work")
        .populate("country");

        let msg = "مرحبا بكم في تطبيق جاز توك رمز التفعيل هو: " + verify_code;
        sendSMS(req.body.phone_number, "", "", msg);
        var newUser = rs.toObject();
        var subs = []
        var country = null
        var work = null
        if(newUser.country){
          country = {
            _id: newUser.country._id,
            title: newUser.country[`${language}Name`],
          }
        }
        if(newUser.work){
          work = {
            _id: newUser.work._id,
            title: newUser.work[`${language}Name`],
            description: newUser.work[`${language}Description`],
          }
        }
        if(newUser.categories){
          newUser.categories.forEach(_newObject => {
            var obj = {
              _id: _newObject._id,
              title: _newObject[`${language}Name`],
              description: _newObject[`${language}Description`],
            };
            subs.push(obj)
          });
        }
        
        newUser.country = country
        newUser.categories = subs
        newUser.work = work
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
      }
    } else {
      //register
      //send sms
      let user = new Users({
        full_name: "",
        reg_no: "",
        phone_number: req.body.phone_number,
        email: "",
        password: "",
        image: "",
        id_image: "",
        dob: null,
        bio: "",
        address: "",
        os: req.body.os,
        lat: parseFloat(req.body.lat),
        lng: parseFloat(req.body.lng),
        verify_code: verify_code,
        isEnableNotifications: true,
        token: "",
        fcmToken: req.body.fcmToken,
        country: null,
        categories: [],
        register_type:req.body.register_type,
        app_type: req.body.app_type,
        loc: {
          type: "Point",
          coordinates: [Number(req.body.lat), Number(req.body.lng)],
        },        
      });
      let rs = await user.save();
      let msg = "مرحبا بكم في تطبيق جاز توك رمز التفعيل هو: " + verify_code;
      console.log(req.body.phone_number)
      sendSMS(req.body.phone_number, "", "", msg);
            
      reply
        .code(200)
        .send(
          success(
            language,
            200,
            MESSAGE_STRING_ARABIC.CREATE_USER,
            MESSAGE_STRING_ENGLISH.CREATE_USER,
            rs
          )
        );
      return;
    }
  } catch (err) {
    console.log(err)
    reply.code(200).send(errorAPI(language, 400, err.message, err.message));
    return;
  }
};

//verfy code
exports.verify = async (req, reply) => {
  const language = req.headers["accept-language"];

  setLanguage(language);
  validateUsers(req.body);

  var newUser = new Users({
    phone_number: req.body.phone_number,
  });
  newUser.validate((err) => {
    if (err) {
      let msg = getErrors(err);
      reply.code(200).send(errorAPI(language, 400, msg, msg));
      return;
    }
  });

  const _user = await Users.findOne({
    $and: [{ _id: req.body.id }, { phone_number: req.body.phone_number }],
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
    const _Users = await Users.findById(req.body.id);
    if (_Users) {
      const update = await Users.findByIdAndUpdate(
        req.body.id,
        {
          phone_number: req.body.phone_number,
          isVerify: true,
          by: req.body.by,
          token: jwt.sign(
            { _id: _user._id, userType: USER_TYPE.USER },
            config.get("jwtPrivateKey"),
            {
              expiresIn: "365d",
            }
          ),
        },
        { new: true }
      )
      .populate('categories')
      .populate("work")
      .populate('country');
      var newUser = update.toObject();
      var subs = []
      var country = null
      var work = null
      if(newUser.country){
        country = {
          _id: newUser.country._id,
          title: newUser.country[`${language}Name`],
        }
      }
      if(newUser.work){
        work = {
          _id: newUser.work._id,
          title: newUser.work[`${language}Name`],
          description: newUser.work[`${language}Description`],
        }
      }
      if(newUser.categories){
        newUser.categories.forEach(_newObject => {
          var obj = {
            _id: _newObject._id,
            title: _newObject[`${language}Name`],
            description: _newObject[`${language}Description`],
          };
          subs.push(obj)
        });
      }
      
      newUser.country = country
      newUser.categories = subs
      newUser.work = work
      var orderNo = `#${utils.makeid(6)}`;
      const settings = await setting.findOne({code:"WALLET_REFERAL"});
      await NewPayment(update._id, orderNo, "دعوة من احد الأصدقاء", "+" , Number(settings.value), "Online")
      if(req.body.by && req.body.by != "") {
        console.log(req.body.by)
        await NewPayment(req.body.by, orderNo, "دعوة من احد الأصدقاء", "+", Number(settings.value), "Online")
      }

      reply
        .code(200)
        .send(
          success(
            language,
            200,
            MESSAGE_STRING_ARABIC.USER_VERIFY_SUCCESS,
            MESSAGE_STRING_ENGLISH.USER_VERIFY_SUCCESS,
            newUser
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
            MESSAGE_STRING_ARABIC.USER_NOT_FOUND,
            MESSAGE_STRING_ENGLISH.USER_NOT_FOUND
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
    const _Users = await Users.findOne({
      email: String(req.body.email).toLowerCase(),
    });
    if (_Users) {
      var newPassword = "1234";//makeid(8);
      let pass = encryptPassword(newPassword);
      const update = await Users.findByIdAndUpdate(
        _Users._id,
        { password: pass },
        { new: true }
      );

      const address = await User_Address.find({
        $and: [{ user_id: update._id }],
      });
      var newUser = update.toObject();
      const orders = await Order.find({
        $and: [{ user_id: update._id }, { StatusId: 4 }],
      }).countDocuments();
      // const favorits = await Favorite.find({
      //   user_id: update._id,
      // }).countDocuments();
      // newUser.favorite = favorits;
      newUser.orders = orders;
      newUser.delivery_address = address;

      var data = {
        full_name: _Users.full_name,
        newPassword: newPassword,
      };

      //mail_reset_password(req, req.body.email, "استعادة كلمة المرور", "", data);

      reply
        .code(200)
        .send(
          success(
            language,
            200,
            MESSAGE_STRING_ARABIC.USER_FORGET_PASSWORD_SUCCESS,
            MESSAGE_STRING_ENGLISH.USER_FORGET_PASSWORD_SUCCESS,
            newUser
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

// Update an existing Users
exports.updateProfile = async (req, reply) => {
  const language = req.headers["accept-language"];
  // try {
    if (
      !req.body.email ||
      !req.body.full_name ||
      !req.body.lat ||
      !req.body.lng
    ) {
      reply
        .code(200)
        .send(
          errorAPI(
            language,
            400,
            VALIDATION_MESSAGE_ARABIC.ALL_REQUIRED,
            VALIDATION_MESSAGE_ENGLISH.ALL_REQUIRED
          )
        );
      return;
    }

    const _Users = await Users.findOne({
      $and: [
        { _id: { $ne: req.user._id } },
        {
          $or: [{ email: String(req.body.email).toLowerCase() }],
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
        const _newUser = await Users.findByIdAndUpdate(
          req.user._id,
          {
            image: req.body.image,
            id_image: req.body.id_img,
            email: String(req.body.email).toLowerCase(),
            full_name: req.body.full_name,
            bio: req.body.bio,
            reg_no: req.body.reg_no,
            address: req.body.address,
            country: req.body.country,
            city: req.body.city,
            dob:  req.body.dob,
            bio:  req.body.bio,
            lat:  req.body.lat,
            lng:  req.body.lng,
            categories:  req.body.categories,
            work:  req.body.work ? req.body.work : null,
            loc:  {
              type: "Point",
              coordinates: [Number(req.body.lat), Number(req.body.lng)],
            },   
          },
          { new: true }
        )
        .populate("categories")
        .populate("country")
        .populate("work")
        .select();
        var newUser = _newUser.toObject();
        var subs = []
        var country = null
        var work = null
        if(newUser.country){
          country = {
            _id: newUser.country._id,
            title: newUser.country[`${language}Name`],
          }
        }
        if(newUser.work){
          work = {
            _id: newUser.work._id,
            title: newUser.work[`${language}Name`],
            description: newUser.work[`${language}Description`],
          }
        }
        if(newUser.categories){
          newUser.categories.forEach(_newObject => {
            var obj = {
              _id: _newObject._id,
              title: _newObject[`${language}Name`],
              description: _newObject[`${language}Description`],
            };
            subs.push(obj)
          });
        }
        newUser.country = country
        newUser.categories = subs
        newUser.work = work

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
   
    }
  // } catch (err) {
  //   reply.code(200).send(errorAPI(language, 400, err.message, err.message));
  //   return;
  // }
};

exports.uploadUserPhoto = async (req, reply) => {
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

    const response = {
      status_code: 200,
      status: true,
      messageAr: "تمت العملية بنجاح",
      messageEn: "Updated Successfully",
      items: img,
    };
    reply.code(200).send(response);
  }
};

exports.updateUserAndroid = async (req, reply) => {
  try {
    const user_id = req.user._id;
    const preUser = await Users.findById(user_id);
    var lat = preUser.lat;
    var lng = preUser.lng;
    var address = preUser.address;
    if (Number(req.body.lat) && Number(req.body.lng)) {
      // await getAddress(Number(req.body.lat), Number(req.body.lng)).then((x) => {
      //   address = x;
      // });
      var lat = Number(req.body.lat);
      var lng = Number(req.body.lng);
    }
    if (req.body.image) {
      const user = await Users.findByIdAndUpdate(
        user_id,
        {
          image: req.body.image,
          address: req.body.address,
          full_name: req.body.full_name,
          email: String(req.body.email).toLowerCase(),
          city_id: req.body.city_id,
          lat: lat,
          lng: lng,
        },
        { new: true }
      );

      const response = {
        status_code: 200,
        status: true,
        messageAr: "تمت العملية بنجاح",
        messageEn: "Updated Successfully",
        items: user,
      };
      reply.send(response);
    } else {
      const user = await Users.findByIdAndUpdate(
        user_id,
        {
          address: req.body.address,
          full_name: req.body.full_name,
          email: String(req.body.email).toLowerCase(),
          lat: lat,
          lng: lng,
        },
        { new: true }
      );

      const response = {
        status_code: 200,
        status: true,
        messageAr: "تمت العملية بنجاح",
        messageEn: "Updated Successfully",
        items: user,
      };
      reply.send(response);
    }
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.changePhone = async (req, reply) => {
  const language = req.headers["accept-language"];
  try {
    const User_id = req.user._id;

    var _error = Joi.assert(
      req.body.phone_number,
      Joi.number()
        .empty()
        .required()
        .error((errors) => {
          errors.forEach((err) => {
            console.log(err.code);
            switch (err.code) {
              case "any.required":
              case "number.base":
              case "number.empty":
                if (language == LANGUAGE_ENUM.EN) {
                  err.message = VALIDATION_MESSAGE_ENGLISH.PHONE_REQUIRED;
                } else {
                  err.message = VALIDATION_MESSAGE_ARABIC.PHONE_REQUIRED;
                }
                break;
              default:
                break;
            }
          });
          return errors;
        })
    );
    if (_error && _error.error) {
      reply
        .code(200)
        .send(
          errorAPI(
            language,
            400,
            _error.error.details[0].message,
            _error.error.details[0].message
          )
        );
      return;
    }

    //send sms
    const _user = await Users.findOne({
      $and: [
        { _id: { $ne: User_id } },
        { phone_number: req.body.phone_number },
      ],
    });
    if (_user) {
      reply
        .code(200)
        .send(
          errorAPI(
            language,
            400,
            MESSAGE_STRING_ARABIC.USER_EXSIT3,
            MESSAGE_STRING_ENGLISH.USER_EXSIT3
          )
        );
      return;
    }

    const sms_code = "1234";//makeid(4);

    const update = await Users.findByIdAndUpdate(
      User_id,
      { verify_code: sms_code, isVerify: false },
      { new: true }
    )
      .populate("country_id")
      .populate("city_id");

    var newUser = update.toObject();
    var country = {
      _id: update.country_id._id,
      name: update.country_id[`${language}Name`],
      flag: update.country_id.flag ? update.country_id.flag : "",
      code: update.country_id.code ? update.country_id.code : "",
    };
    var city = {
      _id: update.city_id._id,
      name: update.city_id[`${language}Name`],
    };

    newUser.country_id = country;
    newUser.city_id = city;
    var msg = ""
    if (language == LANGUAGE_ENUM.EN) {
      msg = MESSAGE_STRING_ENGLISH.WELCOME + sms_code;
    } else {
      msg = MESSAGE_STRING_ARABIC.WELCOME + sms_code;
    }

    sendSMS(update.phone_number, "", "", msg);


    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SEND_SMS,
          MESSAGE_STRING_ENGLISH.SEND_SMS,
          update
        )
      );
    return;
  } catch (err) {
    reply.code(200).send(errorAPI(language, 400, err.message, err.message));
    return;
  }
};

//logout
exports.logout = async (req, reply) => {
  const language = req.headers["accept-language"];
  try {
    const User_id = req.params.id;
    const checkUser = await Users.findById(req.params.id);
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
    const user = await Users.findByIdAndUpdate(
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
      const address = await User_Address.find({
        $and: [{ user_id: user._id }],
      });
      var newUser = user.toObject();
      const orders = await Order.find({
        $and: [{ user_id: user._id }, { StatusId: 4 }],
      }).countDocuments();
      // const favorits = await Favorite.find({
      //   user_id: user._id,
      // }).countDocuments();
      // newUser.favorite = favorits;
      newUser.orders = orders;
      newUser.delivery_address = address;

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

//refresh API token
exports.refreshAPIToken = async (req, reply) => {
  const language = req.headers["accept-language"];
  try {
    const User_id = req.body.id;
    const user = await Users.findByIdAndUpdate(
      User_id,
      {
        token: jwt.sign(
          { _id: _user._id, userType: USER_TYPE.USER },
          config.get("jwtPrivateKey"),
          {
            expiresIn: "365d",
          }
        ),
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
    } else {
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
    }
  } catch (err) {
    reply.code(200).send(errorAPI(language, 400, err.message, err.message));
    return;
  }
};

//refresh FCM token
exports.refreshFCMToken = async (req, reply) => {
  const language = req.headers["accept-language"];
  try {
    const User_id = req.body.id;
    const user = await Users.findByIdAndUpdate(
      User_id,
      {
        fcmToken: req.body.fcmToken,
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
    } else {
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
    }
  } catch (err) {
    reply.code(200).send(errorAPI(language, 400, err.message, err.message));
    return;
  }
};

exports.userslist = async (req, reply) => {
  try {
    const page = parseInt(req.query.page, 10);
    const limit = parseInt(req.query.limit, 10);
    const total = await Users.find().countDocuments();
    var result = [];
    const xx = await Users.find()
      .select(["-token", "-password"])
      .sort({ _id: -1 })
      .skip(page * limit)
      .limit(limit);
    result = xx;
    const response = {
      items: result,
      status_code: 200,
      message: "returned successfully",
      pagenation: {
        size: result.length,
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

exports.block = async (req, reply) => {
  try {
    const user = await Users.findByIdAndUpdate(
      req.body._id,
      {
        isBlock: req.body.isBlock,
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

exports.getAllUsers = async (req, reply) => {
  try {
    var result = [];
    const xx = await Users.find();
    result = xx;
    const response = {
      items: result,
      status_code: 200,
      message: "returned successfully",
    };
    reply.send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.deleteUser = async (req, reply) => {
  try {
    await Users.findByIdAndRemove(req.params.id);
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

exports.guestToken = async (req, reply) => {
  var token = jwt.sign(
    { _id: "5e0866b91c9d440000299743", userType: "guest" },
    config.get("jwtPrivateKey"),
    {
      expiresIn: "365d",
    }
  );
  const response = {
    status_code: 200,
    status: true,
    messageAr: "تمت العملية بنجاح",
    messageEn: "Saved successfully",
    items: token,
  };
  reply.send(response);
};

exports.Resend = async (req, reply) => {
  const language = req.headers["accept-language"];
  var msg = "";
  const sms_code = "1234";//makeid(4);

  if (!req.body.id) {
    reply
      .code(200)
      .send(
        errorAPI(
          language,
          400,
          VALIDATION_MESSAGE_ARABIC.ALL_REQUIRED,
          VALIDATION_MESSAGE_ENGLISH.ALL_REQUIRED
        )
      );
    return;
  }
  const checkUser = await Users.findById(req.body.id);
  if (!checkUser) {
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
  const user = await Users.findByIdAndUpdate(
    req.body.id,
    {
      verify_code: sms_code,
    },
    { new: true }
  );
  const address = await User_Address.find({
    $and: [{ user_id: user._id }],
  });
  var newUser = user.toObject();
  const orders = await Order.find({
    $and: [{ user_id: user._id }, { StatusId: 4 }],
  }).countDocuments();
  // const favorits = await Favorite.find({ user_id: user._id }).countDocuments();
  // newUser.favorite = favorits;
  newUser.orders = orders;
  newUser.delivery_address = address;
  if (language == LANGUAGE_ENUM.EN) {
    msg = MESSAGE_STRING_ENGLISH.WELCOME + sms_code;
  } else {
    msg = MESSAGE_STRING_ARABIC.WELCOME + sms_code;
  }

  sendSMS(user.phone_number, "", "", msg);
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
};

exports.AddSMS = async (req, reply) => {
  let msg = req.body.msg;
  let phone = req.body.phone_number;

  sendSMS(phone, "", "", msg);
  
  const response = {
    status_code: 200,
    status: true,
    message: "تم ارسال الرسالة بنجاح",
    items: null,
  };
  reply.code(200).send(response);
};

exports.getUserAddress = async (req, reply) => {
  const language = req.headers["accept-language"];
  try {
    const user_id = req.user._id;
    var checkUserAddress = await User_Address.find({ user_id: user_id });

    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          checkUserAddress
        )
      );
    return;
  } catch (err) {
    reply.code(200).send(errorAPI(language, 400, err.message, err.message));
    return;
  }
};

exports.getUserAddressType = async (req, reply) => {
  const language = req.headers["accept-language"];
  try {
    const user_id = req.user._id;
    var checkUserAddress = await User_Address.find({ $and:[{user_id: user_id}, {type:req.params.type}] });
    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          checkUserAddress
        )
      );
    return;
  } catch (err) {
    reply.code(200).send(errorAPI(language, 400, err.message, err.message));
    return;
  }
};


exports.addUserAddress = async (req, reply) => {
  const language = req.headers["accept-language"];
  try {
    const user_id = req.user._id;

    if (!req.body.lat || !req.body.lng || !req.body.address) {
      reply
        .code(200)
        .send(
          errorAPI(
            language,
            400,
            VALIDATION_MESSAGE_ARABIC.ALL_REQUIRED,
            VALIDATION_MESSAGE_ENGLISH.ALL_REQUIRED
          )
        );
      return;
    }

    var checkUserAddress = await User_Address.find({ user_id: user_id });
    var isDefault = true;
    if (checkUserAddress.length > 0) {
      isDefault = false;
    }
    let rs = new User_Address({
      title: req.body.title,
      lat: req.body.lat,
      lng: req.body.lng,
      address: req.body.address,
      user_id: user_id,
      isDefault: isDefault,
      discount: 0,

      streetName: req.body.streetName,
      floorNo: req.body.floorNo,
      buildingNo: req.body.buildingNo,
      flatNo: req.body.flatNo,
      type: req.body.type
    });

    let _rs = await rs.save();

    await Users.findByIdAndUpdate(
      user_id,
      {
        address: req.body.address,
        lat: parseFloat(req.body.lat),
        lng: parseFloat(req.body.lng),
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
          _rs
        )
      );
    return;
  } catch (err) {
    reply.code(200).send(errorAPI(language, 400, err.message, err.message));
    return;
  }
};

exports.updateUserAddress = async (req, reply) => {
  const language = req.headers["accept-language"];
  try {
    const user_id = req.user._id;

    if (!req.body.lat || !req.body.lng || !req.body.address) {
      reply
        .code(200)
        .send(
          errorAPI(
            language,
            400,
            VALIDATION_MESSAGE_ARABIC.ALL_REQUIRED,
            VALIDATION_MESSAGE_ENGLISH.ALL_REQUIRED
          )
        );
      return;
    }

    var _rs = await User_Address.findByIdAndUpdate(
      req.body.id,
      {
        title: req.body.title,
        address: req.body.address,
        streetName: req.body.streetName,
        floorNo: req.body.floorNo,
        buildingNo: req.body.buildingNo,
        flatNo: req.body.flatNo,
        type: req.body.type,
        lat: parseFloat(req.body.lat),
        lng: parseFloat(req.body.lng),
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
          _rs
        )
      );
    return;
  } catch (err) {
    reply.code(200).send(errorAPI(language, 400, err.message, err.message));
    return;
  }
};

exports.deleteUserAddress = async (req, reply) => {
  const language = req.headers["accept-language"];
  try {
    const user_id = req.user._id;
    await User_Address.findByIdAndRemove(req.body.id);
    var checkUserAddress = await User_Address.find({ user_id: user_id });
    if (checkUserAddress.length > 0) {
      var _rs = await User_Address.findByIdAndUpdate(checkUserAddress[0]._id, { isDefault: true}, { new: true });
      reply
        .code(200)
        .send(
          success(
            language,
            200,
            MESSAGE_STRING_ARABIC.SUCCESS,
            MESSAGE_STRING_ENGLISH.SUCCESS
          )
        );
      return;
    }

    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS
        )
      );
    return;
  } catch (err) {
    reply.code(200).send(errorAPI(language, 400, err.message, err.message));
    return;
  }
};

exports.defaultUserAddress = async (req, reply) => {
  const language = req.headers["accept-language"];
  try {
    await User_Address.updateMany(
      { user_id: req.user._id },
      { isDefault: false },
      function (err) {}
    );

    await User_Address.findByIdAndUpdate(
      req.body.id,
      {
        isDefault: true,
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
          MESSAGE_STRING_ENGLISH.SUCCESS
        )
      );
    return;
  } catch (err) {
    reply.code(200).send(errorAPI(language, 400, err.message, err.message));
    return;
  }
};

exports.addUnCoveredOrder = async (req, reply) => {
  const language = req.headers["accept-language"];
  try {
    const user_id = req.user._id;
    const user_type = req.user.userType;

    var address = "";
    // getAddress(req.body.lat, req.body.lng).then((x) => {
    //   address = x;
    // });
    let rs = new User_Uncovered({
      user_id: user_id,
      user_type: user_type,
      lat: req.body.lat,
      lng: req.body.lng,
      address: address,
    });

    let _rs = await rs.save();
    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          _rs
        )
      );
    return;
  } catch (err) {
    reply.code(200).send(errorAPI(language, 400, err.message, err.message));
    return;
  }
};

exports.getUnCovered = async (req, reply) => {
  try {
    let searchDate = moment()
      .add(-6, "months")
      .startOf("day")
      .tz("Asia/Riyadh");

    const item = await User_Uncovered.find({ createAt: { $gte: searchDate } });
    // .limit(2000)
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

///////////Admin////////////
exports.getUsers = async (req, reply) => {
  try {
    var page = parseFloat(req.query.page, 10);
    var limit = parseFloat(req.query.limit, 10);
    let search_field = req.body.search_field;
    let search_value = req.body.search_value;

    let query1 = {};
    query1[search_field] = { $regex: new RegExp(search_value, "i") };

    const total = await Users.find(query1).countDocuments();
    const item = await Users.find(query1)
      .skip(page * limit)
      .limit(limit)
      .sort({ _id: -1 });

    var newArr = [];
    for await (const data of item) {
      var newUser = data.toObject();
      var _order = await Order.countDocuments({$and: [{ user: newUser._id }]});
      var referal = await Users.countDocuments({by:data._id})
      newUser.favorites = referal
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

exports.getUsersExcel = async (req, reply) => {
  try {
    let search_field = req.body.search_field;
    let search_value = req.body.search_value;

    let query1 = {};
    query1[search_field] = { $regex: new RegExp(search_value, "i") };

    const item = await Users.find(query1)
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

exports.getUserAddressAdmin = async (req, reply) => {
  try {
    var page = parseFloat(req.query.page, 10);
    var limit = parseFloat(req.query.limit, 10);
    let userId = req.params.id;
    const total = await User_Address.find({ user_id: userId }).countDocuments();
    const items = await User_Address.find({ user_id: userId })
      .skip(page * limit)
      .limit(limit)
      .sort({ _id: -1 });

    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: items,
      pagenation: {
        size: items.length,
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

exports.sendUserSMS = async (req, reply) => {
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

exports.getSingleUsersAdmin = async (req, reply) => {
  const language = req.headers["accept-language"];
  try {
    const user_id = req.params.id;
    const _Users = await Users.findById(user_id).select();
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
      $and: [{ user_id: newUser._id }, { StatusId: 4 }],
    }).countDocuments();
    var _favorite = await Favorite.find({
      user_id: newUser._id,
    }).countDocuments();

    newUser.orders = _order;
    newUser.favorites = _favorite;

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

exports.updateUser = async (req, reply) => {
  const language = "ar";
  try {
    setLanguage(language);
    var newUser = new Users({
      phone_number: req.raw.body.phone_number,
    });
    newUser.validate((err) => {
      if (err) {
        let msg = getErrors(err);
        reply.code(200).send(errorAPI(language, 400, msg, msg));
        return;
      }
    });

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
    const _Users = await Users.findOne({
      $and: [
        { _id: { $ne: req.raw.body._id } },
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

        const _newUser = await Users.findByIdAndUpdate(
          req.raw.body._id,
          {
            image: img,
            email: String(req.raw.body.email).toLowerCase(),
            address: req.raw.body.address,
            full_name: req.raw.body.full_name,
            streetName: req.raw.body.streetName,
            floorNo: req.raw.body.floorNo,
            buildingNo: req.raw.body.buildingNo,
            flatNo: req.raw.body.flatNo
          },
          { new: true }
        ).select();

        var newUser = _newUser.toObject();
        var _order = await Order.find({
          $and: [{ user_id: newUser._id }, { StatusId: 4 }],
        }).countDocuments();
        var _favorite = await Favorite.find({
          user_id: newUser._id,
        }).countDocuments();
        newUser.orders = _order;
        newUser.favorites = _favorite;

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
            address: req.raw.body.address,
            full_name: req.raw.body.full_name,
            streetName: req.raw.body.streetName,
            floorNo: req.raw.body.floorNo,
            buildingNo: req.raw.body.buildingNo,
            flatNo: req.raw.body.flatNo
          },
          { new: true }
        ).select();

        var newUser = _newUser.toObject();
        var _order = await Order.find({
          $and: [{ user_id: newUser._id }, { StatusId: 4 }],
        }).countDocuments();
        var _favorite = await Favorite.find({
          user_id: newUser._id,
        }).countDocuments();

        newUser.orders = _order;
        newUser.favorites = _favorite;

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

exports.updateUserAddressAdmin = async (req, reply) => {
  var _rs = await User_Address.findByIdAndUpdate(
    req.params.id,
    {
      discount: req.body.discount,
    },
    { new: true }
  );
  const response = {
    status_code: 200,
    status: true,
    message: "تم حفظ المعلومات بنجاح",
    items: _rs,
  };
  reply.code(200).send(response);
};

exports.updateWallet = async (req, reply) => {
  const language = req.headers["accept-language"];
  try {
    var orderNo = `${makeOrderNumber(6)}`;
    const _user = await NewPayment(req.user._id, orderNo ,"شحن المحفظة الالكترونية", "+", req.body.amount, "Online" );
    if(req.body.coupon && req.body.coupon != ""){
      let usage = new coupon_usage({
        coupon: req.body.coupon,
        dt_date: getCurrentDateTime(),   
        amount: Number(req.body.amount),
        user: req.user._id
      });
      await usage.save()
    }
    reply
    .code(200)
    .send(
      success(
        language,
        200,
        MESSAGE_STRING_ARABIC.SUCCESS,
        MESSAGE_STRING_ENGLISH.SUCCESS,
        _user
      )
    );   
  } catch (err) {
    throw boom.boomify(err);
  }
};


exports.referalDeepLink = async (req, reply) => {
  // let msg = req.body.msg;
  const language = "ar";
  const user = await Users.findById(req.user._id);
  var body = {
      "dynamicLinkInfo": {
      "domainUriPrefix": "https://khawi.page.link",
      "link": "https://google.com?referal_id="+user._id,
      "androidInfo": {
        "androidPackageName": "com.khawi",
        "androidFallbackLink": "https://google.com"
      },
      "iosInfo": {
        "iosBundleId": "com.Fazaa.Khawi",
        "iosFallbackLink": "https://google.com",
      },
      "navigationInfo": {
        "enableForcedRedirect": true
      }
    },
    "suffix": {
      "option": "UNGUESSABLE"
    }
  };

  let _config = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const url = "https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=AIzaSyBR15gqERpWd0IbmAk1zGIGur_hrlRbEm4";
  axios
  .post(url, body, {})
  .then(async (response) => {
    if(response.data){
      let obj = {
        shortLink: response.data.shortLink,
        previewLink: response.data.previewLink,
      }
      reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          obj
        )
      );  
    }else{
      reply
      .code(200)
      .send(
        errorAPI(
          language,
          400,
          MESSAGE_STRING_ARABIC.USER_BLOCK,
          MESSAGE_STRING_ENGLISH.USER_BLOCK,
          null
        )
      );
    return;
    }
  })
  .catch((error) => {
    reply
    .code(200)
    .send(
      errorAPI(
        language,
        400,
        MESSAGE_STRING_ARABIC.USER_BLOCK,
        MESSAGE_STRING_ENGLISH.USER_BLOCK,
        null
      )
    );
  return;
  });
};