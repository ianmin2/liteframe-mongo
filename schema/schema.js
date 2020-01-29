const mongoose   = require(`mongoose`);


const Schema 	 = mongoose.Schema;
const FKHelper   = require(`./helpers/FKHelper.js`);
const passportLocalMongoose = require('passport-local-mongoose');

/*
//!EMAIL VERIFICATION
const mailRegex = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/ig;

//!PASSWORD VERIFICATION
const passRegex = /^[-@./\!\$\%\^|#&,+\w\s]{6,50}$/ig;

//!USERNAME VERIFICATION
const userRegex = /^[a-z0-9_-]{4,16}$/ig;

//!TELEPHONE VERIFICATION
const telRegex  = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/igm;

//!IS FILLED VERIFICATION
const isFilled = /[.+]/ig;

//!IS MD5 REGEX 
const isMD5 = /^[a-f0-9]{32}$/gm;

//!IS BASE64 REGEX
const isBase64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$/ig;

*/
//--==========================================================================================================
//  Organization
const organizationSchema = new Schema({
    org_name : {
        type        : String,
        required    : [true, "An organization name is required"],
        unique      : [true, "An organization by that name has already been defined"]
    },
    org_telephone : {
        type        : String,
        validate: {
            validator: function(v) {
              return telRegex.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
        },
        unique      : [true, "An organization with that phone already exists"]
    },
    org_temail : {
        type        : String,
        validate: {
            validator: function(v) {
              return mailRegex.test(v);
            },
            message: props => `${props.value} is not a valid email address!`
        },
        unique      : [true, "An organization with that email already exists"]
    },
    org_code : {
        type        : String,
        required    : [true, "An organization code is required"],
        unique      : [true, "An organization with that access code already exists"]
    },
    org_added  : {
        type        : Date,
        default     : new Date(),
    },
    org_active  :
    {
        type        : Boolean,
        default     : true
    }

});
exports.Organization = mongoose.model("Organization",organizationSchema);

//--==========================================================================================================
//  Service
const serviceSchema = new Schema({
    service_name    :
    {
        type        : String,
        required    : [true, "A service name is required"],
        unique      : [true, "A service bt that name already exists"]
    },
    service_fee     : 
    {
        type        : Number,
        required    : [true, "A service fee has to be defined"]
    },
    service_code    :
    {
        type        : String,
        required    : [true, "A service code is required"],
        unique      : [true, "A unique service code is required"],

    },
    service_added   :
    {
        type        : Date,
        default     : new Date(),
    },
    service_active  : 
    {
        type        : Boolean,
        default     : true, 
    },
});
exports.Service = mongoose.model("Service",serviceSchema);

//--==========================================================================================================
//  Subscription
const subscriptionSchema = new Schema({
    sub_org         :
    {
        type        : Number,
        required    : [true,"A subscription organization is required."],
    },
    sub_service     :
    {
		type: Schema.ObjectId,
		ref: 'Service',
		validate: {
			isAsync: true,
			validator: function(v) {
				return FKHelper(mongoose.model('Service'), v);
			},
			message: `The provided service does not exist.`
		}
	},
    sub_added   :
    {
        type        : Date,
        default     : new Date(),
    },
    sub_active  : 
    {
        type        : Boolean,
        default     : true, 
    },
});
exports.Subscription = mongoose.model("Subscription",subscriptionSchema);

//--==========================================================================================================
//  PaymentMethod
const paymentMethodSchema = new Schema({
    pay_method_name   :
    {
        type        : String,
        required    : [true, "A Payment method name is required."],
        unique      : [true, "That payment method already exists"]
    },
    pay_method_fee  : 
    {
        type        : Number
    },
    pay_method_added   :
    {
        type        : Date,
        default     : new Date(),
    },
    pay_method_active  : 
    {
        type        : Boolean,
        default     : true, 
    },
});
exports.PaymentMethod = mongoose.model("PaymentMethod",paymentMethodSchema);

//--==========================================================================================================
//  Payment
const paymentSchema = new Schema({
    pay_org     :
    {
		type: Schema.ObjectId,
		ref: 'Organization',
		validate: {
			isAsync: true,
			validator: function(v) {
				return FKHelper(mongoose.model('Organization'), v);
			},
			message: `The provided Organization does not exist.`
		}
    },
    pay_amount      :
    {
        type        : Number,
    },
    pay_method     :
    {
		type: Schema.ObjectId,
		ref: 'PaymentMethod',
		validate: {
			isAsync: true,
			validator: function(v) {
				return FKHelper(mongoose.model('PaymentMethod'), v);
			},
			message: `The provided Payment Method does not exist.`
		}
    },
    pay_services    :
    [{      
        type: Schema.ObjectId,
        ref: 'Service',
        validate: {
            isAsync: true,
            validator: function(v) {
                return FKHelper(mongoose.model('Service'), v);
            },
            message: `The provided Service does not exist.`
        }        
    }],
    pay_token       : 
    {
        type        : String,
        required    : [true, "A payment token is required"]
    },
    pay_message     :
    {
        type        : String,
    },
    pay_added       :
    {
        type        : Date,
        default     : new Date(),
    },
    pay_active  : 
    {
        type        : Boolean,
        default     : true, 
    },
});
exports.Payment = mongoose.model("Payment",paymentSchema);

//--==========================================================================================================
//  Member
const memberSchema = new Schema({
    name :
    {
        first   : {
            type        : String,
            required    : [true, "A first name is required"]
        }, 
        last    : {
            type        : String,
        },
    },
    account :
    {
        name   : {
            type        : String,
            unique      : [true, "An account by that name already exists"],
        }, 
        balance    : {
            type        : Number,
            default     : 0,
        },
    },
    organization     :
    {
		type: Schema.ObjectId,
		ref: 'Organization',
		validate: {
			isAsync: true,
			validator: function(v) {
				return FKHelper(mongoose.model('Organization'), v);
			},
			message: `The provided Organization does not exist.`
		}
    },
    email           : 
    {
        type        : String,
        validate: {
            validator: function(v) {
              return mailRegex.test(v);
            },
            message: props => `${props.value} is not a valid email address!`
        },
        unique      : [true, "A user with that email already exists"]
    },
    password        :
    {
        type        : String,
        required    : [true, "A user password is required"],
        validate    : 
        {
            validator : v => passRegex.test(v),
            message   : "The given password does not subscribe to the password template rules",
        }
    },
    //role -- {'audit','client','admin'}
    role        :
    {
        type        : String,
        default     : 'client',
		// type: Schema.ObjectId,
		// ref: 'Organization',
		// validate: {
		// 	isAsync: true,
		// 	validator: function(v) {
		// 		return FKHelper(mongoose.model('Organization'), v);
		// 	},
		// 	message: `The provided Organization does not exist.`
		// }
    },
    telephone           : 
    {
        type        : String,
        validate: {
            validator: function(v) {
              return telRegex.test(v);
            },
            message: props => `${props.value} is not a valid phone number`
        },
        unique      : [true, "A user with that phone number already exists"]
    },
    joined   :
    {
        type        : Date,
        default     : new Date(),
    },
    active  : 
    {
        type        : Boolean,
        default     : true, 
    },
});
memberSchema.plugin(passportLocalMongoose, {
    saltlen             : 64,
    iterations          : 25000,
    keylen              : 512,
    maxInterval         : 150000,
    usernameField       : "email",
    lastLoginField      : "last_login",
    usernameLowerCase   : true,
    limitAttempts       : true,
    maxAttempts         : 12,
    usernameQueryFields : ["account.name"],
});
exports.Member = mongoose.model("Member",memberSchema);

//--==========================================================================================================
//  PasswordRecovery
const passwordRecoverySchema = new Schema({

    member    :
    {
		type: Schema.ObjectId,
		ref: 'Member',
		validate: {
			isAsync: true,
			validator: function(v) {
				return FKHelper(mongoose.model('Member'), v);
			},
			message: `The provided member does not exist.`
		}
    },
    recovery_key        :
    {
        type        : String,
        required    : [true,"A password recovery token is required."]
    },

    requested   :
    {
        type        : Date,
        default     : new Date(),
    },
    used        :
    {
        type        : Boolean,
        default     : false,
    },
    used_at     :
    {
        type        : Date,
    }
});
exports.PasswordRecovery = mongoose.model("PasswordRecovery",passwordRecoverySchema);

//--==========================================================================================================
//  Group
const groupSchema = new Schema({
    group_name : {
        type        : String,
        required    : [true, "A group name is required"],
        unique      : [true, "A group by that name has already been defined"]
    },
    group_organization    :
    {
		type: Schema.ObjectId,
		ref: 'Organization',
		validate: {
			isAsync: true,
			validator: function(v) {
				return FKHelper(mongoose.model('Organization'), v);
			},
			message: `The provided organization does not exist.`
		}
    },
    group_added   :
    {
        type        : Date,
        default     : new Date(),
    },
    group_active  : 
    {
        type        : Boolean,
        default     : true, 
    },
});
exports.Group = mongoose.model("Group",groupSchema);

//--==========================================================================================================
//  GroupMembers
const groupMemberSchema = new Schema({
    mem_name : {
        type        : String,
        required    : [true, "A member name is required"],
    },
    mem_user        :
    {
        type        : String,
    },

    mem_group    :
    {
		type: Schema.ObjectId,
		ref: 'Group',
		validate: {
			isAsync: true,
			validator: function(v) {
				return FKHelper(mongoose.model('Group'), v);
			},
			message: `The provided group does not exist.`
		}
    },
    mem_email           : 
    {
        type        : String,
        validate: {
            validator: function(v) {
              return mailRegex.test(v);
            },
            message: props => `${props.value} is not a valid email address!`
        },
    },
    mem_phone           : 
    {
        type        : String,
        validate: {
            validator: function(v) {
              return mailRegex.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
        },
    },
    mem_added   :
    {
        type        : Date,
        default     : new Date(),
    },
    mem_active  : 
    {
        type        : Boolean,
        default     : true, 
    },
});

/* 
    dropped due to absence of null restrictions 
groupMemberSchema.index({
    mem_user: 1, mem_group: 1
}, {
    unique : [true, "That username is already registered to the group."]
});
*/

groupMemberSchema.index({
    mem_email: 1, mem_group: 1
}, {
    unique : [true, "That email address is already registered to the group."]
});

groupMemberSchema.index({
    mem_phone: 1, mem_group: 1
}, {
    unique : [true, "That phone number is already registered to the group."]
});
exports.GroupMember = mongoose.model("GroupMember",groupMemberSchema);

//--==========================================================================================================
//  Template
const templateSchema = new Schema({
    t_name : {
        type        : String,
        required    : [true, "A template name is required"],
        unique      : [true, "A template by that name has already been defined"]
    },
    t_organization    :
    {
		type: Schema.ObjectId,
		ref: 'Organization',
		validate: {
			isAsync: true,
			validator: function(v) {
				return FKHelper(mongoose.model('Organization'), v);
			},
			message: `The provided organization does not exist.`
		}
    },
    t_added   :
    {
        type        : Date,
        default     : new Date(),
    },
    t_active  : 
    {
        type        : Boolean,
        default     : true, 
    },
});
exports.Template = mongoose.model("Template",templateSchema);

//--==========================================================================================================
//  Log
const logSchema = new Schema({
    log_summary     : 
    {
        type        : Schema.Types.Mixed,
    },
    log_organization    :
    {
		type: Schema.ObjectId,
		ref: 'Organization',
		validate: {
			isAsync: true,
			validator: function(v) {
				return FKHelper(mongoose.model('Organization'), v);
			},
			message: `The provided organization does not exist.`
		}
    },
    log_reference   :
    {
        type        : String,
    },
    log_balance     :
    {
        type        : Number
    },
    log_added       :
    {
        type        : Date,
        default     : new Date(),
    },
    log_active      : 
    {
        type        : Boolean,
        default     : true, 
    },
});
exports.Log = mongoose.model("Log",logSchema);

/*
//--==========================================================================================================
//--==========================================================================================================
//  SMS RELATED

//@ SMSTag
const SMSTagSchema = new Schema({

    _added   :
    {
        type        : Date,
        default     : new Date(),
    },
    _active  : 
    {
        type        : Boolean,
        default     : true, 
    },
});
exports.SMSTag = mongoose.model("SMSTag",SMSTagSchema);

//--==========================================================================================================
//@ SMSContact

const SMSContactSchema = new Schema({

    _added   :
    {
        type        : Date,
        default     : new Date(),
    },
    _active  : 
    {
        type        : Boolean,
        default     : true, 
    },
});
exports.SMSContact = mongoose.model("SMSContact",SMSContactSchema);

//--==========================================================================================================
//@ SMSRecipient

const SMSRecipientSchema = new Schema({

    _added   :
    {
        type        : Date,
        default     : new Date(),
    },
    _active  : 
    {
        type        : Boolean,
        default     : true, 
    },
});
exports.SMSRecipient = mongoose.model("SMSRecipient",SMSRecipientSchema);

//--==========================================================================================================
//@ SMSMessageType

const SMSMessageTypeSchema = new Schema({

    _added   :
    {
        type        : Date,
        default     : new Date(),
    },
    _active  : 
    {
        type        : Boolean,
        default     : true, 
    },
});
exports.SMSMessageType = mongoose.model("SMSMessageType",SMSMessageTypeSchema);

//--==========================================================================================================
//@ SMSCampaign

const SMSCampaignSchema = new Schema({

    _added   :
    {
        type        : Date,
        default     : new Date(),
    },
    _active  : 
    {
        type        : Boolean,
        default     : true, 
    },
});
exports.SMSCampaign = mongoose.model("SMSCampaign",SMSCampaignSchema);

//--==========================================================================================================
//@ SMSTemplate

const SMSTemplateSchema = new Schema({

    _added   :
    {
        type        : Date,
        default     : new Date(),
    },
    _active  : 
    {
        type        : Boolean,
        default     : true, 
    },
});
exports.SMSTemplate = mongoose.model("SMSTemplate",SMSTemplateSchema);

//--==========================================================================================================
//@ SMSContactTag

const SMSContactTagSchema = new Schema({

    _added   :
    {
        type        : Date,
        default     : new Date(),
    },
    _active  : 
    {
        type        : Boolean,
        default     : true, 
    },
});
exports.SMSContactTag = mongoose.model("SMSContactTag",SMSContactTagSchema);
*/