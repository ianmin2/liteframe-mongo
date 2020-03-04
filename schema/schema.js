const mongoose   = require(`mongoose`);


const Schema 	 = mongoose.Schema;
const FKHelper   = require(`./helpers/FKHelper.js`);
const passportLocalMongoose = require('passport-local-mongoose');


//!EMAIL VERIFICATION
const mailRegex = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|io|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/ig;

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
              return /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/igm.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
        },
        unique      : [true, "An organization with that phone already exists"]
    },
    org_temail : {
        type        : String,
        validate: {
            validator: function(v) {
              return /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|io|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/ig.test(v);
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
const Organization = mongoose.model("Organization",organizationSchema);


exports.Organization = Organization;

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
const Service   = mongoose.model("Service",serviceSchema); 
exports.Service = Service;

//--==========================================================================================================
//  Subscription
const subscriptionSchema = new Schema({
    sub_org         :
    {
		type: String,
		ref: 'Organization',
		validate: {
			isAsync: true,
			validator: function(v) {
				return FKHelper(mongoose.model('Organization'), v);
			},
			message: `The provided Organization does not exist.`
		}
    },
    sub_service     :
    {
		type: String,
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
const Subscription      = mongoose.model("Subscription",subscriptionSchema);


exports.Subscription = Subscription;

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

const PaymentMethod = mongoose.model("PaymentMethod",paymentMethodSchema);


exports.PaymentMethod = PaymentMethod;

//--==========================================================================================================
//  Payment
const paymentSchema = new Schema({
    pay_org     :
    {
		type: String,
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
		type: String,
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
        type: String,
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

paymentSchema.index({
    pay_org     : 1,
    pay_token   : 1,
}, {
    unique      : [true, "That payment has already been effected. Please contact support for assistance"],
    name        :  "unique payment token per scope"
});


const Payment = mongoose.model("Payment",paymentSchema);


exports.Payment = Payment;

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
		type: {},
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
              return /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|io|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/ig.test(v);
            },
            message: props => `${props.value} is not a valid email address!`
        },
        unique      : [true, "A user with that email already exists"]
    },
    password        :
    {
        type        : String,
        // required    : [true, "A user password is required"],
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
		// type: String,
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
              return /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/igm.test(v);
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
    TooManyAttemptsError: "Account locked due to too many failed login attempts; consult admin for unlocking."
});

const Member = mongoose.model("Member",memberSchema);
//# Load the main member
// Member.register({
//     "name.first"        : 'User',
//     "name.last"         : 'Administrator',
//     "account.name"      : 'userAdmin',
//     email               : 'useradmin@bixbyte.io',
//     role                : 'admin',
//     telephone           : '0725678447',
//     organization        : 
// }, 'ianmin2')
// .catch(console.dir);




exports.Member = Member;

//--==========================================================================================================
//  PasswordRecovery
const passwordRecoverySchema = new Schema({

    member    :
    {
		type: String,
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
    },
    group_organization    :
    {
		type: String,
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

//# define a much needed composite key
groupSchema.index({
    group_name : 1,
    group_organization : 1,
}, {
    unique      : [true, "A group by that name has already been defined for the defined scope"],
    name        : "unique group name per scope"
});

const Group     = mongoose.model("Group",groupSchema);



exports.Group   =  Group;

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
		type: String,
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
              return /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|io|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/ig.test(v);
            },
            message: props => `${props.value} is not a valid email address!`
        },
    },
    mem_phone           : 
    {
        type        : String,
        validate: {
            validator: function(v) {
              return /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/igm.test(v);
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
    unique : [true, "That email address is already registered to the group."],
    name   : "unique email address per group"
});

groupMemberSchema.index({
    mem_phone: 1, mem_group: 1
}, {
    unique : [true, "That phone number is already registered to the group."],
    name    : "unique phone number per group"
});

const GroupMember   = mongoose.model("GroupMember",groupMemberSchema);


exports.GroupMember = GroupMember;

//--==========================================================================================================
//  Template
const templateSchema = new Schema({
    t_name : {
        type        : String,
        required    : [true, "A template name is required"],       
    },
    t_content       : {
        type        : mongoose.Schema.Types.Mixed,
    },
    t_organization    :
    {
		type: String,
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

templateSchema.index({
    t_name: 1, t_organization: 1
}, {
    unique      : [true, "A template by that name has already been defined for the current context."],
    name        : "unique template name per scope"
});


const Template   = mongoose.model("Template", templateSchema);



exports.Template = Template;

//--==========================================================================================================
//  Log
const logSchema = new Schema({
    log_summary     : 
    {
        type        : Schema.Types.Mixed,
    },
    log_organization    :
    {
		type: String,
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

//--==========================================================================================================
// Metadata

const MetaDataSchema = new Schema({
    member          :
    {
		type: String,
		ref: 'Member',
		validate: {
			isAsync: true,
			validator: function(v) {
				return FKHelper(mongoose.model('Member'), v);
			},
			message: `The provided member does not exist.`
		}
    },
    organization    : 
    {
		type: String,
		ref: 'Organization',
		validate: {
			isAsync: true,
			validator: function(v) {
				return FKHelper(mongoose.model('Organization'), v);
			},
			message: `The provided organization does not exist.`
		}
    },
    added           : 
    {
        type        : Date,
        default     : new Date(),
    },
});
const MetaData = mongoose.model("Metadata",MetaDataSchema);
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


//--==========================================================================================================
//--==========================================================================================================
//--==========================================================================================================
//# Perform database initialization [where applicable]




//# Define the main organization
Organization.create({    
    org_name        : "Bixbyte Solutions",
    org_telephone   : "+254725678447",
    org_email       : "info@bixbyte.io",
    org_code        : "pm_bx_001"
})
.then(function(res){

    c_log(`Initializing database schema`.info)

    let org = res._doc._id;

    //# Load the main member
    Member.register({
        "name.first"        : 'User',
        "name.last"         : 'Administrator',
        "account.name"      : 'userAdmin',
        email               : 'useradmin@bixbyte.io',
        role                : 'admin',
        telephone           : '0725678447',
        organization        : org
    }, 'ianmin2')
    .then(function(m_info){

        let mem = m_info._doc._id;

        //# Load the application power entities
        MetaData.create({
            organization    : org,
            member          : mem
        }).then(d=>c_log(`\nApplication registry initialized.\n`.succ));

    })
    .then(d=>c_log(`\nMain Member initialized.\n`.succ));


    
    //# Load the main organization groups
    Group.insertMany([
        {
            group_name          : 'Auxiliary',
            group_organization  : org
        },
        {
            group_name          : 'Staff',
            group_organization  : org
        },
        {
            group_name          : 'Executive',
            group_organization  : org
        },
    ])
    .then(function(g_info){
        let grp = g_info[2]._doc._id

        GroupMember.create({
            mem_name        : 'Ian Innocent',
            mem_group       : grp,
            mem_phone       : '0725678447',
            mem_email       : 'ianmin2@live.com',
            mem_user        : 'ianmin2'
        }).then(d=>c_log(`\nGroup Members initialized.\n`.succ));

    })
    .then(d=>c_log(`\nGroups and related entities initialized.\n`.succ));

    //# Load the main Payment methods
    PaymentMethod.insertMany([
        {
            pay_method_name     : "Card"
        },
        {
            pay_method_name     : "Mpesa"
        },
        {
            pay_method_name     : "Cash"
        },
        {
            pay_method_name     : "Cheque"
        },
    ])
    .then(function(pay_meth){
        let pay = pay_meth[0]._doc._id;

          //# Load the main service
    Service.create({
        service_name    : 'SMS',
        service_fee     : 1,
        service_code    : 'BX_SMS',   
    })
    .then(function(serv_dat){

        let serv = serv_dat._doc._id;

        //# Load the initial service subscription
        Subscription.create({
            sub_org         : org,
            sub_service     : serv
        }).then(d=>c_log(`\nService subscriptions initialized.\n`.succ));

        //# Load the initial mock payment
        Payment.create({
            pay_org             : org,
            pay_amount          : 10,
            pay_method          : pay,
            pay_services        : [serv],
            pay_message         : '10 logged Complementary SMS messages',
            pay_token           : 'bixbyte'
        }).then(d=>c_log(`\nservice payments initialized.\n`.succ));


    })
    .then(d=>c_log(`\nServices and related entities initialized.\n`.succ));

    })
    .then(d=>c_log(`\nPayment methods  and related entities initialized.\n`.succ));

  


    //# Load the mock templates
    Template.insertMany([
        {
            t_name          : 'One',
            t_content       : 'The main template is this',
            t_organization  : org
        },
        {
            t_name          : 'Two',
            t_content       : 'This is but a sample template. Edit it as you see fit',
            t_organization  : org
        }
    ]).then(d=>c_log(`\nTemplates initialized.\n`.succ));


})
.then(d=>c_log(`\nDatabase Initialization complete.\n`.succ))
.catch(e=>{})
// .finally(d=>{
//     c_log(`\n\n\nTesting authentication`.yell)
   

//     var authenticate = Member.authenticate();
//     authenticate('useradmin@bixbyte.io', 'ianmin2', function(err, result,realError) {
//         if (err) { c_log(err) }
//         if(result){
//             console.log('Loged in'.succ);
//             result.salt         = undefined;
//             result.hash         = undefined;
//             result.__v          = undefined;
//             result.attempts     = undefined;
//             console.log(result);
//         }
//         else
//         {

//             // const user = new DefaultUser({username: 'useradmin@bixbyte.io'});

//             console.log(`Authentication failed`.err)
//             console.dir(realError.message);
//         }
//         // Value 'result' is set to false. The user could not be authenticated since the user is not active
//     });


// });