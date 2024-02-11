const boom = require("boom");
const util = require("util");
const fs = require("fs");
const cloudinary = require("cloudinary");
const moment = require("moment");
const lodash = require("lodash");
const { uploadImages } = require("../utils/utils");

// Get Data Models
const {
  update,
  ContactOption,
  SocialOption,
  StaticPage,
  city,
  place,
  setting,
  delivery_time,
  complains,
  welcome,
  ComplainsType,
  walletsettings,
  country,
  type,
  languages,
  times,
  getCurrentDateTime,
  currentDate,
} = require("../models/Constant");
const { Users } = require("../models/User");
const { employee } = require("../models/Employee");
const { Place_Delivery, Supplier, Category, SubCategory } = require("../models/Product");
const { mail_general } = require("../utils/utils");

const { success, errorAPI } = require("../utils/responseApi");
const {
  MESSAGE_STRING_ENGLISH,
  MESSAGE_STRING_ARABIC,
  LANGUAGE_ENUM,
  USER_TYPE,
  VALIDATION_MESSAGE_ARABIC,
  VALIDATION_MESSAGE_ENGLISH,
  CONTROLLER_ENUM,
} = require("../utils/constants");

const { emailRegex, handleError } = require("../utils/utils");
const { Adv } = require("../models/adv");

exports.getHomeRequest = async (req, reply) => {
  try {
    const language = req.headers["accept-language"];
    const cats = await Category.find({isDeleted: false}).sort({ sort: 1 });
    var arr = [];
    for await(const element of cats){
      var newObject = element.toObject();
      var subs = []
      var _subs = await SubCategory.find({$and:[{isDeleted: false},{category_id:newObject._id }]}).sort({ _id: -1 });
      for await(const i of _subs){
        var _newObject = i.toObject();
        var obj = {
          _id: _newObject._id,
          price: _newObject.price,
          title: _newObject[`${language}Name`],
          description: _newObject[`${language}Description`],
          image: _newObject.image,
        };
        subs.push(obj)
      }
      var obj = {
        _id: newObject._id,
        title: newObject[`${language}Name`],
        description: newObject[`${language}Description`],
        image: newObject.image,
        sub:subs
      };
      arr.push(obj);
    }
    var arr2 = [];
    const slider = await Adv.find({}).sort({ _id: -1 });
    for await(const element of slider){
      var newObject = element.toObject();
      var obj = {
        _id: newObject._id,
        title: newObject[`${language}Title`],
        description: newObject[`${language}Description`],
        image:newObject.image
      };
      arr2.push(obj);
    }

    var res_obj = {
      category: arr,
      slider: arr2
    }
    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          res_obj
        )
      );

    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getAllCategoryAndSubCategory = async (req, reply) => {
  try {
    const language = req.headers["accept-language"];
    var query1 = {}
 

    const cats = await Category.find({isDeleted: false}).sort({ sort: 1 });
    var arr = [];
    for await(const element of cats){
      var newObject = element.toObject();
      var subs = []
      if(req.query.q && req.query.q != ""){
        query1 = {
          $and:[
            {isDeleted: false},
            {category_id: newObject._id },
            {$or:[
              {arName: { $regex: new RegExp(req.query.q, "i") }},
              {enName: { $regex: new RegExp(req.query.q, "i") }},
              {arDescription: { $regex: new RegExp(req.query.q, "i") }},
              {enDescription: { $regex: new RegExp(req.query.q, "i") }},
            ]}
          ]
        }
      }else{
        query1 = {
          $and:[{isDeleted: false},{category_id:newObject._id }]
        }
      }
      var _subs = await SubCategory.find(query1).sort({ _id: -1 });
      for await(const i of _subs){
        var _newObject = i.toObject();
        var obj = {
          _id: _newObject._id,
          price: _newObject.price,
          image: _newObject.image,
          title: _newObject[`${language}Name`],
          description: _newObject[`${language}Description`],
        };
        subs.push(obj)
      }
      var obj = {
        _id: newObject._id,
        title: newObject[`${language}Name`],
        description: newObject[`${language}Description`],
        image: newObject.image,
        sub:subs
      };
      arr.push(obj);
    }

    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          arr
        )
      );

    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getUpdates = async (req, reply) => {
  try {
    const updates = await update.find().sort({ _id: -1 });
    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: updates,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.addReplyComplains = async (req, reply) => {
  try {
    let language = "ar";
    const complaintsData = await complains.findById(req.body._id);
    let data = {
      full_name: complaintsData.full_name,
      msg: req.body.message,
    };
    let subject = "رد من ادارة منصة جاز توك";
    mail_general(req, req.body.email, subject, req.body.message, data);
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
    throw boom.boomify(err);
  }
};

exports.getComplains = async (req, reply) => {
  try {
    var page = parseFloat(req.query.page, 10);
    var limit = parseFloat(req.query.limit, 10);

    const Complains = await complains
      .find()
      .sort({ _id: -1 })
      .skip(page * limit)
      .limit(limit);

    const total = await complains.find().countDocuments();
    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: Complains,
      pagenation: {
        size: Complains.length,
        totalElements: total,
        totalPages: Math.floor(total / limit),
        pageNumber: page,
      },
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.deleteComplains = async (req, reply) => {
  try {
    await complains.findByIdAndRemove(req.params.id);
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

exports.getContactOption = async (req, reply) => {
  const language = req.headers["accept-language"];
  try {
    const ContactOptions = await ContactOption.find();
    var arr = [];
    ContactOptions.forEach((element) => {
      var obj = {
        _id: element._id,
        Name: element[`${language}Name`],
        Data: element.data,
      };
      arr.push(obj);
    });
    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          arr
        )
      );

    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getContactOptionAdmin = async (req, reply) => {
  try {
    let language = "ar";
    const ContactOptions = await ContactOption.find().sort({ _id: -1 });

    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          ContactOptions
        )
      );
    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getSocialOption = async (req, reply) => {
  try {
    const language = req.headers["accept-language"];
    const SocialOptions = await SocialOption.find().sort({ _id: -1 });

    var arr = [];
    SocialOptions.forEach((element) => {
      var newObject = element.toObject();
      var obj = {
        _id: newObject._id,
        Title: newObject[`${language}Name`],
        data: newObject.data,
      };
      arr.push(obj);
    });

    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          arr
        )
      );

    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getStaticPage = async (req, reply) => {
  try {
    const language = req.headers["accept-language"];
    const staticpages = await StaticPage.find().sort({ _id: -1 });

    var arr = [];
    staticpages.forEach((element) => {
      var newObject = element.toObject();
      var obj = {
        _id: newObject._id,
        Type: newObject.Type,
        Title: newObject[`${language}Title`],
        Content: newObject[`${language}Content`],
        Type: newObject.type,
      };
      arr.push(obj);
    });

    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          arr
        )
      );

    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getCountry = async (req, reply) => {
  try {
    var arr = [];
    const language = req.headers["accept-language"];
    const _country = await country.find({ isDeleted: false });

    for (const item of _country) {
      var newCountry = item.toObject();
      var obj = {
        _id: newCountry._id,
        name: newCountry[`${language}Name`],
        flag: newCountry.flag ? newCountry.flag : "",
        code: newCountry.code ? newCountry.code : "",
      };
      arr.push(obj);
    }

    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          arr
        )
      );
    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getCountryAdmin = async (req, reply) => {
  try {
    var arr = [];
    const language = req.headers["accept-language"];
    const _country = await country.find();

    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          _country
        )
      );
    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getCity = async (req, reply) => {
  try {
    var arr = [];
    const language = req.headers["accept-language"];
    const cities = await city
      .find({ $and: [{ country_id: req.params.id }, { isDeleted: false }] })
      .populate("country_id");

    for (const item of cities) {
      var newCountry = item.toObject();
      var obj = {
        _id: newCountry._id,
        name: newCountry[`${language}Name`],
      };
      var country = {
        _id: newCountry.country_id._id,
        name: newCountry.country_id[`${language}Name`],
      };
      delete newCountry.arName;
      delete newCountry.enName;
      newCountry.name = newCountry[`${language}Name`];
      newCountry.country_id = country;

      arr.push(newCountry);
    }

    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          arr
        )
      );
    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getPlaces = async (req, reply) => {
  try {
    var arr = [];
    const language = req.headers["accept-language"];
    const cities = await place.find({ isDeleted: false })
    .populate("city_id")
    .sort({ _id: -1 });

    for (const item of cities) {
      var newCountry = item.toObject();
      newCountry.name = newCountry[`${language}Name`];
      var city = {
        _id: newCountry.city_id._id,
        name: newCountry.city_id[`${language}Name`],
      };
      newCountry.city_id = city;
      delete newCountry.arName;
      delete newCountry.enName;

      arr.push(newCountry);
    }

    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          arr
        )
      );
    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getPlacesAdmin = async (req, reply) => {
  try {
    var page = parseFloat(req.query.page, 10);
    var limit = parseFloat(req.query.limit, 10);

    var arr = [];
    const language = "ar";
    const total = await place
      .find({ $and: [{ isDeleted: false }, { city_id: req.params.id }] })
      .countDocuments();
    const cities = await place
      .find({ $and: [{ isDeleted: false }, { city_id: req.params.id }] })
      .populate("city_id")
      .sort({ _id: -1 })
      .skip(page * limit)
      .limit(limit)

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

exports.getAllPlacesAdmin = async (req, reply) => {
  try {
    var language = "ar";
    const cities = await place
      .find({ $and: [{ isDeleted: false }, { city_id: req.params.id }] })
      .populate("city_id")
      .sort({ _id: -1 });

    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          cities
        )
      );
    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getAllPlacesSupplierAdmin = async (req, reply) => {
  try {
    var language = "ar";
    var cities = []
    if(req.params.id != ""){
      cities = await Place_Delivery
        .find({ $and: [{ isDeleted: false }, { supplier_id: req.params.id }] })
        .populate("city_id")
        .populate("place_id")
        .populate("supplier_id")
        .sort({ _id: -1 });
    }
    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          cities
        )
      );
    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getSinglePlace = async (req, reply) => {
  try {
    const language = "ar";
    const _place = await place.findById(req.params.id).populate("city_id");
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

exports.getCityAdmins = async (req, reply) => {
  try {
    const language = "ar";
    var page = parseFloat(req.query.page, 10);
    var limit = parseFloat(req.query.limit, 10);

    const cities = await city
      .find({ $and: [{ isDeleted: false }, { country_id: req.params.id }] })
      .populate("country_id")
      .skip(page * limit)
      .limit(limit)
      .sort({ _id: -1 });

    const total = await city
      .find({ $and: [{ isDeleted: false }, { country_id: req.params.id }] })
      .countDocuments();

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

exports.getAlCityAdmins = async (req, reply) => {
  try {
    const language = "ar";

    const cities = await city
      .find({ isDeleted: false })
      .populate("country_id")
      .sort({ _id: -1 });

    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          cities
        )
      );
    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getSingleCity = async (req, reply) => {
  try {
    const cities = await city.findById(req.params.id).sort({ _id: -1 });
    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: cities,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getSingleCountry = async (req, reply) => {
  try {
    const _country = await country.findById(req.params.id).sort({ _id: -1 });
    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: _country,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getSettings = async (req, reply) => {
  try {
    let language = "ar";
    const settings = await setting.find().sort({ _id: -1 });
    const _country = await country.find().sort({ _id: -1 });
    var arr = []
    _country.forEach(element => {
      var obj = {
        _id : element._id,
        title: element[`${language}Name`],
      }
      arr.push(obj)
    });
    var obj = {
      settings:settings,
      coutnry: arr
    }
    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: obj,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getWalletSettings = async (req, reply) => {
  try {
    const settings = await walletsettings.find().sort({ _id: -1 });
    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: settings,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getMySettings = async (req, reply) => {
  try {
    const settings = await ProviderSetting.find({
      provider_id: req.params.id,
    }).sort({ _id: -1 });
    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: settings,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getSingleSettings = async (req, reply) => {
  try {
    const settings = await setting.findById(req.params.id);
    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: settings,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getWalletSingleSettings = async (req, reply) => {
  try {
    const settings = await walletsettings.findById(req.params.id);
    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: settings,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getSingleMySettings = async (req, reply) => {
  try {
    const settings = await ProviderSetting.findById(req.params.id);
    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: settings,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getdelivery_time = async (req, reply) => {
  try {
    const settings = await delivery_time
      .find({ isDeleted: false })
      .sort({ isSort: 1 });
    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: settings,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

// cPanel
exports.adddelivery_time = async (req, reply) => {
  try {
    let _setting = new delivery_time({
      name: req.body.name,
      supplier_id: req.body.supplier_id,
    });
    var _return = handleError(_setting.validateSync());
    if (_return.length > 0) {
      reply.code(200).send({
        status_code: 400,
        status: false,
        message: _return[0],
        items: _return,
      });
      return;
    }

    let rs = await _setting.save();
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

exports.updatedelivery_time = async (req, reply) => {
  try {
    const _city = await delivery_time.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
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
      items: _city,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.deletedelivery_time = async (req, reply) => {
  try {
    const _city = await delivery_time.findByIdAndRemove(req.params.id);

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

exports.addSetting = async (req, reply) => {
  try {
    let _setting = new setting({
      name: req.body.name,
      value: req.body.value,
      max: req.body.max,
      min: req.body.min,
      supplier_id: req.body.supplier_id,
    });
    var _return = handleError(_setting.validateSync());
    if (_return.length > 0) {
      reply.code(200).send({
        status_code: 400,
        status: false,
        message: _return[0],
        items: _return,
      });
      return;
    }
    let rs = await _setting.save();
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

exports.addWalletSetting = async (req, reply) => {
  try {
    let _setting = new walletsettings({
      type: req.body.type,
      value: req.body.value,
      max: req.body.max,
      min: req.body.min,
      supplier_id: req.body.supplier_id,
    });

    var _return = handleError(_setting.validateSync());
    if (_return.length > 0) {
      reply.code(200).send({
        status_code: 400,
        status: false,
        message: _return[0],
        items: _return,
      });
      return;
    }

    let rs = await _setting.save();

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

exports.addMySetting = async (req, reply) => {
  try {
    let _setting = new ProviderSetting({
      name: req.body.name,
      value: req.body.value,
      max: req.body.max,
      min: req.body.min,
      provider_id: req.body.provider_id,
    });
    var _return = handleError(_setting.validateSync());
    if (_return.length > 0) {
      reply.code(200).send({
        status_code: 400,
        status: false,
        message: _return[0],
        items: _return,
      });
      return;
    }
    let rs = await _setting.save();
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

exports.updateSetting = async (req, reply) => {
  try {
    const _setting = await setting.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        value: req.body.value,
        max: req.body.max,
        min: req.body.min,
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
      items: _setting,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.updateWalletSetting = async (req, reply) => {
  try {
    const _setting = await walletsettings.findByIdAndUpdate(
      req.params.id,
      {
        type: req.body.type,
        value: req.body.value,
        max: req.body.max,
        min: req.body.min,
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
      items: _setting,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.updateMySetting = async (req, reply) => {
  try {
    const _setting = await ProviderSetting.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        value: req.body.value,
        max: req.body.max,
        min: req.body.min,
        provider_id: req.body.provider_id,
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
      items: _setting,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.deleteSetting = async (req, reply) => {
  try {
    await setting.findByIdAndRemove(req.params.id);

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

exports.deleteWalletSetting = async (req, reply) => {
  try {
    await walletsettings.findByIdAndRemove(req.params.id);

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

exports.deleteMySetting = async (req, reply) => {
  try {
    await ProviderSetting.findByIdAndRemove(req.params.id);

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

exports.addCountry = async (req, reply) => {
  try {
    let _country = new country({
      arName: req.body.arName,
      enName: req.body.enName,
      isDeleted: false,
    });
    var _return = handleError(_country.validateSync());
    if (_return.length > 0) {
      reply.code(200).send({
        status_code: 400,
        status: false,
        message: _return[0],
        items: _return,
      });
      return;
    }
    let rs = await _country.save();
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

exports.addCity = async (req, reply) => {
  try {
    let _city = new city({
      arName: req.body.arName,
      enName: req.body.enName,
      country_id: req.body.country_id,
      isDeleted: false,
    });
    var _return = handleError(_city.validateSync());
    if (_return.length > 0) {
      reply.code(200).send({
        status_code: 400,
        status: false,
        message: _return[0],
        items: _return,
      });
      return;
    }
    let rs = await _city.save();
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

exports.addPlace = async (req, reply) => {
  try {
    // let cord = req.body.coordinates;
    // let cord = [
    //   [40.654826, 29.219786],
    //   [40.608884, 29.223213],
    //   [40.612786, 29.352281],
    //   [40.672154, 29.336861],
    //   [40.654826, 29.219786],
    // ];

    let cord = req.body.loc;
    var cordinations = [];
    cord.forEach((element, index) => {
      let obj = [element.lng, element.lat];
      cordinations.push(obj);
    });

    let _place = new place({
      arName: req.body.arName,
      enName: req.body.enName,
      city_id: req.body.city_id,
      loc: {
        type: "Polygon",
        coordinates: [cordinations],
      },
      cord: req.body.loc,
      isDeleted: false,
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

exports.updatePlace = async (req, reply) => {
  try {
    let cord = req.body.cord;
    var cordinations = [];
    cord.forEach((element, index) => {
      let obj = [element.lng, element.lat];
      cordinations.push(obj);
    });

    const _place = await place.findByIdAndUpdate(
      req.params.id,
      {
        arName: req.body.arName,
        enName: req.body.enName,
        city_id: req.body.city_id,
        loc: {
          type: "Polygon",
          coordinates: [cordinations],
        },
        cord: cord,
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
      items: _place,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.updateCountry = async (req, reply) => {
  try {
    const _country = await country.findByIdAndUpdate(
      req.params.id,
      {
        arName: req.body.arName,
        enName: req.body.enName,
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
      items: country,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.updateCity = async (req, reply) => {
  try {
    const _city = await city.findByIdAndUpdate(
      req.params.id,
      {
        arName: req.body.arName,
        enName: req.body.enName,
        country_id: req.body.country_id,
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
      items: _city,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.deleteCountry = async (req, reply) => {
  try {
    const previousCountry = await country.findById(req.params.id);
    const _country = await country.findByIdAndUpdate(
      req.params.id,
      { isDeleted: !previousCountry.isDeleted },
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
      items: [],
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.deleteCity = async (req, reply) => {
  try {
    const _city = await city.findByIdAndUpdate(req.params.id,
      { isDeleted: true },
      {new: true}
    );

    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: _city,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.deletePlace = async (req, reply) => {
  try {
    const _place = await place.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
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
      items: [],
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.addContract = async (req, reply) => {
  try {
    let _city = new contract({
      name: req.body.name,
      numberOfMonths: req.body.numberOfMonths,
      amount: req.body.amount,
    });
    var _return = handleError(_city.validateSync());
    if (_return.length > 0) {
      reply.code(200).send({
        status_code: 400,
        status: false,
        message: _return[0],
        items: _return,
      });
      return;
    }
    let rs = await _city.save();
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

exports.updateContract = async (req, reply) => {
  try {
    const _city = await contract.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        numberOfMonths: req.body.numberOfMonths,
        amount: req.body.amount,
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
      items: _city,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.deleteContract = async (req, reply) => {
  try {
    const _city = await contract.findByIdAndRemove(req.params.id);

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

exports.addSocial = async (req, reply) => {
  try {
    let SocialOptions = new SocialOption({
      name: req.body.name,
      data: req.body.data,
    });

    var _return = handleError(SocialOptions.validateSync());
    if (_return.length > 0) {
      reply.code(200).send({
        status_code: 400,
        status: false,
        message: _return[0],
        items: _return,
      });
      return;
    }
    let rs = await SocialOptions.save();
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

exports.updateSocial = async (req, reply) => {
  try {
    const SocialOptions = await SocialOption.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        data: req.body.data,
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
      items: SocialOptions,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.deleteSocial = async (req, reply) => {
  try {
    const SocialOptions = await SocialOption.findByIdAndRemove(req.params.id);

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

exports.getSingleStatic = async (req, reply) => {
  try {
    const language = req.headers["accept-language"];
    const StaticPages = await StaticPage.findById(req.params.id);

    var newObject = {
      _id: StaticPages._id,
      Type: StaticPages.Type,
      Title: StaticPages[`${language}Title`],
      Content: StaticPages[`${language}Content`],
    };

    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          newObject
        )
      );
    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.addStatic = async (req, reply) => {
  try {
    let staticpages = new StaticPage({
      Type: req.body.Type,
      arTitle: req.body.arTitle,
      enTitle: req.body.enTitle,
      arContent: req.body.arContent,
      enContent: req.body.enContent,
    });
    var _return = handleError(staticpages.validateSync());
    if (_return.length > 0) {
      reply.code(200).send({
        status_code: 400,
        status: false,
        message: _return[0],
        items: _return,
      });
      return;
    }
    let rs = await staticpages.save();
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

exports.getStaticPages = async (req, reply) => {
  try {
    var language = "ar";
    const staticpages = await StaticPage.find().sort({ _id: -1 });
    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          staticpages
        )
      );
    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getSingleStaticAdmin = async (req, reply) => {
  try {
    const language = "ar";
    const StaticPages = await StaticPage.findById(req.params.id);

    reply.code(200).send(
      success(
        language,
        200,

        MESSAGE_STRING_ARABIC.SUCCESS,
        MESSAGE_STRING_ENGLISH.SUCCESS,
        StaticPages
      )
    );
    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.updateStatic = async (req, reply) => {
  try {
    const staticpages = await StaticPage.findByIdAndUpdate(
      req.params.id,
      {
        Type: req.body.Type,
        arTitle: req.body.arTitle,
        enTitle: req.body.enTitle,
        arContent: req.body.arContent,
        enContent: req.body.enContent,
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
      items: staticpages,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.deleteStatic = async (req, reply) => {
  try {
    const staticpages = await StaticPage.findByIdAndRemove(req.params.id);

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

exports.getSingleContract = async (req, reply) => {
  try {
    const ContactOptions = await ContactOption.findById(req.params.id).sort({
      _id: -1,
    });
    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: ContactOptions,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.addContact = async (req, reply) => {
  try {
    let ContactOptions = new ContactOption({
      arName: req.body.arName,
      enName: req.body.enName,
      data: req.body.data,
    });

    var _return = handleError(ContactOptions.validateSync());
    if (_return.length > 0) {
      reply.code(200).send({
        status_code: 400,
        status: false,
        message: _return[0],
        items: _return,
      });
      return;
    }
    let rs = await ContactOptions.save();
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

exports.updateContact = async (req, reply) => {
  try {
    const ContactOptions = await ContactOption.findByIdAndUpdate(
      req.params.id,
      {
        arName: req.body.arName,
        enName: req.body.enName,
        data: req.body.data,
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
      items: ContactOptions,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.deleteContact = async (req, reply) => {
  try {
    const ContactOptions = await ContactOption.findByIdAndRemove(req.params.id);
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

exports.welcomeList = async (req, reply) => {
  try {
    const language = req.headers["accept-language"];
    var welcomes = await welcome.find({ isDriver: false }).select();

    var arr = [];
    welcomes.forEach((element) => {
      var newObject = element.toObject();
      var obj = {
        _id: newObject._id,
        icon: newObject.icon,
        Title: newObject[`${language}Title`],
        Description: newObject[`${language}Description`],
      };
      arr.push(obj);
    });

    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          arr
        )
      );
    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.welcomeDriver = async (req, reply) => {
  try {
    const language = req.headers["accept-language"];
    var welcomes = await welcome.find({ isDriver: true }).select();

    var arr = [];
    welcomes.forEach((element) => {
      var newObject = element.toObject();
      var obj = {
        _id: newObject._id,
        icon: newObject.icon,
        Title: newObject[`${language}Title`],
        Description: newObject[`${language}Description`],
      };
      arr.push(obj);
    });

    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          arr
        )
      );
    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.packageList = async (req, reply) => {
  try {
    const language = req.headers["accept-language"];
    var welcomes = await package.find().select([`${language}Name`]);

    var arr = [];
    welcomes.forEach((element) => {
      var newObject = element.toObject();
      var obj = {
        _id: newObject._id,
        Name: newObject[`${language}Name`],
        Price: newObject.price,
      };
      arr.push(obj);
    });

    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          arr
        )
      );
    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getSingleWelcome = async (req, reply) => {
  try {
    const welcomes = await welcome.findById(req.params.id).sort({ _id: -1 });
    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: welcomes,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getWelcomeAdmin = async (req, reply) => {
  try {
    const language = "ar";
    const _welcome = await welcome.find().sort({ _id: -1 });
    reply.code(200).send(
      success(
        language,
        200,

        MESSAGE_STRING_ARABIC.SUCCESS,
        MESSAGE_STRING_ENGLISH.SUCCESS,
        _welcome
      )
    );

    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getSingleWelcomeAdmin = async (req, reply) => {
  try {
    const language = "ar";
    const _welcome = await welcome.findById(req.params.id).sort({ _id: -1 });
    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          _welcome
        )
      );

    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getAdvsAdmin = async (req, reply) => {
  try {
    const language = "ar";
    const _Adv = await Adv.find().sort({ _id: -1 });
    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          _Adv
        )
      );

    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getSingleAdvsAdmin = async (req, reply) => {
  try {
    const language = "ar";
    const _Adv = await Adv.findById(req.params.id).sort({ _id: -1 });
    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          _Adv
        )
      );

    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

// Add a new advs
exports.addWelcome = async (req, reply) => {
  try {
    var approve = false;
    if (req.raw.body.by == 1) {
      approve = true;
    }
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

      let Advs = new welcome({
        arTitle: req.raw.body.arTitle,
        enTitle: req.raw.body.enTitle,
        arDescription: req.raw.body.arDescription,
        enDescription: req.raw.body.enDescription,
        isDriver: req.raw.body.isDriver,
        icon: img,
      });
      var _return = handleError(Advs.validateSync());
      if (_return.length > 0) {
        reply.code(200).send({
          status_code: 400,
          status: false,
          message: _return[0],
          items: _return,
        });
        return;
      }
      let rs = await Advs.save();
      const response = {
        status_code: 200,
        status: true,
        message: "تمت العملية بنجاح",
        items: rs,
      };

      reply.send(response);
    }
  } catch (err) {
    throw boom.boomify(err);
  }
};

// Update an existing adv
exports.updateWelcome = async (req, reply) => {
  try {
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

      const Advs = await welcome.findByIdAndUpdate(
        req.params.id,
        {
          arTitle: req.raw.body.arTitle,
          enTitle: req.raw.body.enTitle,
          arDescription: req.raw.body.arDescription,
          enDescription: req.raw.body.enDescription,
          isDriver: req.raw.body.isDriver,
          icon: img,
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
      // await updateCacheWithUpdate('Advs', Advs, req.params.id)

      const response = {
        status_code: 200,
        status: true,
        message: "تمت العملية بنجاح",
        items: Advs,
      };
      reply.code(200).send(response);
    } else {
      const Advs = await welcome.findByIdAndUpdate(
        req.params.id,
        {
          arTitle: req.raw.body.arTitle,
          enTitle: req.raw.body.enTitle,
          arDescription: req.raw.body.arDescription,
          enDescription: req.raw.body.enDescription,
          isDriver: req.raw.body.isDriver,
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
      // await updateCacheWithUpdate('Advs', Advs, req.params.id)

      const response = {
        status_code: 200,
        status: true,
        message: "تمت العملية بنجاح",
        items: Advs,
      };
      reply.code(200).send(response);
    }
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.deleteWelcome = async (req, reply) => {
  try {
    const welcomes = await welcome.findByIdAndRemove(req.params.id);
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

exports.addComplains = async (req, reply) => {
  try {
    const language = req.headers["accept-language"];

    // let user_id = req.user._id;
    // let type = req.user.userType;
    // var newObj = {};
    // if (type == USER_TYPE.USER) {
    //   newObj = await Users.findById(user_id);
    // }

    if (
      !req.body.full_name ||
      !req.body.email ||
      !req.body.phone_number ||
      !req.body.details
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

    if (!emailRegex.test(req.body.email)) {
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

    let _complains = new complains({
      full_name: req.body.full_name,
      email: req.body.email,
      phone_number: req.body.phone_number,
      details: req.body.details,
      dt_date: getCurrentDateTime(),
    });

    let rs = await _complains.save();
    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          rs
        )
      );
    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getComplainsType = async (req, reply) => {
  try {
    const language = req.headers["accept-language"];

    const Complains = await ComplainsType.find().sort({ _id: -1 });
    var arr = [];
    Complains.forEach((element) => {
      var newObject = element.toObject();
      var obj = {
        _id: newObject._id,
        Title: newObject[`${language}Name`],
      };
      arr.push(obj);
    });
    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          arr
        )
      );
    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getTypes = async (req, reply) => {
  try {
    const language = req.headers["accept-language"];

    const _type = await type.find().sort({ _id: -1 });
    var arr = [];
    _type.forEach((element) => {
      var newObject = element.toObject();
      var obj = {
        _id: newObject._id,
        Title: newObject[`${language}Name`],
      };
      arr.push(obj);
    });
    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          arr
        )
      );
    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getLanguages = async (req, reply) => {
  try {
    const language = req.headers["accept-language"];

    const _languages = await languages.find().sort({ _id: -1 });
    var arr = [];
    _languages.forEach((element) => {
      var newObject = element.toObject();
      var obj = {
        _id: newObject._id,
        Title: newObject[`${language}Name`],
      };
      arr.push(obj);
    });
    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          arr
        )
      );
    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.checkCurrentPlace = async (req, reply) => {
  const language = req.headers["accept-language"];
  try {
    //for test 24.693601, 46.66594
    var PoinInPolygon = await place.find({
      $and: [
        {
          loc: {
            $geoIntersects: {
              $geometry: {
                type: "Point",
                coordinates: [Number(req.body.lat), Number(req.body.lng)],
              },
            },
          },
        },
        { isDeleted: false },
      ],
    });

    if (PoinInPolygon.length == 0) {
      reply
        .code(200)
        .send(
          errorAPI(
            language,
            400,
            MESSAGE_STRING_ARABIC.NOT_COVERED,
            MESSAGE_STRING_ENGLISH.NOT_COVERED,
            {}
          )
        );
      return;
      // //get nearest polygons within 10 KM
      // var pl = await place.find({
      //   loc: {
      //     $near: {
      //       $geometry: {
      //         type: "Point",
      //         coordinates: [req.body.lat, req.body.lng],
      //       },
      //       $maxDistance: 200000,
      //     },
      //   },
      // });
      // if (pl.length > 0) {
      //   reply
      //     .code(200)
      //     .send(
      //       success(
      //         language,
      //         MESSAGE_STRING_ARABIC.WARNING,
      //         MESSAGE_STRING_ENGLISH.WARNING,
      //         pl
      //       )
      //     );
      //   return;
      // } else {
      //   reply
      //     .code(400)
      //     .send(
      //       errorAPI(
      //         language,
      //         400,
      //         MESSAGE_STRING_ARABIC.NOT_COVERED,
      //         MESSAGE_STRING_ENGLISH.NOT_COVERED,
      //         []
      //       )
      //     );
      //   return;
      // }
    } else {
      reply
        .code(200)
        .send(
          success(
            language,
            200,
            MESSAGE_STRING_ARABIC.SUCCESS,
            MESSAGE_STRING_ENGLISH.SUCCESS,
            PoinInPolygon
          )
        );
      return;
    }
  } catch (err) {
    reply.code(200).send(errorAPI(language, 400, err.message, err.message));
    return;
  }
};

exports.getDays = async (req, reply) => {
  try {
    const language = req.headers["accept-language"];
    var days = [];

    // var max = null;
    // var _max = null;
    // var days = [];
    // var items = [];
    // const currentHour = moment(new Date()).format("HH:mm");

    // const _times = await times
    //   .find({
    //     $and: [{ supplier_id: req.params.id }, { isDeleted: false }],
    //   })
    //   .sort({ _id: -1 });

    // _times.forEach((element) => {
    //   const from = moment(element.from, ["HH.mm"]).format("HH:mm");
    //   if (from >= currentHour) {
    //     items.push(element);
    //   }
    // });

    // const myTimesArray = lodash
    //   .sortBy(items, (o) => moment(o.from, ["HH.mm"]).format("HH:mm"))
    //   .reverse();

    // if (myTimesArray.length > 0) {
    //   max = myTimesArray[0].from;
    //   _max = moment(max, ["HH.mm"]).format("HH:mm");
    // }

    // if (_max && currentHour <= _max) {
    //   days.push(moment(getCurrentDateTime()).local("sa"));
    // }
    days.push(
      moment()
        .tz("Asia/Riyadh")
        .add("days", 0)
        .format("YYYY-MM-DD")
    );
    days.push(
      moment()
        .tz("Asia/Riyadh")
        .add("days", 1)
        .format("YYYY-MM-DD")
    );
    days.push(
      moment()
        .tz("Asia/Riyadh")
        .add("days", 2)
        .format("YYYY-MM-DD")
    );
    // days.push(
    //   moment()
    //     .tz("Asia/Riyadh")
    //     .add("days", 3)
    //     .format("YYYY-MM-DD")
    // );
    // days.push(
    //   moment()
    //     .tz("Asia/Riyadh")
    //     .add("days", 4)
    //     .format("YYYY-MM-DD")
    // );
    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          days
        )
      );
    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

// exports.getDates = async (req, reply) => {
//   try {
//     const language = req.headers["accept-language"];

//     var max = null;
//     var _max = null;
//     var _min = null;
//     var days = [];
//     var items = [];

//     var toDay = moment(getCurrentDateTime()).local("sa");
//     var currentTime = moment(toDay, ["HH.mm"]).format("HH:mm");
//     console.log(currentTime);
//     const currentHour = moment("01:00", ["HH.mm"]).format("HH:mm");
//     _min = moment("00:00", ["HH.mm"]).format("HH:mm");

//     const _times = await times
//       .find({
//         $and: [{ supplier_id: req.params.id }, { isDeleted: false }],
//       })
//       .sort({ _id: -1 });

//     _times.forEach((element) => {
//       const from = moment(element.from, ["HH.mm"]).format("HH:mm");
//       const to = moment(element.to, ["HH.mm"]).format("HH:mm");
//       if ((from >= currentHour || to > currentHour) && currentHour > _min) {
//         items.push(element);
//       }
//     });

//     const myTimesArray = lodash
//       .sortBy(items, (o) => moment(o.from, ["HH.mm"]).format("HH:mm"))
//       .reverse();

//     if (myTimesArray.length > 0) {
//       max = myTimesArray[0].from;
//       _max = moment(max, ["HH.mm"]).format("HH:mm");
//       days.push(moment(getCurrentDateTime()).local("sa"));
//     }

//     days.push(moment(getCurrentDateTime()).local("sa").add("days", 1));
//     days.push(moment(getCurrentDateTime()).local("sa").add("days", 2));
//     days.push(moment(getCurrentDateTime()).local("sa").add("days", 3));
//     days.push(moment(getCurrentDateTime()).local("sa").add("days", 4));
//     days.push(moment(getCurrentDateTime()).local("sa").add("days", 5));

//     reply
//       .code(200)
//       .send(
//         success(
//           language,
//           200,
//           MESSAGE_STRING_ARABIC.SUCCESS,
//           MESSAGE_STRING_ENGLISH.SUCCESS,
//           days
//         )
//       );
//     return;
//   } catch (err) {
//     throw boom.boomify(err);
//   }
// };

exports.getTimesByDate = async (req, reply) => {
  try {
    const language = req.headers["accept-language"];
    var _min = null;
    var items = [];
    var requestedDate = moment(req.body.date).tz("Asia/Riyadh").startOf("day");;
    var currentDate = moment().tz("Asia/Riyadh").startOf("day");
    
    if (currentDate.isSame(requestedDate)) {
      //today
      var toDay = moment().tz("Asia/Riyadh"); //moment("2021-01-30T21:52:35.993").local("sa"); //moment().local("sa");
      var currentTime = moment(toDay, ["HH.mm"]).format("HH:mm");
      const currentHour = moment(currentTime, ["HH.mm"]).format("HH:mm");
      _min = moment("24:00", ["HH.mm"]).format("HH:mm");
      items = [];
      const _times = await times
        .find({
          $and: [{ supplier_id: req.body.supplier_id }, { isDeleted: false }],
        })
        .sort({ _id: -1 });

      _times.forEach((element) => {
        const from = moment(element.from, ["HH.mm"]).format("HH:mm");
        const to = moment(element.to, ["HH.mm"]).format("HH:mm");
        if ((from >= currentHour || to > currentHour) && currentHour > _min) {
          items.push(element);
        }
      });
    } else {
      //other day
      items = [];
      const _times = await times
        .find({
          $and: [{ supplier_id: req.body.supplier_id }, { isDeleted: false }],
        })
        .sort({ _id: -1 });

      _times.forEach((element) => {
        items.push(element);
      });
    }
    // var toDay = moment(getCurrentDateTime()).local("sa");
    // var currentTime = moment(toDay, ["HH.mm"]).format("HH:mm");
    // const currentHour = moment(currentTime, ["HH.mm"]).format("HH:mm");
    // _min = moment("24:00", ["HH.mm"]).format("HH:mm");

    // const _times = await times
    //   .find({
    //     $and: [{ supplier_id: req.body.supplier_id }, { isDeleted: false }],
    //   })
    //   .sort({ _id: -1 });

    // _times.forEach((element) => {
    //   const from = moment(element.from, ["HH.mm"]).format("HH:mm");
    //   const to = moment(element.to, ["HH.mm"]).format("HH:mm");
    //   if ((from >= currentHour || to > currentHour) && currentHour > _min) {
    //     items.push(element);
    //   }
    // });

    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          items
        )
      );
    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

// Add a new advs
exports.addAdvs = async (req, reply) => {
  try {
    var approve = true;
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

      let Advs = new Adv({
        arTitle: req.raw.body.arTitle,
        enTitle: req.raw.body.enTitle,
        arDescription: req.raw.body.arDescription,
        enDescription: req.raw.body.enDescription,
        product_id: req.raw.body.product_id,
        store_id: req.raw.body.store_id,
        url: req.raw.body.url,
        expiry_date: moment(req.raw.body.expiry_date)
          .utc()
          .tz("Asia/Riyadh")
          .endOf("day"),
        ads_for: req.raw.body.ads_for,
        image: img,
        is_ads_redirect_to_store: true,
        is_ads_have_expiry_date: true,
        isApprove: approve,
        isActive: true,
      });
      var _return = handleError(Advs.validateSync());
      if (_return.length > 0) {
        reply.code(200).send({
          status_code: 400,
          status: false,
          message: _return[0],
          items: _return,
        });
        return;
      }
      let rs = await Advs.save();
      const response = {
        status_code: 200,
        status: true,
        message: "تمت العملية بنجاح",
        items: rs,
      };

      reply.send(response);
    }
  } catch (err) {
    throw boom.boomify(err);
  }
};

// Update an existing adv
exports.updateAdvs = async (req, reply) => {
  try {
    var approve = true;

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

      const Advs = await Adv.findByIdAndUpdate(
        req.params.id,
        {
          arTitle: req.raw.body.arTitle,
          enTitle: req.raw.body.enTitle,
          arDescription: req.raw.body.arDescription,
          enDescription: req.raw.body.enDescription,
          isApprove: approve,
          isActive: true,
          product_id: req.raw.body.product_id,
          store_id: req.raw.body.store_id,
          url: req.raw.body.url,
          expiry_date: moment(req.raw.body.expiry_date)
            .utc()
            .tz("Asia/Riyadh")
            .endOf("day"),
          ads_for: req.raw.body.ads_for,
          image: img,
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
      // await updateCacheWithUpdate('Advs', Advs, req.params.id)

      const response = {
        status_code: 200,
        status: true,
        message: "تمت العملية بنجاح",
        items: Advs,
      };
      reply.code(200).send(response);
    } else {
      const Advs = await Adv.findByIdAndUpdate(
        req.params.id,
        {
          arTitle: req.raw.body.arTitle,
          enTitle: req.raw.body.enTitle,
          arDescription: req.raw.body.arDescription,
          enDescription: req.raw.body.enDescription,
          isApprove: approve,
          isActive: true,
          product_id: req.raw.body.product_id,
          store_id: req.raw.body.store_id,
          url: req.raw.body.url,
          expiry_date: moment(req.raw.body.expiry_date)
            .utc()
            .tz("Asia/Riyadh")
            .endOf("day"),
          ads_for: req.raw.body.ads_for,
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
      // await updateCacheWithUpdate('Advs', Advs, req.params.id)

      const response = {
        status_code: 200,
        status: true,
        message: "تمت العملية بنجاح",
        items: Advs,
      };
      reply.code(200).send(response);
    }
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.deleteAdvs = async (req, reply) => {
  try {
    const welcomes = await Adv.findByIdAndRemove(req.params.id);
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

exports.addCategory = async (req, reply) => {
  try {
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

    let _Category = new Category({
      arName: req.raw.body.arName,
      enName: req.raw.body.enName,
      enDescription: req.raw.body.enDescription,
      arDescription: req.raw.body.arDescription,  
      image: img,
      isDeleted: false,
      sort: req.raw.body.sort,
    });
    var _return = handleError(_Category.validateSync());
    if (_return.length > 0) {
      reply.code(200).send({
        status_code: 400,
        status: false,
        message: _return[0],
        items: _return,
      });
      return;
    }
    let rs = await _Category.save();
    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: rs,
    };
    reply.code(200).send(response);
    } else{
      let _Category = new Category({
        arName: req.raw.body.arName,
        enName: req.raw.body.enName,
        enDescription: req.raw.body.enDescription,
        arDescription: req.raw.body.arDescription,  
        // image: img,
        isDeleted: false,
        // sort: req.raw.body.sort,
      });
      var _return = handleError(_Category.validateSync());
      if (_return.length > 0) {
        reply.code(200).send({
          status_code: 400,
          status: false,
          message: _return[0],
          items: _return,
        });
        return;
      }
      let rs = await _Category.save();
      const response = {
        status_code: 200,
        status: true,
        message: "تمت العملية بنجاح",
        items: rs,
      };
      reply.code(200).send(response);
    }
  }catch (err) {
    throw boom.boomify(err);
  }
};

exports.updateCategory = async (req, reply) => {
  try {
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
      const _Category = await Category.findByIdAndUpdate(
        req.params.id,
        {
          arName: req.raw.body.arName,
          enName: req.raw.body.enName,
          image: img,
          enDescription: req.raw.body.enDescription,
          arDescription: req.raw.body.arDescription,
          sort: req.raw.body.sort,
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
        items: Category,
      };
      reply.code(200).send(response);
   }else{
    const _Category = await Category.findByIdAndUpdate(
      req.params.id,
      {
        arName: req.raw.body.arName,
        enName: req.raw.body.enName,
        enDescription: req.raw.body.enDescription,
        arDescription: req.raw.body.arDescription,
        sort: req.raw.body.sort,
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
      items: Category,
    };
    reply.code(200).send(response);
   }
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.deleteCategory = async (req, reply) => {
  try {
    const previousCategory = await Category.findById(req.params.id);
    const _Category = await Category.findByIdAndUpdate(
      req.params.id,
      { isDeleted: !previousCategory.isDeleted },
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
      items: [],
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getCategory = async (req, reply) => {
  try {
    var arr = [];
    const language = req.headers["accept-language"];
    const _Category = await Category.find({ isDeleted: false }).sort({
      sort: -1,
    });

    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          _Category
        )
      );
    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getSingleCategory = async (req, reply) => {
  try {
    const _Category = await Category.findById(req.params.id).sort({ _id: -1 });
    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: _Category,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};


exports.addSubCategory = async (req, reply) => {
  try {
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
      let _Category = new SubCategory({
        arName: req.raw.body.arName,
        enName: req.raw.body.enName,
        enDescription: req.raw.body.enDescription,
        arDescription: req.raw.body.arDescription,
        image: img,
        category_id: req.raw.body.category_id,
        price: req.raw.body.price,
        isDeleted: false,
      });
      var _return = handleError(_Category.validateSync());
      if (_return.length > 0) {
        reply.code(200).send({
          status_code: 400,
          status: false,
          message: _return[0],
          items: _return,
        });
        return;
      }
      let rs = await _Category.save();
      const response = {
        status_code: 200,
        status: true,
        message: "تمت العملية بنجاح",
        items: rs,
      };
      reply.code(200).send(response);
    }
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.updateSubCategory = async (req, reply) => {
  try {
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
      const _Category = await SubCategory.findByIdAndUpdate(
        req.params.id,
        {
          arName: req.raw.body.arName,
          enName: req.raw.body.enName,
          category_id: req.raw.body.category_id,
          enDescription: req.raw.body.enDescription,
          arDescription: req.raw.body.arDescription,
          image: img,
          price: req.raw.body.price,
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
        items: Category,
      };
      reply.code(200).send(response);
    }else{
      const _Category = await SubCategory.findByIdAndUpdate(
        req.params.id,
        {
          arName: req.raw.body.arName,
          enName: req.raw.body.enName,
          category_id: req.raw.body.category_id,
          enDescription: req.raw.body.enDescription,
          arDescription: req.raw.body.arDescription,
          price: req.raw.body.price,
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
        items: Category,
      };
      reply.code(200).send(response);
    }
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.deleteSubCategory = async (req, reply) => {
  try {
    const previousCategory = await SubCategory.findById(req.params.id);
    const _Category = await SubCategory.findByIdAndUpdate(
      req.params.id,
      { isDeleted: !previousCategory.isDeleted },
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
      items: [],
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getSubCategory = async (req, reply) => {
  try {
    var arr = [];
    const language = req.headers["accept-language"];
    const _Category = await SubCategory.find({ $and:[{isDeleted: false}, {category_id: req.params.id}] })
    .populate("category_id")
    .sort({_id: -1});

    reply
      .code(200)
      .send(
        success(
          language,
          200,
          MESSAGE_STRING_ARABIC.SUCCESS,
          MESSAGE_STRING_ENGLISH.SUCCESS,
          _Category
        )
      );
    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getSingleSubCategory = async (req, reply) => {
  try {
    const _Category = await SubCategory.findById(req.params.id).sort({ _id: -1 });
    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: _Category,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};


