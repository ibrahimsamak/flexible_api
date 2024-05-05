// External Dependancies
const boom = require("boom");
const jwt = require("jsonwebtoken");
const config = require("config");
const util = require("util");
const moment = require("moment");

// Get Data Models
const { Admin } = require("../models/Admin");
const { Supplier, Supervisor } = require("../models/Product");
const {
  encryptPassword,
  decryptPasswordfunction,
  handleError,
  makeid,
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
  ACTORS,
} = require("../utils/constants");

// Get all Admins
exports.getAdmins = async (req, reply) => {
  try {
    var page = parseFloat(req.query.page, 10);
    var limit = parseFloat(req.query.limit, 10);
    var query = {}
    if(req.query.email && req.query.email != ""){
      query["email"] = req.query.email
    }
    if(req.query.name && req.query.name != ""){
      query["name"] = req.query.full_name
    }
    if(req.query.phone_number && req.query.phone_number != ""){
      query["phone_number"] = req.query.phone_number
    }
    const total = await Admin.find(query).countDocuments();
    const item = await Admin.find(query)
      .sort({ _id: -1 })
      .skip(page * limit)
      .limit(limit);
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
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getExcelAdmins = async (req, reply) => {
  try {
    var query = {}
    if(req.query.email && req.query.email != ""){
      query["email"] = req.query.email
    }
    if(req.query.name && req.query.name != ""){
      query["name"] = req.query.full_name
    }
    if(req.query.phone_number && req.query.phone_number != ""){
      query["phone_number"] = req.query.phone_number
    }
    const item = await Admin.find(query)
      .sort({ _id: -1 })

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

// Get single Admin by ID
exports.getSingleAdmin = async (req, reply) => {
  try {
    const Admins = await Admin.findById(req.params.id);
    Admins.password = decryptPasswordfunction(Admins.password);
    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: Admins,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

// Add a new Admin
exports.addAdmin = async (req, reply) => {
  try {
    const Check_Admins = await Admin.findOne({
      email: String(req.body.email).toLowerCase(),
    });

    if (Check_Admins) {
      const response = {
        status_code: 400,
        status: false,
        message: "البريد الالكتروني موجود مسبقا",
        items: null,
      };
      reply.code(200).send(response);
    }

    let Admins = new Admin({
      full_name: req.body.full_name,
      email: String(req.body.email).toLowerCase(),
      password: encryptPassword(req.body.password),
      phone_number: req.body.phone_number,
      roles: req.body.roles,
      token: jwt.sign(
        { _id: req.body.id, userType: USER_TYPE.ADMIN },
        config.get("jwtPrivateKey"),
        {
          expiresIn: "30d",
        }
      ),
    });
    var _return = handleError(Admins.validateSync());
    if (_return.length > 0) {
      reply.code(200).send({
        status_code: 400,
        status: false,
        message: _return[0],
        items: _return,
      });
      return;
    }
    let rs = await Admins.save();
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

// delete admin
exports.deleteAdmin = async (req, reply) => {
  const Admins = await Admin.findByIdAndRemove(req.params.id);
  const response = {
    status_code: 200,
    status: true,
    message: "تمت العملية بنجاح",
    items: [],
  };
  reply.code(200).send(response);
};

// Update an existing Admin
exports.updateAdmin = async (req, reply) => {
  try {
    const Admins = await Admin.findByIdAndUpdate(
      req.params.id,
      {
        full_name: req.body.full_name,
        email: String(req.body.email).toLowerCase(),
        password: encryptPassword(req.body.password),
        phone_number: req.body.phone_number,
        roles: req.body.roles,
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
      items: Admins,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

// Update an existing Admin
exports.updateMyProfile = async (req, reply) => {
  try {
    const Admins = await Admin.findByIdAndUpdate(
      req.params.id,
      {
        full_name: req.body.full_name,
        email: String(req.body.email).toLowerCase(),
        password: encryptPassword(req.body.password),
        phone_number: req.body.phone_number,
      },
      { new: true }
    );

    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: Admins,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.resetAdmin = async (req, reply) => {
  const language = req.headers["accept-language"];
  try {
    const _password = makeid(6)
    var msg = `تم اعادة ضبط كلمة المرور الخاصة بكم وهي: ${_password}`;
    const pass = encryptPassword(_password);
    const Admins = await Admin.findOne({
      $and: [
        { phone_number: String(req.body.email).toLowerCase() }
      ],
    });

    const _providers = await Supplier.findOne({
      $and: [
        { phone_number: String(req.body.email).toLowerCase() },
        { isDeleted:false }
      ],
    });

    const _supervisor = await Supervisor.findOne({
      $and: [
        { phone_number: String(req.body.email).toLowerCase() },
        { isDeleted:false }
      ],
    });

    if (Admins) {
      const ـuser = await Admin.findByIdAndUpdate(
        Admins._id,
        {
          password: pass,
        },
        { new: true }
      );

      sendSMS(req.body.email, "", "", msg)
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
      return;
    } else if (_providers) {
      if (_providers.isBlock == true) {
        reply
          .code(200)
          .send(
            errorAPI(
              language,
              400,
              MESSAGE_STRING_ARABIC.USER_BLOCK,
              MESSAGE_STRING_ENGLISH.USER_BLOCK
            )
          );
        return;
      } else {
        const ـuser = await Supplier.findByIdAndUpdate(
          _providers._id,
          {
            password: pass,
          },
          { new: true }
        );
        sendSMS(req.body.email, "", "", msg)
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
        return;
      }
    } else if (_supervisor) {
      if (_supervisor.isBlock == true) {
        reply
          .code(200)
          .send(
            errorAPI(
              language,
              400,
              MESSAGE_STRING_ARABIC.USER_BLOCK,
              MESSAGE_STRING_ENGLISH.USER_BLOCK
            )
          );
        return;
      } else {
        const ـuser = await Supervisor.findByIdAndUpdate(
          _supervisor._id,
          {
            password: pass,
          },
          { new: true }
        );
        sendSMS(req.body.email, "", "", msg)
        reply
          .code(200)
          .send(
            success(
              language,
              200,
              MESSAGE_STRING_ARABIC.SUCCESS,
              MESSAGE_STRING_ENGLISH.SUCCESS,
              { }
            )
          );
        return;
      }
    }  
    else {
      reply
        .code(200)
        .send(
          errorAPI(
            language,
            400,
            MESSAGE_STRING_ARABIC.USER_PHONE_ERROR,
            MESSAGE_STRING_ENGLISH.USER_PHONE_ERROR
          )
        );
      return;
    }
  } catch (err) {
    throw boom.boomify(err);
  }
};

//login
exports.login = async (req, reply) => {
  const language = "ar";
  try {
    const pass = encryptPassword(req.body.password);
    const Admins = await Admin.findOne({
      $and: [
        { email: String(req.body.email).toLowerCase() },
        { password: pass },
      ],
    });

    const _providers = await Supplier.findOne({
      $and: [
        { email: String(req.body.email).toLowerCase() },
        { password: pass },
        {isDeleted:false}
      ],
    });

    const _supervisor = await Supervisor.findOne({
      $and: [
        { email: String(req.body.email).toLowerCase() },
        { password: pass },
        {isDeleted:false}
      ],
    });

    if (Admins) {
      if (Admins.isBlock == true) {
        reply
          .code(200)
          .send(
            errorAPI(
              language,
              400,
              MESSAGE_STRING_ARABIC.USER_BLOCK,
              MESSAGE_STRING_ENGLISH.USER_BLOCK
            )
          );
        return;
      } 
      const ـuser = await Admin.findByIdAndUpdate(
        Admins._id,
        {
          token: jwt.sign(
            { _id: Admins._id, userType: ACTORS.ADMIN },
            config.get("jwtPrivateKey"),
            {
              expiresIn: "30d",
            }
          ),
        },
        { new: true }
      );
      let newUser = ـuser.toObject();
      newUser.expire = moment(new Date()).add(120, "days").toDate();
      newUser.type = ACTORS.ADMIN;
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
    } else if (_providers) {
      if (_providers.isBlock == true) {
        reply
          .code(200)
          .send(
            errorAPI(
              language,
              400,
              MESSAGE_STRING_ARABIC.USER_BLOCK,
              MESSAGE_STRING_ENGLISH.USER_BLOCK
            )
          );
        return;

        return;
      } else {
        const ـuser = await Supplier.findByIdAndUpdate(
          _providers._id,
          {
            token: jwt.sign(
              { _id: _providers._id, userType: ACTORS.STORE },
              config.get("jwtPrivateKey"),
              {
                expiresIn: "30d",
              }
            ),
          },
          { new: true }
        );

        let newUser = ـuser.toObject();
        newUser.expire = moment(new Date()).add(120, "days").toDate();
        newUser.type = ACTORS.STORE;
        newUser.full_name = ـuser.name
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
    } else if (_supervisor) {
      if (_supervisor.isBlock == true) {
        reply
          .code(200)
          .send(
            errorAPI(
              language,
              400,
              MESSAGE_STRING_ARABIC.USER_BLOCK,
              MESSAGE_STRING_ENGLISH.USER_BLOCK
            )
          );
        return;

        return;
      } else {
        const ـuser = await Supervisor.findByIdAndUpdate(
          _supervisor._id,
          {
            token: jwt.sign(
              { _id: _supervisor._id, userType: ACTORS.SUPERVISOR },
              config.get("jwtPrivateKey"),
              {
                expiresIn: "30d",
              }
            ),
          },
          { new: true }
        );

        let newUser = ـuser.toObject();
        newUser.expire = moment(new Date()).add(120, "days").toDate();
        newUser.type = ACTORS.SUPERVISOR;
        newUser.full_name = ـuser.name

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
    }  
    else {
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
    throw boom.boomify(err);
  }
};

// refresh token
exports.refreshToken = async (req, reply) => {
  try {
    const user = await Admin.findByIdAndUpdate(
      req.body._id,
      {
        fcmToken: req.body.fcmToken,
      },
      { new: true }
    );

    if (!user) {
      const response = {
        status_code: 404,
        status: false,
        message: "حدث خطأ الرجاء المحاولة مرة اخرى",
        items: [],
      };
      reply.code(200).send(response);
    } else {
      const response = {
        status_code: 200,
        status: true,
        message: "",
        items: user,
      };
      reply.code(200).send(response);
    }
  } catch (err) {
    throw boom.boomify(err);
  }
};

//logout
exports.logout = async (req, reply) => {
  try {
    const User_id = req.user._id;
    const user = await Users.findByIdAndUpdate(
      User_id,
      {
        fcmToken: "",
        token: "",
      },
      { new: true }
    );

    if (!user) {
      const response = {
        status_code: 404,
        status: false,
        message: "حدث خطأ الرجاء المحاولة مرة اخرى",
        items: [],
      };
      reply.code(200).send(response);
    } else {
      const response = {
        status_code: 200,
        status: true,
        message: "تم تسجيل الخروج بنجاح",
        items: user,
      };
      reply.code(200).send(response);
    }
  } catch (err) {
    throw boom.boomify(err);
  }
};

//change password
exports.changePassword = async (req, reply) => {
  try {
    const User_id = req.body._id;
    const pass = encryptPassword(req.body.pass);
    const old_password = encryptPassword(req.body.old_password);
    const Users = await Admin.findById(User_id);
    if (Users.password != old_password) {
      const response = {
        status_code: 404,
        status: false,
        message: "كلمة المرور القديمة غير صحيحية",
        items: [],
      };
      reply.code(200).send(response);
    } else {
      if (Users) {
        const update = await Admin.findByIdAndUpdate(
          User_id,
          { password: pass },
          { new: true }
        );
        const response = {
          status_code: 200,
          status: true,
          message: "تم تعديل كلمة المرور بنجاح بنجاح",
          items: update,
        };
        reply.code(200).send(response);
      } else {
        const response = {
          status_code: 404,
          status: false,
          message: "المستخدم غير موجود",
          items: [],
        };
        reply.code(200).send(response);
      }
    }
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.blockAdmin = async (req, reply) => {
  try {
    const user = await Admin.findByIdAndUpdate(
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
