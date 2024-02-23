const boom = require("boom");
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

// Get Data Models
const { Notifications, Messages } = require("../models/Notifications");
const { getCurrentDateTime } = require("../models/Constant");
const { Users } = require("../models/User");
const { Supplier } = require("../models/Product");
const { employee } = require("../models/Employee");
const { success, errorAPI } = require("../utils/responseApi");
const {
  MESSAGE_STRING_ENGLISH,
  MESSAGE_STRING_ARABIC,
  LANGUAGE_ENUM,
  USER_TYPE,
  VALIDATION_MESSAGE_ARABIC,
  VALIDATION_MESSAGE_ENGLISH,
  NOTIFICATION_TYPE,
  ORDER_STATUS,
} = require("../utils/constants");

const {
  CreateNotificationMultiple,
  CreateGeneralNotification,
  handleError,
  sendWhatsApp,
} = require("../utils/utils");

// Get all notfications
exports.getNotfications = async (req, reply) => {
  const language = req.headers["accept-language"];
  try {
    const user_id = req.user._id;
    const _Notification = await Notifications.find({
      $and: [{ user_id: user_id }, { isRead: false }],
    })
      .sort({ dt_date: -1 })
      .limit(50);
    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          _Notification
        )
      );
  } catch (err) {
    reply.code(200).send(errorAPI(language, 400, err.message, err.message));
    return;
  }
};

exports.getNotificationDetails = async (req, reply) => {
  try {
    const _Notification = await Notifications.findById(req.params.id);
    const providerObj = await providers
      .findById(_Notification.fromId)
      .populate("category_id");
    const categories = await Category.find({
      _id: { $in: _Notification.extra },
    });
    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      _Notification: _Notification,
      providerObj: providerObj,
      categories: categories,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

//read notifications
exports.readNotifications = async (req, reply) => {
  try {
    const _Notification = await Notifications.findByIdAndUpdate(
      req.params.id,
      {
        isRead: true,
      },
      { new: true }
    );

    const response = {
      status_code: 200,
      status: true,
      message: "تم تعديل حالة التنبيه بنجاح",
      items: _Notification,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.deleteNotifications = async (req, reply) => {
  const language = req.headers["accept-language"];
  try {
    var not = await Notifications.findByIdAndRemove(req.params.id);
    if (not) {
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
    } else {
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
    }
  } catch (err) {
    reply.code(200).send(errorAPI(language, 400, err.message, err.message));
    return;
  }
};

///////////Admin///////////
exports.getAdminNotification = async (req, reply) => {
  try {
    const language = "ar";

    var page = parseFloat(req.query.page, 10);
    var limit = parseFloat(req.query.limit, 10);
    var query = {$and:[{fromName: USER_TYPE.PANEL}]};
    
    var query = {};
    if (
      req.body.dt_from &&
      req.body.dt_from != "" &&
      req.body.dt_to &&
      req.body.dt_to != ""
    ) {
      query = {
        dt_date: {
          $gte: new Date(new Date(req.body.dt_from).setHours(0, 0, 0)),
          $lt: new Date(new Date(req.body.dt_to).setHours(23, 59, 59)),
        },
      };
    }
    if (req.user.userType == USER_TYPE.ADMIN)
      query["user_id"] = USER_TYPE.PANEL;
    if (req.user.userType != USER_TYPE.ADMIN) query["user_id"] = req.user._id;
    const total = await Notifications.find(query).countDocuments();
    const _Notification = await Notifications.find(query)
      .sort({ dt_date: -1 })
      .skip(page * limit)
      .limit(limit);

    reply.code(200).send(
      success(
        language,
        200,
        MESSAGE_STRING_ARABIC.SUCCESS,
        MESSAGE_STRING_ENGLISH.SUCCESS,
        _Notification,
        {
          size: _Notification.length,
          totalElements: total,
          totalPages: Math.floor(total / limit),
          pageNumber: page,
        }
      )
    );
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getTop10AdminNotification = async (req, reply) => {
  try {
    const language = "ar";
    query = {};
    if (req.user.userType == USER_TYPE.ADMIN)
      query["user_id"] = USER_TYPE.PANEL;
    if (req.user.userType != USER_TYPE.ADMIN) query["user_id"] = req.user._id;
    const _Notification = await Notifications.find(query)
      .sort({ _id: -1 })
      .limit(5);

    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          _Notification
        )
      );
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.addMassNotification = async (req, reply) => {
  try {
    var arr = [];
    if (String(req.body.type) == "1") {
      arr = [];
      const object = await Users.find({$and: [{ isBlock: false }]}).sort({createAt:-1});
      object.forEach((x) => {arr.push(x.fcmToken)});

      for await (const doc of object) {
        let _Notification = new Notifications({
          fromId: USER_TYPE.PANEL,
          user_id: doc._id,
          title: req.body.title,
          msg: req.body.msg,
          dt_date: getCurrentDateTime(),
          type: NOTIFICATION_TYPE.GENERAL,
          body_parms: "",
          isRead: false,
          fromName: USER_TYPE.PANEL,
          toName: doc.full_name,
        });
        _Notification.save();
      }

      // for await (const item of object){
      //   await sendWhatsApp(item.phone_number,"","",req.body.msg)
      // }

      CreateNotificationMultiple(arr, req.body.title, req.body.msg, "");
    }

    if (String(req.body.type) == "2") {
      arr = [];
      const object = await Supplier.find({
        $and: [{ isBlock: false }, { isDeleted: false }],
      });
      for await (const doc of object) {
        let _Notification = new Notifications({
          fromId: USER_TYPE.PANEL,
          user_id: doc._id,
          title: req.body.title,
          msg: req.body.msg,
          dt_date: getCurrentDateTime(),
          type: 3,
          body_parms: "",
          isRead: false,
          fromName: USER_TYPE.PANEL,
          toName: doc.name,
        });
        _Notification.save();
      }
    }

    if (String(req.body.type) == "3") {
      arr = [];
      const object = await employee.find({
        $and: [
          { isBlock: false },
          { isDeleted: false },
        ],
      });
      for await (const doc of object) {
        let _Notification = new Notifications({
          fromId: USER_TYPE.PANEL,
          user_id: doc._id,
          title: req.body.title,
          msg: req.body.msg,
          dt_date: getCurrentDateTime(),
          type: 3,
          body_parms: "",
          isRead: false,
          fromName: USER_TYPE.PANEL,
          toName: doc.full_name,
        });
        _Notification.save();
      }
      object.forEach((x) => {
        arr.push(x.fcmToken);
      });

      CreateNotificationMultiple(arr, req.body.title, req.body.msg, "");
    }

    const response = {
      items: null,
      status: true,
      status_code: 200,
      message: "تم ارسال التنبيه بنجاح",
    };

    reply.send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.addSingleNotification = async (req, reply) => {
  try {
    var doc = {};
    if (req.body.type == 1) {
      doc = await Users.findById(req.params.id);
    } else if (req.body.type == 2) {
      doc = await Supplier.findById(req.params.id);
    } else if (req.body.type == 3) {
      doc = await employee.findById(req.params.id);
    }

    CreateGeneralNotification(
      doc.fcmToken,
      req.body.title,
      req.body.msg,
      NOTIFICATION_TYPE.GENERAL,
      "",
      "الادارة",
      doc._id,
      "الادارة",
      doc.full_name ? doc.full_name : ""
    );
    // await sendWhatsApp(doc.phone_number,"","",req.body.msg)

    const response = {
      items: null,
      status: true,
      status_code: 200,
      message: "تم ارسال التنبيه بنجاح",
    };

    reply.send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};
