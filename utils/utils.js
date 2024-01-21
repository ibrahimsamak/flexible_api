var crypto = require("crypto");
var nodemailer = require("nodemailer");
const fs = require("fs");
const axios = require("axios");
var ejs = require("ejs");
var request = require("request");
const cloudinary = require("cloudinary");
const NodeGeocoder = require("node-geocoder");
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var xhr = new XMLHttpRequest();
const moment = require("moment");

const { Notifications } = require("../models/Notifications");
const { Admin } = require("../models/Admin");
const { getCurrentDateTime, setting } = require("../models/Constant");
const { getLanguage, Users } = require("../models/User");

const { Transactions, Order } = require("../models/Order");
const utils = require("../utils/utils");
const { coupon } = require("../models/Coupon");
const { SubCategory } = require("../models/Product");

cloudinary.config({
  cloud_name: "dfrogfdqd",
  api_key: "687139559552176",
  api_secret: "iveaF0EhK9giXl7rjR1ykcnslQ4",
});

const options = {
  provider: "google",
  httpAdapter: "https", // Default
  apiKey: "AIzaSyB-rmiN7S-HO-nj-yvh81KcxZWBkh0RJnc", // for Mapquest, OpenCage, Google Premier
  formatter: null, // 'gpx', 'string', ...
};

const geocoder = NodeGeocoder(options);

exports.emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

exports.encryptPassword = function (password) {
  try {
    var mykey = crypto.createCipher("aes-128-cbc", "mypassword");
    var mystr = mykey.update(password, "utf8", "hex");
    mystr += mykey.final("hex");
    return mystr;
  } catch (error) {
    console.error(error);
  }
};

exports.decryptPasswordfunction = function (password) {
  try {
    var mykey = crypto.createDecipher("aes-128-cbc", "mypassword");
    var mystr = mykey.update(password, "hex", "utf8");
    mystr += mykey.final("utf8");
    return mystr;
  } catch (error) {
    console.error(error);
  }
};

exports.mail_reset_password = function (req, to, sub, text, data) {
  try {
    email = "info@khawi.app";
    psw = "Ha@1020300";
    var transporter = nodemailer.createTransport({
      host: "khawi.app",
      port: 465,
      secure: true,
      auth: {
        user: "info@khawi.app",
        pass: "Ha@1020300",
      },
    });

    var template = process.cwd() + "/emails/reset-password.html";

    fs.readFile(template, "utf8", function (error, file) {
      if (error) {
        return error;
      } else {
        var compiledTmpl = ejs.compile(file, { filename: template });
        var context = {
          newPassword: data.newPassword,
          full_name: data.full_name,
        };

        var htmls = compiledTmpl(context);
        htmls = htmls.replace(/&lt;/g, "<");
        htmls = htmls.replace(/&gt;/g, ">");
        htmls = htmls.replace(/&#34;/g, '"');

        var mailOptions = {
          from: '"جاز توك" <' + email + ">",
          to: to,
          subject: sub,
          text: text,
          html: htmls,
        };

        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.error("error");
            console.error(error);
            // return
          } else {
            // return
          }
        });
      }
    });
  } catch (error) {
    console.error(error);
  }
};

exports.mail_welcome = function (req, to, sub, text, data) {
  try {
    email = "info@khawi.app";
    psw = "Ha@1020300";
    var transporter = nodemailer.createTransport({
      host: "khawi.app",
      port: 465,
      secure: true,
      auth: {
        user: "info@khawi.app",
        pass: "Ha@1020300",
      },
    });

    var template = process.cwd() + "/emails/welcome.html";

    fs.readFile(template, "utf8", function (error, file) {
      if (error) {
        return error;
      } else {
        var compiledTmpl = ejs.compile(file, { filename: template });
        var context = {
          full_name: data.full_name,
          phone_number: data.phone_number,
          password: data.password,
        };

        var htmls = compiledTmpl(context);
        htmls = htmls.replace(/&lt;/g, "<");
        htmls = htmls.replace(/&gt;/g, ">");
        htmls = htmls.replace(/&#34;/g, '"');

        var mailOptions = {
          from: '"جاز توك" <' + email + ">",
          to: to,
          subject: sub,
          text: text,
          html: htmls,
        };

        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.error("error");
            console.error(error);
            // return
          } else {
            // return
          }
        });
      }
    });
  } catch (error) {
    console.error(error);
  }
};

exports.mail_general = function (req, to, sub, text, data) {
  try {
    email = "info@khawi.app";
    psw = "Ha@1020300";
    var transporter = nodemailer.createTransport({
      host: "khawi.app",
      port: 465,
      secure: true,
      auth: {
        user: "info@khawi.app",
        pass: "Ha@1020300",
      },
    });

    var template = process.cwd() + "/emails/general.html";

    fs.readFile(template, "utf8", function (error, file) {
      if (error) {
        return error;
      } else {
        var compiledTmpl = ejs.compile(file, { filename: template });
        var context = {
          full_name: data.full_name,
          msg: data.msg,
        };

        var htmls = compiledTmpl(context);
        htmls = htmls.replace(/&lt;/g, "<");
        htmls = htmls.replace(/&gt;/g, ">");
        htmls = htmls.replace(/&#34;/g, '"');

        var mailOptions = {
          from: '"جاز توك" <' + email + ">",
          to: to,
          subject: sub,
          text: text,
          html: htmls,
        };

        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.error("error");
            console.error(error);
            // return
          } else {
            // return
          }
        });
      }
    });
  } catch (error) {
    console.error(error);
  }
};

exports.sendSMS = async function(number, from, to, code){
  let msg = encodeURI(code)
  var url = `https://api.oursms.com/msgs/sms`
  
  let _config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + "aS1v2wbaF43MMY1txF5i"
    },
  };
  let body = {
    "src": "JAZCOM",
    "body": code,
    "dests": [number]
  }

  // axios
  // .post(url,body, _config)
  // .then((response) => {
  //   console.log(response)
  // })
  // .catch((error) => {
  //   console.log(error)
  // });
}

exports.sendWhatsApp = async function(number, from, to, code){
  
  var url = `hhttps://cartat.net/api/whatsapp/send`
  let _config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + "44|rX60FE8axfKv20uJjocIoPQU13FBI6YumP6o3pmh"
    },
  };
  let body = { 
    "number": number,
    "body": code
  }

    // axios
    // .post(url, body, _config)
    // .then((response) => {
    //   //console.log(response)
    // })
    // .catch((error) => {
    //   console.log(error)
    // });
}

exports.uploadImages = async function (img) {
  return new Promise(function (resolve, reject) {
    cloudinary.v2.uploader.upload("./uploads/" + img, function (error, result) {
      if (error) {
        reject(error);
      } else {
        img = result["url"];
        resolve(img);
      }
    });
  });
};

exports.CreateGeneralNotification = function (
  deviceId,
  title,
  msg,
  type,
  params,
  fromId,
  to_user_id,
  fromName,
  toName
) {
  return new Promise(function (resolve, reject) {
    let _Notification = new Notifications({
      fromId: fromId,
      user_id: to_user_id,
      title: title,
      msg: msg,
      dt_date: getCurrentDateTime(),
      type: type,
      body_parms: params,
      isRead: false,
      fromName: fromName,
      toName: toName,
    });

    let rs = _Notification.save();
    console.log(rs)
    let postModel = {
      notification: {
        title: title,
        body: msg,
        sound: "default",
        badge: 1,
      },
      data: null,
      to: deviceId,
    };
    var data = JSON.stringify(postModel);
    var xhr = new XMLHttpRequest();
    //xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function () {
      if (this.readyState === 4) {
        console.log("send" + this.responseText);
      }
    });

    xhr.open("POST", "https://fcm.googleapis.com/fcm/send");
    xhr.setRequestHeader(
      "Authorization",
      "key=AAAALj3M_AA:APA91bHkzRCHZ4duGpT9hCn0L0MvyvDJN6XD5FgMYvJN0WRjHqY9Lj2IaiUkY4p3J6pI9SLxGWlR8bU478xr1Y7YnY1lnw11JOW-Hj8srllLFdvlmDqzIHljKRXRP42Mt65saXA0umFv"
    );
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(data);
    resolve(data);
    reject("");
  });
};

exports.makeid = function (number) {
  var text = "";
  var possible = "0123456789";

  for (var i = 0; i < number; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
};

exports.CreateNotificationMultiple = function (deviceId, title, msg, order_id) {
  return new Promise(function (resolve, reject) {
    let postModel = {
      notification: {
        title: title,
        body: msg,
        sound: "default",
        icon: "assets/images/logo.png",
        badge: 1,
      },
      data: {
        data: order_id,
        notification: {
          title: title,
          body: msg,
          sound: "default",
          icon: "assets/images/logo.png",
          badge: 1,
        },
      },
      registration_ids: deviceId,
    };
    var data = JSON.stringify(postModel);
    var xhr = new XMLHttpRequest();
    //xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function () {
      if (this.readyState === 4) {
        console.log("send" + this.responseText);
      }
    });

    xhr.open("POST", "https://fcm.googleapis.com/fcm/send");
    xhr.setRequestHeader(
      "Authorization",
      "key=AAAALj3M_AA:APA91bHkzRCHZ4duGpT9hCn0L0MvyvDJN6XD5FgMYvJN0WRjHqY9Lj2IaiUkY4p3J6pI9SLxGWlR8bU478xr1Y7YnY1lnw11JOW-Hj8srllLFdvlmDqzIHljKRXRP42Mt65saXA0umFv"
    );
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(data);
    resolve(data);
    reject("");
  });
};

exports.getAddress = async function (lat, lng) {
  var current_city = "";
  try {
    return new Promise(function (resolve, reject) {
      geocoder
        .reverse({ lat: lat, lon: lng })
        .then(async function (res) {
          if (res) {
            console.log(
              res[0]["administrativeLevels"]["level1long"],
              res[0].country
            );
            current_city = res[0]["administrativeLevels"]["level1long"];
            resolve(current_city);
          } else {
            current_city = "";
            resolve(current_city);
            reject("");
          }
        })
        .catch(function (err) {
          console.log(err);
          current_city = "عنوان غير معرف";
          resolve(current_city);
        });
    });
  } catch (err) {
    const response = {
      status_code: 400,
      status: false,
      message: "العنوان المدخل غير صحيح",
      items: "",
    };
    reply.code(200).send(response);
  }
};

exports.check_request_params = function (
  request_data_body,
  params_array,
  response
) {
  var missing_param = "";
  var is_missing = false;
  var invalid_param = "";
  var is_invalid_param = false;

  params_array.forEach(function (param) {
    if (
      request_data_body[param.name] == undefined ||
      request_data_body[param.name] == null
    ) {
      missing_param = param.name;
      is_missing = true;
    } else {
      if (param.type && typeof request_data_body[param.name] !== param.type) {
        is_invalid_param = true;
        invalid_param = param.name;
      }
    }
  });

  if (is_missing) {
    response({
      status: false,
      code: 400,
      message: missing_param + " parameter missing",
    });
  } else if (is_invalid_param) {
    response({
      status: false,
      code: 400,
      message: invalid_param + " parameter invalid",
    });
  } else {
    response({ success: true });
  }
};

exports.makeOrderNumber = function (number) {
  var text = "";
  var possible = "0123456789";
  const time = new Date().getMilliseconds();
  for (var i = 0; i < number; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return `${text}${time}`;
};

exports.handleError = function (error) {
  var arr = [];
  if (error != null && error != undefined) {
    if (error.errors) {
      Object.keys(error.errors).forEach((element) => {
        if (error.errors[element].message != "") {
          arr.push(error.errors[element].message);
        }
      });
    }
  }
  return arr;
};

exports.NewPayment = async function (user_id, order_no ,to, sign, amount, paymentType) {
  // var orderNo = `#${utils.makeid(6)}`;
  let _payment = new Transactions({
    order_no: order_no,
    user: user_id,
    details: to,
    total: amount,
    type: sign,
    paymentType: paymentType,
    createAt: getCurrentDateTime(),
  });

  await _payment.save();

  var _amount = 0;
  if (sign == "-") _amount = Number(-1 * amount);
  else _amount = amount;
  const _user = await Users.findByIdAndUpdate(
    user_id,
    { $inc: { wallet: _amount } },
    { new: true }
  );
  return _user;
};

exports.check_coupon = async function check_coupon(user_id, _coupon, sub_category_id){
  var today = moment().tz("Asia/Riyadh");
  const tax = await setting.findOne({ code: "TAX" });
  const _sp = await Order.findOne({$and:[{couponCode: _coupon},{user:user_id}]})
  const sp = await coupon.findOne({
    $and: [
      { dt_from: { $lte: today } },
      { dt_to: { $gte: today } },
      { coupon: _coupon }
    ],
  });

  if(_sp) {
    return null;
  }

  if(!sp) {
    return null;
  }
  
  const sub_category = await SubCategory.findById(sub_category_id);
  var discount_rate = Number(sub_category.price) * Number(sp.discount_rate);
  var final_total = Number(sub_category.price) - discount_rate;
  var final_total_tax = (Number(final_total) * Number(tax.value)) + Number(final_total)
  var total_tax = (Number(final_total) * Number(tax.value)) 

  var returnObject = {
    final_total: Number(final_total_tax),
    total_before_tax: Number(sub_category.price),
    discount: discount_rate,
    total_tax: total_tax
  };
  return returnObject
}