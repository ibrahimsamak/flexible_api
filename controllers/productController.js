// External Dependancies
const boom = require("boom");
const jwt = require("jsonwebtoken");
const config = require("config");
const fs = require("fs");
const async = require("async");
const lodash = require("lodash");
const moment = require("moment-timezone");

const {
  Category,
  Product,
  Supplier,
  Product_Price,
  Place_Delivery,
} = require("../models/Product");
const {
  encryptPassword,
  mail_reset_password,
  makeid,
  uploadImages,
  CreateGeneralNotification,
  CreateNotification,
  sendSMS,
  handleError,
} = require("../utils/utils");
const { success, errorAPI } = require("../utils/responseApi");
const {
  MESSAGE_STRING_ENGLISH,
  MESSAGE_STRING_ARABIC,
  LANGUAGE_ENUM,
  USER_TYPE,
  VALIDATION_MESSAGE_ARABIC,
  VALIDATION_MESSAGE_ENGLISH,
} = require("../utils/constants");
const { getCurrentDateTime } = require("../models/Constant");
const { Favorite } = require("../models/Favorite");
const { Adv } = require("../models/adv");
const { request } = require("request");
const { Users } = require("../models/User");


exports.getProductsByCategoryId = async (req, reply) => {
  try {
    const language = req.headers["accept-language"];
    var place_id = req.headers["place"];
    var supplier_id = req.headers["supplier"];
    const user_id = req.user._id;

    // const lat = req.query.lat;
    // const lng = req.query.lng;
    var returnArr = [];

    var page = parseFloat(req.query.page, 10);
    var limit = parseFloat(req.query.limit, 10);
    // get products prices in location

    var Product_Prices = await Product_Price.find({
      $and: [
        { place_id: place_id },
        { supplier_id: supplier_id },
        { isDeleted: false },
      ],
    });
    var products_ids = Product_Prices.map((x) => x.product_id);

    var total = await Product.find({
      $and: [
        { _id: { $in: products_ids } },
        { category_id: req.params.id },
        { isNewProduct: true },
        { isDeleted: false },
      ],
    }).countDocuments();
    var item = await Product.find({
      $and: [
        { _id: { $in: products_ids } },
        { category_id: req.params.id },
        { isNewProduct: true },
        { isDeleted: false },
      ],
    })
      .populate("category_id")
      .sort({ _id: -1 })
      .skip(page * limit)
      .limit(limit);

    for await (const data of item) {
      var Product_Price_Object = Product_Prices.find((x) => {
        return String(x.product_id) === String(data._id);
      });

      const checkFavorite = await Favorite.findOne({
        $and: [
          { user_id: user_id },
          { product_id: data._id },
          { place_id: place_id },
          { supplier_id: supplier_id },
        ],
      });
      const newObj = data.toObject();
      if (checkFavorite) {
        newObj.favorite_id = checkFavorite._id;
      } else {
        newObj.favorite_id = null;
      }

      var cateogory = {
        _id: data.category_id._id,
        name: data.category_id[`${language}Name`],
        image: data.category_id.image ? data.category_id.image : "",
      };

      delete newObj.arName;
      delete newObj.enName;
      delete newObj.arDescription;
      delete newObj.enDescription;
      newObj.discountPrice = Product_Price_Object.discountPrice;
      newObj.price_for_new = Product_Price_Object.price_for_new;
      newObj.price_for_replacment = Product_Price_Object.price_for_replacment;
      newObj.name = data[`${language}Name`];
      newObj.description = data[`${language}Description`];
      newObj.category_id = cateogory;
      returnArr.push(newObj);
    }

    reply.code(200).send(
      success(
        language,
        200,
        MESSAGE_STRING_ARABIC.SUCCESS,
        MESSAGE_STRING_ENGLISH.SUCCESS,
        returnArr,
        {
          size: returnArr.length,
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

exports.getProductsSearchFilter = async (req, reply) => {
  try {
    var returnArr = [];
    const language = req.headers["accept-language"];
    var place_id = req.headers["place"];
    var supplier_id = req.headers["supplier"];
    const user_id = req.user._id;

    var sort = {};
    var sort_field = req.body.sort_field;
    var sort_value = req.body.sort_value;
    sort[sort_field] = sort_value;

    let query1 = {};
    var page = parseFloat(req.body.page, 10);
    var limit = parseFloat(req.body.limit, 10);
    if (req.body.name && req.body.name != "") {
      query1 = {
        $or: [
          { arName: { $regex: new RegExp(req.body.name, "i") } },
          { enName: { $regex: new RegExp(req.body.name, "i") } },
        ],
      };
    }

    if (req.body.category_id && req.body.category_id != "") {
      query1["category_id"] = req.body.category_id;
    }
    query1["isNewProduct"] = true;
    query1["isDeleted"] = false;


    var Product_Prices = await Product_Price.find({
      $and: [
        { place_id: place_id },
        { supplier_id: supplier_id },
        { isDeleted: false },
      ],
    }).sort(sort);
    var products_ids = Product_Prices.map((x) => x.product_id);
    query1["_id"] = { $in: products_ids };
    const total = await Product.find(query1).countDocuments();
    var item = await Product.find(query1)
      .populate("category_id")
      .populate("type_id")
      .select(["-token", "-password"])
      .skip(page * limit)
      .limit(limit)
      .sort(sort);

    for await (const data of item) {
      var Product_Price_Object = Product_Prices.find((x) => {
        return String(x.product_id) === String(data._id);
      });

      const checkFavorite = await Favorite.findOne({
        $and: [
          { user_id: user_id },
          { product_id: data._id },
          { place_id: place_id },
          { supplier_id: supplier_id },
        ],
      });
      const newObj = data.toObject();
      if (checkFavorite) {
        newObj.favorite_id = checkFavorite._id;
      } else {
        newObj.favorite_id = null;
      }

      var cateogory = {
        _id: data.category_id._id,
        name: data.category_id[`${language}Name`],
        image: data.category_id.image ? data.category_id.image : "",
      };

      delete newObj.arName;
      delete newObj.enName;
      delete newObj.arDescription;
      delete newObj.enDescription;
      newObj.discountPrice = Product_Price_Object.discountPrice;
      newObj.price_for_new = Product_Price_Object.price_for_new;
      newObj.price_for_replacment = Product_Price_Object.price_for_replacment;
      newObj.name = data[`${language}Name`];
      newObj.description = data[`${language}Description`];
      newObj.category_id = cateogory;
      returnArr.push(newObj);
    }

    reply.code(200).send(
      success(
        language,
        200,
        MESSAGE_STRING_ARABIC.SUCCESS,
        MESSAGE_STRING_ENGLISH.SUCCESS,
        returnArr,
        {
          size: returnArr.length,
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

exports.getRefillProducts = async (req, reply) => {
  try {
    const language = req.headers["accept-language"];
    var place_id = req.headers["place"];
    var supplier_id = req.headers["supplier"];
    const user_id = req.user._id;

    // const lat = req.query.lat;
    // const lng = req.query.lng;
    var returnArr = [];

    // var page = parseFloat(req.query.page, 10);
    // var limit = parseFloat(req.query.limit, 10);
    // get products prices in location

    var Product_Prices = await Product_Price.find({
      $and: [
        { place_id: place_id },
        { supplier_id: supplier_id },
        { isDeleted: false },
      ],
    });
    var products_ids = Product_Prices.map((x) => x.product_id);

    // var total = await Product.find({
    //   $and: [
    //     { _id: { $in: products_ids } },
    //     { isReplacement: true },
    //     {
    //       isDeleted: false,
    //     },
    //   ],
    // }).countDocuments();
    var item = await Product.find({
      $and: [
        { _id: { $in: products_ids } },
        { isReplacement: true },
        { isDeleted: false },
      ],
    })
      .populate("category_id")
      .sort({ _id: -1 });
    // .skip(page * limit)
    // .limit(limit);

    for await (const data of item) {
      var Product_Price_Object = Product_Prices.find((x) => {
        return String(x.product_id) === String(data._id);
      });

      const checkFavorite = await Favorite.findOne({
        $and: [
          { user_id: user_id },
          { product_id: data._id },
          { place_id: place_id },
          { supplier_id: supplier_id },
        ],
      });
      const newObj = data.toObject();
      if (checkFavorite) {
        newObj.favorite_id = checkFavorite._id;
      } else {
        newObj.favorite_id = null;
      }

      var cateogory = {
        _id: data.category_id._id,
        name: data.category_id[`${language}Name`],
        image: data.category_id.image ? data.category_id.image : "",
      };

      delete newObj.arName;
      delete newObj.enName;
      delete newObj.arDescription;
      delete newObj.enDescription;
      newObj.discountPriceReplacment =
        Product_Price_Object.discountPriceReplacment;
      newObj.discountPriceReplacment =
        Product_Price_Object.discountPriceReplacment;
      newObj.price_for_new = Product_Price_Object.price_for_new;
      newObj.price_for_replacment = Product_Price_Object.price_for_replacment;
      newObj.name = data[`${language}Name`];
      newObj.description = data[`${language}Description`];
      newObj.category_id = cateogory;
      returnArr.push(newObj);
    }

    reply.code(200).send(
      success(
        language,
        200,
        MESSAGE_STRING_ARABIC.SUCCESS,
        MESSAGE_STRING_ENGLISH.SUCCESS,
        returnArr
        // {
        //   size: returnArr.length,
        //   totalElements: total,
        //   totalPages: Math.floor(total / limit),
        //   pageNumber: page,
        // }
      )
    );
    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getCategories = async (req, reply) => {
  try {
    const language = req.headers["accept-language"];

    const _Category = await Category.find({
      isDeleted: false,
    }).sort({ sort: 1 });
    var arr = [];
    _Category.forEach((element) => {
      var newObject = element.toObject();
      var obj = {
        _id: newObject._id,
        name: newObject[`${language}Name`],
        image: newObject.image,
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

exports.getSuppliers = async (req, reply) => {
  try {
    const language = req.headers["accept-language"];
    query1["app_type"] = 'provider'

    const _Category = await Users.find({app_type:'provider'})
      .sort({ _id: -1 })
      .populate("cities");
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

////////////admin///////////
exports.getAllProductsList = async (req, reply) => {
  try {
    const language = "ar";
    var page = parseFloat(req.query.page, 10);
    var limit = parseFloat(req.query.limit, 10);
    // var query = {};
    var query = { $and: [] };
    query.$and.push({ isDeleted: false });

    const item = await Product.find(query)
      .populate("supplier_id")
      .populate("category_id")
      .sort({_id:-1})
    var obj = {};
    obj["status"] = true;
    obj["code"] = 200;
    obj["message"] = "تمت العملية بنجاح";
    obj["items"] = item;

    reply.code(200).send(obj);
    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getAllProductsByAdmin = async (req, reply) => {
  try {
    const language = "ar";
    var page = parseFloat(req.query.page, 10);
    var limit = parseFloat(req.query.limit, 10);
    // var query = {};
    var query = { $and: [] };
    if (String(req.body.name) != "") {
      query.$and.push({
        $or: [
          { arName: { $regex: new RegExp(req.body.name, "i") } },
          { arDescription: { $regex: new RegExp(req.body.name, "i") } },
          { enName: { $regex: new RegExp(req.body.name, "i") } },
          { enDescription: { $regex: new RegExp(req.body.name, "i") } },
        ],
      });
    }
    if (req.body.category_id != "") {
      query.$and.push({ category_id: req.body.category_id });
    }

    query.$and.push({ isDeleted: false });

    const total = await Product.find(query).countDocuments();
    const item = await Product.find(query)
      .populate("category_id")
      .sort({_id:-1})
      .skip(page * limit)
      .limit(limit);
    var obj = {};
    obj["status"] = true;
    obj["code"] = 200;
    obj["message"] = "تمت العملية بنجاح";
    obj["items"] = item;
    obj["pagination"] = {
      size: item.length,
      totalElements: total,
      totalPages: Math.floor(total / limit),
      pageNumber: page,
    };

    reply.code(200).send(obj);
    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getAllProductsExcelByAdmin = async (req, reply) => {
  try {
    const language = "ar";
    var query = { $and: [] };
    if (String(req.body.name) != "") {
      query.$and.push({
        $or: [
          { arName: { $regex: new RegExp(req.body.name, "i") } },
          { arDescription: { $regex: new RegExp(req.body.name, "i") } },
          { enName: { $regex: new RegExp(req.body.name, "i") } },
          { enDescription: { $regex: new RegExp(req.body.name, "i") } },
        ],
      });
    }
    if (req.body.category_id != "") {
      query.$and.push({ category_id: req.body.category_id });
    }

    query.$and.push({ isDeleted: false });

    const total = await Product.find(query).countDocuments();
    const item = await Product.find(query).populate("category_id").sort({_id:-1});
    var obj = {};
    obj["status"] = true;
    obj["code"] = 200;
    obj["message"] = "تمت العملية بنجاح";
    obj["items"] = item;
    reply.code(200).send(obj);
    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.deleteProduct = async (req, reply) => {
  try {
    await Product.findByIdAndUpdate(
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

exports.addProduct = async (req, reply) => {
  try {
    console.log(req.raw);
    if (req.raw.files) {
      var img = "";

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

      await uploadImages(files.image.name).then((x) => {
        img = x;
      });

      let rs = new Product({
        arName: req.raw.body.arName,
        enName: req.raw.body.enName,
        arDescription: req.raw.body.arDescription,
        enDescription: req.raw.body.enDescription,
        rate: 0,
        image: img,
        createat: getCurrentDateTime(),
        category_id: req.raw.body.category_id,
        isNewProduct: req.raw.body.isNewProduct,
        isReplacement: req.raw.body.isReplacement,
        sort: req.raw.body.sort,
        isDeleted: false,
      });
      var _return = handleError(rs.validateSync());
      if (_return.length > 0) {
        reply.code(200).send({
          status_code: 400,
          status: false,
          message: _return[0],
          items: _return,
        });
        return;
      }
      let saved = await rs.save();

      const response = {
        status_code: 200,
        status: true,
        message: "تمت اضافة المنتج بنجاح",
        items: saved,
      };
      reply.send(response);
    }
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.updateProduct = async (req, reply) => {
  try {
    if (req.raw.files) {
      var img = "";
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

      await uploadImages(files.image.name).then((x) => {
        img = x;
      });

      let prod = await Product.findByIdAndUpdate(
        { _id: req.params.id },
        {
          arName: req.raw.body.arName,
          enName: req.raw.body.enName,
          arDescription: req.raw.body.arDescription,
          enDescription: req.raw.body.enDescription,
          image: img,
          category_id: req.raw.body.category_id,
          isNewProduct: req.raw.body.isNewProduct,
          isReplacement: req.raw.body.isReplacement,
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
        message: "تم الحفظ بنجاح",
        items: prod,
      };
      reply.send(response);
    } else {
      const prod = await Product.findByIdAndUpdate(
        req.params.id,
        {
          arName: req.raw.body.arName,
          enName: req.raw.body.enName,
          arDescription: req.raw.body.arDescription,
          enDescription: req.raw.body.enDescription,
          category_id: req.raw.body.category_id,
          isNewProduct: req.raw.body.isNewProduct,
          isReplacement: req.raw.body.isReplacement,
          sort: req.raw.body.sort,
        },
        { new: true }
      );
      const response = {
        status_code: 200,
        status: true,
        message: "تم الحفظ بنجاح",
        items: prod,
      };
      reply.send(response);
    }
  } catch (err) {
    console.log(err);
    throw boom.boomify(err);
  }
};

exports.getSingleProduct = async (req, reply) => {
  try {
    const prod = await Product.findById(req.params.id);
    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: prod,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getAllProductPlaceByAdmin = async (req, reply) => {
  try {
    const language = "ar";
    var page = parseFloat(req.query.page, 10);
    var limit = parseFloat(req.query.limit, 10);
    // var query = {};
    var query = { $and: [] };

    if (req.body.category_id != "") {
        query.$and.push({ category_id: req.body.category_id });
    }
    if (req.body.city_id != "") {
        query.$and.push({ city_id: req.body.city_id });
    }
    if (req.body.place_id != "") {
      query.$and.push({ place_id: req.body.place_id });
    }
    if (req.body.supplier_id != "") {
      query.$and.push({ supplier_id: req.body.supplier_id });
    }

    query.$and.push({ isDeleted: false });
    const total = await Product_Price.find(query).countDocuments();
    const item = await Product_Price.find(query)
      .populate("category_id")
      .populate("place_id")
      .populate("city_id")
      .populate("supplier_id")
      .sort({ _id: -1 })
      .skip(page * limit)
      .limit(limit);
    var obj = {};
    obj["status"] = true;
    obj["code"] = 200;
    obj["message"] = "تمت العملية بنجاح";
    obj["items"] = item;
    obj["pagination"] = {
      size: item.length,
      totalElements: total,
      totalPages: Math.floor(total / limit),
      pageNumber: page,
    };

    reply.code(200).send(obj);
    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.getAllProductPlaceExcelByAdmin = async (req, reply) => {
  try {
    const language = "ar";
    var query = { $and: [] };
    if (String(req.body.name) != "") {
      query.$and.push({
        $or: [
          { arName: { $regex: new RegExp(req.body.name, "i") } },
          { arDescription: { $regex: new RegExp(req.body.name, "i") } },
          { enName: { $regex: new RegExp(req.body.name, "i") } },
          { enDescription: { $regex: new RegExp(req.body.name, "i") } },
        ],
      });
    }
    if (req.body.supplier_id != "") {
      query.$and.push({ supplier_id: req.body.supplier_id });
    }
    if (req.body.place_id != "") {
      query.$and.push({ place_id: req.body.place_id });
    }

    query.$and.push({ isDeleted: false });
    const total = await Product_Price.find(query).countDocuments();
    const item = await Product_Price.find(query)
      .populate("product_id")
      .populate({
        path: "product_id",
        populate: {
          path: "category_id",
        },
      })
      .populate("place_id")
      .sort({ _id: -1 });

    var obj = {};
    obj["status"] = true;
    obj["code"] = 200;
    obj["message"] = "تمت العملية بنجاح";
    obj["items"] = item;
    reply.code(200).send(obj);
    return;
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.deleteProductPlace = async (req, reply) => {
  try {
    await Product_Price.findByIdAndUpdate(
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

exports.addProductPlace = async (req, reply) => {
  try {
    var check = await Product_Price.findOne({$and:[{category_id: req.body.category_id}, {place_id: req.body.place_id}]})
    if(check){
        const response = {
                status_code: 400,
                status: false,
                message: "تمت اضافة الخدمة في هذا المربع مسبقا",
                items: {},
        };
        reply.send(response);
        return
    }
    let rs = new Product_Price({
      category_id: req.body.category_id,
      place_id: req.body.place_id,
      supplier_id: req.body.supplier_id,
      city_id: req.body.city_id,
      createAt: getCurrentDateTime(),
      isDeleted: false,
    });
    var _return = handleError(rs.validateSync());
    if (_return.length > 0) {
      reply.code(200).send({
        status_code: 400,
        status: false,
        message: _return[0],
        items: _return,
      });
      return;
    }
    let saved = await rs.save();

    const response = {
      status_code: 200,
      status: true,
      message: "تمت اضافة الخدمة بنجاح",
      items: saved,
    };
    reply.send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.updateProductPlace = async (req, reply) => {
  try {
    let prod = await Product_Price.findByIdAndUpdate(
      { _id: req.params.id },
      {
        category_id: req.body.category_id,
        place_id: req.body.place_id,
        supplier_id: req.body.supplier_id,
        city_id: req.body.city_id
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
      message: "تم الحفظ بنجاح",
      items: prod,
    };
    reply.send(response);
  } catch (err) {
    console.log(err);
    throw boom.boomify(err);
  }
};

exports.getSingleProductPlace = async (req, reply) => {
  try {
    const prod = await Product_Price.findById(req.params.id)
      .populate("supplier_id")
      .populate({
        path: "supplier_id",
        populate: {
          path: "cities",
        },
      });
    const response = {
      status_code: 200,
      status: true,
      message: "تمت العملية بنجاح",
      items: prod,
    };
    reply.code(200).send(response);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.addSupplierPlace = async (req, reply) => {
  try {
    const checkBefore = await Place_Delivery.findOne({
      $and: [
        { place_id: req.body.place_id },
        { city_id: req.body.city_id },
        { supplier_id: req.body.supplier_id },
        {isDeleted:false}
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
