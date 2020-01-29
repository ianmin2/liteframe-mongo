//@ Framify Security Middleware Definition
const framifySecurity = function(req, res, next) {
   

    let payload = req.headers.authorization || req.headers.Authorization;
    
    // c_log(`\n\nAUTHORIZATION TRIGGERED:\n`);
    // // j_log(payload);
    // j_log(get_params(req));
    // c_log(`\n\n`);
        
    if( payload && payload.match(/^Bearer/i) ==null && payload != "null" ){
        req.whoami =   json( crypt.base64_decode( ( payload.replace(/JWT /ig, '').split(".")[1]) ) );  
    }else{
        req.whoami = {};
    }
    req.whoami.remote = req.header('x-forwarded-for') || req.connection.remoteAddress;
    req.role = (payload) ? req.whoami.role : "guest";

    //@ JS configuration file filter
    let isConfig = /^\/config\/[A-Za-z0-9\*\!\-\_\%]+(.conf|.config|.js|.ts|.es6)$/ //.*\/(.*)\.(.*)
    let isSchema = /^\/schema\/*/;
    let isRoutes = /^\/routes\/*/;
    let isServer = /^\/server\/*/;

    let isDb = /^\/db\/*/;
    let isPhp = /^\/php\/*/;

    /**
    * SO - MADNESS

        let isChart     = /^\/sms\/* /;
        let d  = get_params(req);
        try
        { 
            if(isChart.test(req.path) && d.command.toLowerCase() == "get" && d.table.toLowerCase() == "vw_general_stats" )
            {
            
                console.log(`\n\n@ general stats proxy\n`.info);
                
                let ata = ( userdata["roles"]  ) ?  userdata["roles"].split(',') : userdata["organization_name"];
                if( Array.isArray($ata) ) 
                {
                    ata.push(`${userdata['organization_name']}`);
                } 

                //@ THENABLE
                addExtras("sender",ata, params)
                .then(finalizeRequest)
                .then(a=>{

                    var request = require('request'); // npm install request

                    // app.post('^*$', function(req, res) {
                    //     request({ url: 'http://remoteserver.com' + req.path, headers: req.headers, body: req.body }, function(err, remoteResponse, remoteBody) {
                    //         if (err) { return res.status(500).end('Error'); }
                    //         res.writeHead(...); // copy all headers from remoteResponse
                    //         res.end(remoteBody);
                    //     });
                    // });
                    res.send(make_response(200,a));
                })
                .catch(e=>res.status(500).json(make_response(500,e.message)))
                                
                
                c_log(`\n\n@ triggered db handler for ${str(d.table)}\n\n`.err);
            }
        }
        catch(e){}
    * EO - MADNESS 
    */


    // console.dir(`${req.path}  == ${isConfig.test(req.path)}`)

    // console.dir(req.path)

    //@ HANDLE SPECIAL PATHS
    if ((isDb.test(req.path) || isPhp.test(req.path))) {

        let pars = get_params(req);



        //@ remove unnecessary spaces from the provided command
        pars.command = (pars.command) ? pars.command.replace(/\s/ig,'') : "";

        c_log(`\n\n\nDB PARAMS`)
        j_log(pars);
        c_log("\n\n\n");


        //@ ENSURE THAT THE REQUIRED PARAMETERS ARE DEFINED
        if (isDefined(pars, ["command", "table"])) {

            //@ DON'T SCRUTINIZE BACKUP REQUESTS
            if (pars.command == "backup") {
                next();
            } else {

                //@ CONSTRUCT A PATH FORBIDDER
                let forbidden = {
                    add: /logs|password_recovery|^members$|aud_./ig,
                    update: /password_recovery|payments|^members$|aud_./ig,
                    get: /^members$|password_recovery|vw_members|aud_./ig,
                    del: /^(?!.*(group_members))|^members$|aud_./ig,
                    count: /aud_./ig,
                    truncate: /./ig,
                    drop: /./ig,
                    custom: /./ig,
                    getAll: /./ig
                };

                let administrative_privilege = ['vw_member_info','members'];
                let administrative_paths = ["update","get","getAll"];

                //@ Grant the Administrative user all the power within the defined bounds                    
                if(req.role=='admin' && (administrative_paths.indexOf(pars.command) != -1) && (administrative_privilege.indexOf(pars.table) != -1) ){
                    
                    next();

                }

                //@ ENSURE THAT THE REQUESTED COMMAND HAS A DEFINED BARRIER 
                else if ( forbidden[pars.command]) {

                    //@ TEST THE PARAMETERS FOR FORBIDDEN PATHS
                    if (forbidden[pars.command].test(pars.table)) {
                        res.status(403).json(make_response(403, 'Permission to perform the database action was denied.'));
                    }else {
                        next()
                    }

                    

                    

                } else {

                    c_log(`${pars.command} is not defined`)
                    c_log(forbidden[pars.command])
                    res.status(501).json(make_response(501, `The path you requested has not been implemented.`))
                }



                // j_log(pars)

                // // console.log( payload )
                // // console.dir( req.path )
                // // console.dir( req._parsedUrl.path )


            }


        } else {           
            next()
        }




        //@ Prevent rendering of unauthorized files in the project
    } else if (isConfig.test(req.path) || isSchema.test(req.path) || isRoutes.test(req.path) || isServer.test(req.path)) {
        res.status(401).json(make_response(401, 'Unauthorized'))
        console.log("Prevented access to unauthorized file".yell)
    } else {

        // c_log(`\n\nPASSED DB PARAMS`);
        // // j_log(payload);
        // j_log(get_params(req));
        // c_log(`\n\n`);


        next()

    }



};

exports.framifySecurity = framifySecurity;