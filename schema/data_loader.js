import { Organization, Group, Service, PaymentMethod, Payment, Subscription, GroupMember, Template } from "./schema";  //Missing MetaData [intentionally left to prevent application manipulation]
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
        }).then(d=>c_log(`\nService subscriptions initialized.\n`));

        //# Load the initial mock payment
        Payment.create({
            pay_org             : org,
            pay_amount          : 10,
            pay_method          : pay,
            pay_services        : [serv],
            pay_message         : '10 logged Complementary SMS messages',
            pay_token           : 'bixbyte'
        }).then(d=>c_log(`\nservice payments initialized.\n`));


    })
    .then(d=>c_log(`\nServices and related entities initialized.\n`));

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
    ]).then(d=>c_log(`\nTemplates initialized.\n`));


})
.then(d=>c_log(`\nDatabase Initialization complete.\n`.succ));

