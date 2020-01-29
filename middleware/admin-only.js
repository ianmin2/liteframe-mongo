exports.adminOnly = function(req,res,next)
{
    
    let token = req.headers.authorization;

    if( token ){   

        token = token.toString().replace( /JWT /ig, '').replace(/\s/ig, '');
        //@ Ensure that the provided jwt is valid

        try{
            
            verifiedJwt = nJwt.verify(token,config.secret);

            //@ Ensure that the trying party is also an administrator
            if( json( crypt.base64_decode( token.replace(/JWT /ig, '').split(".")[1] ) ).role === "admin" ){
                next();
            }else{
                res.status(401).json( make_response(  500, "You do not meet the minimum requirements to perform this action." ) );
            }

        }catch(e){
            // console.log(e);
            res.status(500).send( make_response( 500, "Please login to continue" ) )
        }

    }
    else
    {
        res.status(401).json(make_response(401,`Please login to continue.`))
    }

    

};
