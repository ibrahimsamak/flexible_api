const Enum = require("enum");

const CONTROLLER_ENUM = Object.freeze({
  items: "items",
  constant: "constant",
  city: "city",
  user: "user",
  items: "items",
  guest: "guest",
  products: "products",
  projects: "projects",
  designers: "designers",
  implementers: "implementers",
  furnitures: "furnitures",
  categories: "categories",
  carts: "carts",
  orders: "orders",
  notifications: "notifications",
  rates: "rates",
});

const LANGUAGE_ENUM = Object.freeze({
  EN: "en",
  AR: "ar",
});

const PAYMENT_TYPE = Object.freeze({
  ONLINE: "online",
  CASH: "cash",
  WALLET: "wallet",
});

const USER_TYPE = Object.freeze({
  USER: "user",
  DRIVER: "driver",
  ADMIN: "admin",
  GUEST: "guest",
  PANEL: "Panel",
});

const NOTIFICATION_TYPE = Object.freeze({
  ORDERS: 1,
  COUPON: 2,
  GENERAL: 3,
});

const NOTIFICATION_TITILES = Object.freeze({
  ORDERS: "متابعة الطلبات",
  COUPON: "كوبون",
  GENERAL: "الادارة",
});

const ACTORS = Object.freeze({
  ADMIN: "ADMIN",
  STORE: "STORE",
  SUPERVISOR: "SUPERVISOR",
});

const ORDER_STATUS = Object.freeze({
  new: "new",
  accpeted: "accepted",
  started: "started",
  progress: "progress",
  prefinished: "prefinished",
  finished: "finished",
  updated: "updated",
  rated: "rated",
  canceled_by_driver: "canceled_by_driver",
  canceled_by_user: "canceled_by_user",
  canceled_by_admin: "canceled_by_admin",
  canceled:"canceled"
});

const PASSENGER_STATUS = Object.freeze({
  add_offer:"add_offer",
  accept_offer: "accepet_offer",
  reject_offer: "reject_offer",
  attend:"attend",
  not_attend:"not_attend"
});

exports.MESSAGE_STRING_ENGLISH = {
  DELETED: "Deleted successfully",
  SUCCESS: "Action done successfully",
  SUCCESSNEW:"Thank you for shopping through the Shoula App. \n Your request has been received successfully",
  ERROR: "An error occure",
  WARNING: "Sorry ... your current location is not disturbed",
  EXIT: "We already have this item",
  OFFER_ERROR: "This order is not recived offer for now",


  ERROR_PRICE: "Sorry...the price entered is not between the minimum and maximum for this trip",
  
  CANT_COMPLETEL_PROCESS:
    "can't complete process please make sure of status you are send it",

  WALLET: "There is no enough balance in your wallet",
  NOCAR: "Sorry...please add a car so you can add an offer.",
  
  WELCOME: "Welcome to Khawi your verification code is: ",
  INVALID_TOKEN: "Invalid token",
  INVALID_TOKEN2: "Invalid token",
  ACCESS_DENIED: "Access denied. No token provided.",
  PLEASE_LOGIN: "Please login to show.",

  CREATE_USER: "User added successfully",
  CREATE_TEACHER: "TEACHER added successfully",

  USER_BLOCK: "User is blocked by admin",
  USER_VERIFY: "Please verify your phone number",
  USER_EXSIT: "Email or phone number is already exists",
  USER_EXSIT2: "Email is already exists",
  USER_EXSIT3: "Phone number is already exists",

  USER_LOGIN_FAILD: "Invalid phone number or password",
  USER_VERIFY_ERROR: "Invalid verify code",
  USER_VERIFY_SUCCESS: "Verified successfully",
  USER_FORGET_PASSWORD_SUCCESS:
    "Password has been sent to e-mail successfully.",
  USER_FORGET_PASSWORD_ERROR: "Phone number not registered",
  USER_CHANGE_PASSOWRD_SUCCESS: "The password was successfully updated",
  USER_CHANGE_PASSOWRD_ERROR: "Invalid user",
  USER_CHANGE_PASSOWRD_ERROR_OLD_PASSWORD: "Please make sure of old password",

  USER_CHANGE_EMAIL_SUCCESS: "Email has been successfully updated",
  USER_CHANGE_EMAIL_ERROR: "User does not exist",
  USER_CHANGE_PHONE_SUCCESS: "Phone number has been successfully updated",
  USER_CHANGE_PHONE_ERROR: "User does not exist",
  SEND_SMS: "Activation code sent successfully",

  FAVORITE_EXSIT: "Sorry .. this item is already exists",
  USER_LOGOUT: "Sign out successful",

  CREATE_PAYMENT: "The service has been successfully subscribed to",
  CREATE_PAYMENT_ERROR: "Sorry .. This package is unavailable right now",
  CREATE_CONVERSATION: "The conversation type was added successfully",
  UPDATE_CONVERSATION: "The conversation type was updated successfully",
  TEACHER_NOT_FOUND: "Invalid Tutor id",
  TEACHER_IS_BUSY: "The coach is not available at this time.",

  CREATE_RATE: "The evaluation was added successfully",
  CREATE_RATE_ERROR:
    "Sorry ... You can only add an assessment after the lesson ends.",

  COUPON_ERROR: "Invalid Coupon",
  RESERVATION_EXSIT: "Sorry ... This item is already in reservations",
  INVALID_PAYMENT: "Sorry ... The selected package has expired",
  EMPTY_CART: "Sorry .. Cart is empty",
  ENTER_STATUS: "Status is required",
  ERROR_RATE: "Sorry .. you can't rate righ now",
  RATE_BEFORE: "Order has been rated before",
  NOT_COVERED:
    "Sorry ... your area is not covered. We strive to cover all areas as soon as possible.",

  CANCEL_ORDER_FAILED: "sorry .. you can't cancel order while it under proccessing ",
  USER_NOT_FOUND: "User is not found",
  CHANGE_PLACE_OR_SUPPLIER:
    "some of the products may change, because of changing your current location, or changing by the service provider",
  WORNG_PLACE_ID: "unsupported place",
  UPDATE_PROFILE: "Profile updated successfully",
  ALL_FIELD_REQUIRED: "All fields are required",

  CANCEL_ORDER_FAILED2: "Sorry ... order already canceled ",

  CHANGE_PLACE_OR_SUPPLIER_CHECK_ORDER:
    "There may be some products not present at the place of receipt",

  DESTINATION_NOT_COVERED:
    "Sorry ... shipment area is not covered. We strive to cover all areas as soon as possible",
};

exports.MESSAGE_STRING_ARABIC = {
  DELETED: "تم الحذف بنجاح",
  SUCCESS: "تمت العملية بنجاح",
  SUCCESSNEW: "شكرا لكم لاستخدام تطبيق جاز توك \n تم استقبال طلبكم بنجاح",
  ERROR: "عذرا .. حدث خطأ ما الرجاء المحاولة في وقت لاحق",
  WARNING: "عذرا .. موقعك الحالي غير مغظى",
  EXIT: " هذا العنصر موجود لدينا مسبقا",
  OFFER_ERROR: "لا يمكن اضافة عرض على هذا الطلب",

  ERROR_PRICE: "عذرا .. السعر المدخل ليس بين الحد الادنى والاعلى لهذه الرحلة",


  CANT_COMPLETEL_PROCESS:
    "عذرا .. لا يمكن اتمام العملية الرجاء التأكد من الحالة المرسلة",
  WELCOME: "أهلا بكم في منصة جاز توك رمز التفعيل هو: ",
  WALLET: "عذرا .. ليس لديك الرصيد الكافي في المحفظة",
  NOCAR: "عذرا .. يرجى اضافة سيارة لتتمكن من اضافة عرض",

  INVALID_TOKEN: "Invalid token",
  INVALID_TOKEN2: "Invalid token",
  ACCESS_DENIED: "تم رفض الوصول الى هذه العملية",
  PLEASE_LOGIN: "الرجاء التسجيل لاكمال العملية",

  CREATE_USER: "تم اضافة المستخدم بنجاح",
  CREATE_TEACHER: "تم اضافة المدرب بنجاح",
  USER_BLOCK: "تم حظر المستخدم من قبل الادارة",
  USER_VERIFY: "الرجاء تفعيل رقم الجوال",
  USER_EXSIT: "البريد الالكتروني او رقم الجوال موجود لدينا مسبقا",
  USER_EXSIT2: "البريد الالكتروني موجود لدينا مسبقا",
  USER_EXSIT3: "رقم الجوال موجود لدينا مسبقا",
  USER_LOGIN_FAILD: "خطأ في رقم الجوال او كلمة المرور",
  USER_VERIFY_ERROR: "خطأ!! في رقم التفعيل",
  USER_VERIFY_SUCCESS: "تم التحقق بنجاح",
  USER_FORGET_PASSWORD_SUCCESS:
    "تم ارسال كلمة المرور الى البريد الالكتروني بنجاح",
  USER_FORGET_PASSWORD_ERROR: "رقم الجوال غير مسجل لدينا",
  USER_CHANGE_PASSOWRD_SUCCESS: "تم تعديل كلمة المرور بنجاح ",
  USER_CHANGE_PASSOWRD_ERROR: "المستخدم غير موجود",
  USER_CHANGE_PASSOWRD_ERROR_OLD_PASSWORD:
    "الرجاء التأكد من كلمة المرور القديمة",

  USER_CHANGE_EMAIL_SUCCESS: "تم تعديل البريد الالكتروني  بنجاح",
  USER_CHANGE_EMAIL_ERROR: "المستخدم غير موجود",
  USER_CHANGE_PHONE_SUCCESS: "تم تعديل رقم الجوال  بنجاح",
  USER_CHANGE_PHONE_ERROR: "المستخدم غير موجود",
  SEND_SMS: "تم ارسال كود التفعيل بنجاح",

  FAVORITE_EXSIT: "عذرا .. هذا العنصر موجود في المفضلة مسبقا",
  USER_LOGOUT: "تم تسجيل الخروج بنجاح",

  CREATE_PAYMENT: "تم الاشتراك بالخدمة بنجاح",
  CREATE_PAYMENT_ERROR: "الرجاء اختيار باقة متاحة",
  CREATE_CONVERSATION: "تم اضافة نوع المحادثة بنجاح",
  UPDATE_CONVERSATION: "تم تعديل المحادثة بنجاح",
  TEACHER_NOT_FOUND: "هذا المدرب غير موجود",
  TEACHER_IS_BUSY: "المدرب غير متاح في هذه اللحظات",
  CREATE_RATE: "تم اضافة التقييم بنجاح",
  CREATE_RATE_ERROR: "عذرا .. لايمكن اضافة تقييم الا بعد انتهاء الدرس",

  COUPON_ERROR: "الكوبون غير متاح",
  RESERVATION_EXSIT: "عذرا .. هذا العنصر موجود في الحجوزات مسبقا",
  INVALID_PAYMENT: "عذرا .. الباقة المختارة قد انتهت",
  EMPTY_CART: "عذرا .. السلة فارغة",
  ENTER_STATUS: "الرجاء ادخال الحالة",
  ERROR_RATE: "عذرا .. لا يمكن التقييم حتى الانتهاء من الطلب",
  RATE_BEFORE: "عذرا .. تم تقييم الطلب مسبقا",
  NOT_COVERED:
    "عذرا .. منطقتك غير مغطاة نسعى جاهدين لتغطية جميع المناطق في أقرب وقت ممكن",
  CANCEL_ORDER_FAILED: "عذرا .. لا يمكنك إلغاء الطلب أثناء التنفيذ",

  USER_NOT_FOUND: "المستخدم غير موجود",
  CHANGE_PLACE_OR_SUPPLIER:
    "قد تتغير اسعار المنتجات بسبب تغيير موقعك الحالي او تغيير مزود الخدمة",
  WORNG_PLACE_ID: "المنطقة المرسلة غير متاحة حاليا",
  UPDATE_PROFILE: "تم تحديث الملف الشخصي بنجاح",
  ALL_FIELD_REQUIRED: "جميع الحقول مطلوبة",

  CANCEL_ORDER_FAILED2: "عذرا .. تم الغاء الطلب مسبقا",

  CHANGE_PLACE_OR_SUPPLIER_CHECK_ORDER:
    "قد يكون هناك بعض المنتجات غير موجودة في مكان الاستلام",

  DESTINATION_NOT_COVERED:
    "عذرا .. منطقة الشحن غير مغطاة نسعى جاهدين لتغطية جميع المناطق في أقرب وقت ممكن",
};

exports.VALIDATION_MESSAGE_ENGLISH = {
  NAME_REQUIRED: "Name field is required",
  LAST_NAME_REQUIRED: "Last name field is required",
  USER_NAME_REQUIRED: "Username field is required",
  PHONE_REQUIRED: "Phone number field is required",
  PHONE_MAX: "Phone number is invalid",

  EMAIL_REQUIRED: "Email field is required",
  COUNTRY_REQUIRED: "Country field is required",
  CITY_REQUIRED: "City field is required",
  LANGUAGE_REQUIRED: "Native language field is required",
  AGE_REQUIRED: "Age field is required",
  GENDER_REQUIRED: "Gender field is required",
  PASSWORD_REQUIRED: "Password field is required",
  DATE_OF_BIRTH_REQUIRED:
    "Date of birth field is required and must be YYYY-MM-DD format",
  FCMTOKEN_REQUIRED: "fcmToken field is required",
  OS_REQUIRED: "os field is required",
  LAT_REQUIRED: "lat field is required with double format",
  LNG_REQUIRED: "lng field is required with double format",
  ADDRESS_REQUIRED: "Address field is required",

  FIRST_NAME_MIN: "First name field should have a minimum length of ",
  LAST_NAME_MIN: "Last name field should have a minimum length of ",
  USER_NAME_MIN: "Username field should have a minimum length of ",
  PASSWORD_MIN: "Password field should have a minimum length of ",

  TYPE_REQUIRED: "Subject title field is required",
  INVALID_EMAIL: "Email field is not valid ",
  INVALID_DOB: "Date of birth field is not valid ",

  ALL_REQUIRED: "All fields are required",
  WRONG_STATUS: "Please send valid status",

  ACCEPTED_BEFORE : "Sorry .. the request was accepted by another driver"

};

exports.VALIDATION_MESSAGE_ARABIC = {
  NAME_REQUIRED: "الاسم مطلوب",
  LAST_NAME_REQUIRED: "الاسم الأخير مطلوب",
  USER_NAME_REQUIRED: "اسم المستخدم مطلوب",
  PHONE_REQUIRED: "رقم الجوال مطلوب",
  PHONE_MAX: "رقم الجوال غير صحيح",
  EMAIL_REQUIRED: "البريد الالكتروني مطلوب",
  COUNTRY_REQUIRED: "الدولة مطلوبة",
  CITY_REQUIRED: "المدينة مطلوبة",
  LANGUAGE_REQUIRED: "اللغة الأم مطلوبة",
  AGE_REQUIRED: "العمر مطلوب",
  GENDER_REQUIRED: "الجنس مطلوب",
  PASSWORD_REQUIRED: "كلمة المرور مطلوبة",
  DATE_OF_BIRTH_REQUIRED:
    "تاريخ الميلاد مطلوب ويجب ان يكون بالشكل التالي : YYYY-MM-DD",
  FCMTOKEN_REQUIRED: "fcmToken مطلوب",
  OS_REQUIRED: "os مطلوب",
  LAT_REQUIRED: "بالشكل الصحيح lat  مطلوب",
  LNG_REQUIRED: "بالشكل الصحيح lng مطلوب",
  ADDRESS_REQUIRED: "العنوان مطلوب",

  FIRST_NAME_MIN: " الاسم الاول يلزم بان يكون على الاقل ",
  LAST_NAME_MIN: " الاسم الأخير يلزم بان يكون على الاقل ",
  USER_NAME_MIN: " اسم المستخدم يلزم بان يكون على الاقل ",
  PASSWORD_MIN: " كلمة المرور تلزم بان تكون على الاقل ",

  TYPE_REQUIRED: "عنوان المجال مطلوب",
  INVALID_EMAIL: " البريد الالكتروني غير صحيح ",
  INVALID_DOB: "  تاريخ الميلاد غير صحيح ",

  ALL_REQUIRED: "جميع الحقول مطلوبة",
  WRONG_STATUS: "الرجاء ارسال حالة صحيحة",
  ACCEPTED_BEFORE : "عذرا .. تم قبول الطلب من قبل سائق اخر"
};

exports.getMessageOnLanguage = function (msgAr, msgEn, language) {
  if (language == LANGUAGE_ENUM.EN) {
    return msgEn;
  } else {
    return msgAr;
  }
};

exports.LANGUAGE_ENUM = LANGUAGE_ENUM;
exports.USER_TYPE = USER_TYPE;
exports.NOTIFICATION_TYPE = NOTIFICATION_TYPE;
exports.NOTIFICATION_TITILES = NOTIFICATION_TITILES;
exports.ACTORS = ACTORS;
exports.CONTROLLER_ENUM = CONTROLLER_ENUM;
exports.ORDER_STATUS = ORDER_STATUS;
exports.PASSENGER_STATUS = PASSENGER_STATUS
exports.PAYMENT_TYPE = PAYMENT_TYPE