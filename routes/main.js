let auth            = express.Router();

let authenticate    = framify.schema.Member.authenticate();

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
         
            //# clear the plaintext password
            if( params.password2 )
            {
                delete params.password2; 
            }
          

            //# Perform the actual registration
            Member.register(params, params.password)
            .then(function(m_info){
        
                let mem = m_info._doc;

                mem.salt         = undefined;
                mem.hash         = undefined;
                mem.__v          = undefined;
                mem.attempts     = undefined;
                
                //# Create the auth token
                var token = jwt.sign( mem, framify.config.secret, { expiresIn: 36000000000000, issuer: myAddr } )

                //# Issue the authentication token
                res.json( make_response( 200, { token: `JWT ${token}`, key: "BBD14E65-5B05-E611-9411-7427EA2F7F59", me : mem }, { 
                                                                            role:           mem.role
                                                                            ,member_id:     mem._id
                                                                            ,member_name:   { first: mem.name.first, last: mem.name.last  }
                                                                        } ) );
        
                /*
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

                //@ Send the user an email
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

                */
        
            })
            .catch(error => 
            {
                log(`Failed to register the user ${params.name.first}.\n\t\t\t\t${str(error.message)}`.err);
                res.status(500).json( make_response( 500, error.message) );
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

        if( isDefined(req.body, "email,password") || isDefined(req.body,"username,password") )
        {

            //# Keep a copy of the username [with contingency]
            let username = (req.body.email) ? req.body.email : req.body.username; 
           

            var authenticate = Member.authenticate();
           
            //# perform authentication against the provided credentials
            authenticate(username, req.body.password, function(err, result) {
                //# catch errors
                if (err) 
                {
                    log(`Auth error for ${username}:\n${err.message}`) 
                    res.status(417).send( make_response( 417, "Not all required authentication credentials were provided.") );
                }
                //# Issue the user a definitive JWT
                // Value 'result' is set to false. The user could not be authenticated since the user is not active
                else if(result)
                {
                    //# Clear the unnecessary fields
                    result.salt         = undefined;
                    result.hash         = undefined;
                    result.__v          = undefined;
                    result.attempts     = undefined;
                    
                    //# Create the auth token
                    var token = jwt.sign( result, framify.config.secret, { expiresIn: 36000000000000, issuer: myAddr } )

                    //# Issue the authentication token
                    res.json( make_response( 200, { token: `JWT ${token}`, key: "BBD14E65-5B05-E611-9411-7427EA2F7F59", me : result }, { 
                                                                                role:           result.role
                                                                                ,member_id:     result._id
                                                                                ,member_name:   { first: result.name.first, last: result.name.last  }
                                                                            } ) );

                }
                //# Inform the user of the mishap
                else
                {
                    res.status(401).send( make_response( 401, realError.message,req.body ) );
                    console.dir(realError);
                }
                
            });

        }
        else
        {

            res.status(417).send( make_response( 417, "Not all required authentication credentials were provided.") );

        }

    });

    // //@ SAMPLE PROTECTED ROUTE THAT RETURNS THE LOGED IN USER'S INFORMATION
    // auth.route('/me')
    // .all( function(req,res)
    // {

    //     // console.log(`Attempting a profile data fetch`.info)        
    //     $connection.query(`SELECT * FROM vw_members WHERE email=$1 AND role=$2 AND active=$3`,[req.whoami.email,req.whoami.role,1])
    //     .then(memberRecord => 
    //     {

    //         try
    //         { 

    //             if(memberRecord[0]){
                
    //                 let l = clone( memberRecord[0] );
    //                 l.password      = undefined;
    //                 l._id           = undefined;
    //                 l.__v           = undefined;    
                    
        
    //                 res.json( make_response(200, l) );
    
    //             }
    //             else
    //             {
    //                 res.status(401).json(make_response(401,`The user ${req.whoami.email} is an intruder`),'logout');
    //             }
    
    //         }
    //         catch(e)
    //         {
    //             res.status(401).json(make_response(401,`The user ${req.whoami.email} is an intruder`));
    //         }
            
           

    //     })
    //     .catch(e=>
    //     {
    //         res.status(500).send( make_response(500, e.message) );
    //     });

    // });

    // auth.use('/passwords', require('./password-recovery.js'));
   
    module.exports =  auth;