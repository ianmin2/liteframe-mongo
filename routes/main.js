let auth       = express.Router();


    //@ User PRE - REGISTRATION MIDDLEWARE
    var preventRegistrationSpoofing = function(req,res,next)
    {

        //@ Ensure that only authorized parties can create users
        if( req.whoami.organization != req.body.organization && req.whoami.organization != 1 )
        {
            res.status(403).json(make_response(403,`You don't qualify to add users to the organization ${req.body.organization}`));
        }
        //@ Handle other validations
        else
        {
            //@ Ensure that only administrative users can create fellow administrative users
            if( req.body.role === "admin"  )
            {
                
                try
                {
                    //@ Ensure that the trying party is also an administrator
                    if(  req.whoami.role === "admin"  )
                    {

                    next();
                        
                    }
                    else
                    {
                        res.status(403).json( make_response( 403, "You do not meet the minimum requirements to create an administrative user." ) );
                    }

                }
                catch(e)
                {
                    console.log(e.message);
                    res.status(401).send( make_response( 401, "Please login to continue" ) );
                }

            }else{
                next();
            }
        }
        

    };

    auth.route('/')
    .all((req,res) => 
    {
        res.send(make_response(200,'OK'));
    })


    //@ REGISTER NEW USERS
    auth.route("/register")
    .post( preventRegistrationSpoofing, (req,res) => 
    {

        console.log(`Attempting a registration`.info);

        //@ 
        var params = get_params(req);
        let required_fields = "password,email,role,telephone,name.first,account.name,organization";

        if( isDefined(params, required_fields) )
        {
         
            if( params.password2 )
            {
                delete params.password2; 
            }
            params.password = crypt.md5(params.password);


            // c_log("\n\n")
            // console.log( $query )
            // c_log($field_params)
            // c_log("\n\n")
                


            $connection.query($query,$field_params)
            .then(inserted =>
            {
                log(`${inserted}`.succ);
                log(`Registered the user ${params["email"]}`.succ);

                //@ Welcome the user to the by SMS platform 
                // mysms.one( { 
                //     to:params.telephone, 
                //     text: 
                //     `Jambo ${params['name.first']}!\nWelcome to framify!\nYou may now login https://${myAddr}:${app.port}`
                // } ,{ 
                //     'user.name': 'userAdmin', 
                //     'organization': 1, 
                //     'name.first': 'SYSTEM ROBOT ADMINISTRATOR', 
                //     'email': 'sms@bixbyte.io',
                //     'telephone':'+254725678447'
                // })
                // .then(()=>{
                //     // j_log(a)
                //     log(`Successfully sent a welcome SMS to the user ${params['name.first']} (${params.telephone})`.succ);
                //     res.json(make_response(200, `Successfully registered ${params['name.first']}.`, params))
                // })
                // .catch(e=>{
                //     c_log(`\n================================================\nERROR AT USER REGISTRATION SMS`.error)
                //     j_log(e)
                //     c_log(`\n================================================\n`.error)
                //     log(`Failed to send a welcome SMS to the user ${params['name.first']} (${params.telephone})`.err);
                //     res.json(make_response(200, `Successfully registered ${params['name.first']}.`, params))
                // })
               

                //@ Send a welcome message

                //@ Fetch the welcome html template 
                let template = fs.readFileSync( path.join( __dirname,`./templates/welcome/welcome.html`), 'utf8');

                //@ Replace the template strings with the proper fetched data
                template = template.replace(/{{user}}/ig, `${params["name.first"]}`)
                    .replace(/{{user_account}}/ig, `${params["account.name"]}`)
                    .replace(/{{portal_url}}/ig, `https://sms.jambopay.co.ke`)
                    .replace(/{{user_email}}/ig, params.email)
                    .replace(/{{user_telephone}}/ig,params.telephone)
                    .replace(/{{account_type}}/ig, (params.role == 'admin') ? 'n administrator' : ' support user' )

                //@ Format the mail object for sending
                let mailObj = {
                    from:config.email.accounts.welcome,
                    to: params.email,
                    subject: 'Welcome to the Jambopay SMS Dashboard',
                    html: template
                }

                //@ Send the user a recovery email
                if (sendMail) {

                    sendMail(mailObj)
                        .then(msg => {
                            log(`Successfully sent  a welcome email to ${params.email}`.yell)
                            res.json( make_response( 200, `Successfully registered ${params['name.first']}.`) );
                        })
                        .catch(err => {
                            log(`Something went wrong when trying to send a  welcome email to ${str(params)}`.err)
                            errorEmail({ message: `Failed to send a welcome email to the user <br><br>${str(params)}`, details: err })
                            res.json( make_response( 200, `Successfully registered ${params['name.first']}.`) );
                        })

                } else {

                    log(`This server does not seem to be configured for email sending!!`.err)
                    // errorEmail(`The application server at ${myAddr} is not configured for mail sending!`)
                    res.json( make_response( 200, `Successfully registered ${params['name.first']}.`) );
                }





            })
            .catch(error => 
            {
                log(`Failed to register the user ${params['name.first']}.\n\t\t\t\t${str(error.message)}`.err);
                // console.dir(error.message)
                res.status(500).json( make_response( 500, `Failed to record the user`, error.message) );
            });
            
        }
        else
        {  
            
            res.status(412).json( make_response(412, "Please ensure that all required fields are provided.", required_fields.split(',')) );        
                        
        }
                
    });

    //@ AUTHENTICATE THE USER AND ISSUE A jwt
    auth.route("/verify")
    .all( (req,res) => 
    {

        console.log(`Attempting a login`.info);

        req.body = get_params( req );

        if( isDefined(req.body, "email,password") )
        {

            $connection.query(`SELECT * FROM vw_members WHERE email=$1`,[req.body.email])
            .then(user=>
            {

                if(!user[0])
                {
                    res.status(401).send( make_response( 401, "No such user was found",req.body ) );
                }
                else if( !user[0].active )
                {
                    res.status(401).send( make_response( 401, "Your account has been terminated.<br>Please consult an administrator for assistance.",req.body.email ) );
                }
                else
                {

                    var memba = user[0];

                    $connection.query(`SELECT * FROM vw_user_permissions WHERE member_id=${memba.member_id}`)
                    .then( d => 
                    {
                        let usr     = ( d[0] != undefined ) ? d[0].roles   : "";
                        let orgs    = ( d[0] != undefined ) ? d[0].role_id : "";
                        memba.roles = usr;
                        memba.organizations = orgs;
                    })
                    .catch( err =>
                    {
                        log( `USER PERMISSION FETCH ERROR: \n\t${err.message}`.err );
                    })
                    .then( (ab) =>
                    {

                        if(memba.password.toUpperCase() == crypt.md5(req.body.password).toUpperCase())
                        {

                            memba.password          = undefined;
                            memba.transactions      = undefined;

                            var token = jwt.sign( memba, config.secret, { expiresIn: 36000000000000, issuer: myAddr } )



                            res.json( make_response( 200, { token: `JWT ${token}`, key: "BBD14E65-5B05-E611-9411-7427EA2F7F59", me : memba }, { 
                                                                                        role:           memba.role
                                                                                        ,member_id:     memba.member_id
                                                                                        ,member_name:   { first: memba["name.first"], last: memba["name.last"]  }
                                                                                    } ) );


                        }
                        else
                        {

                            res.status(401).send( make_response( 401, "Password does not match.", { code : crypt.md5( req.body.password ) } ) );

                        }

                    })
                    

                    

                }

            });


        }
        else
        {

            res.status(417).send( make_response( 417, "Not all required authentication credentials were provided.") );

        }

    });

    //@ SAMPLE PROTECTED ROUTE THAT RETURNS THE LOGED IN USER'S INFORMATION
    auth.route('/me')
    .all( function(req,res)
    {

        // console.log(`Attempting a profile data fetch`.info)        
        $connection.query(`SELECT * FROM vw_members WHERE email=$1 AND role=$2 AND active=$3`,[req.whoami.email,req.whoami.role,1])
        .then(memberRecord => 
        {

            try
            { 

                if(memberRecord[0]){
                
                    let l = clone( memberRecord[0] );
                    l.password      = undefined;
                    l._id           = undefined;
                    l.__v           = undefined;    
                    
        
                    res.json( make_response(200, l) );
    
                }
                else
                {
                    res.status(401).json(make_response(401,`The user ${req.whoami.email} is an intruder`),'logout');
                }
    
            }
            catch(e)
            {
                res.status(401).json(make_response(401,`The user ${req.whoami.email} is an intruder`));
            }
            
           

        })
        .catch(e=>
        {
            res.status(500).send( make_response(500, e.message) );
        });

    });

    auth.use('/passwords', require('./password-recovery.js'));
   
    module.exports =  auth;