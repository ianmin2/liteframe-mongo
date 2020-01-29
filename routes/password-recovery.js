let router = new express.Router();

//@ THE MAIN ROUTE
router.route("/").get((req, res) =>res.sendFile(path.join(__dirname,`templates/password/main.html`)))

//@ FORGOT PASSWORD HANDLER
router.route("/forgot")
    .all((req, res) => {

        let params = get_params(req);

        if (params.email) {

            c_log(`Attempting a password recovery for ${params.email}`.info)

            $connection.query("SELECT * from members WHERE email=$1", [params.email])
                .then(userData => {

                    if (userData[0]) {

                        //@ GENERATE A RECOVERY KEY
                        let reckKey = crypto.randomBytes(parseInt(45)).toString('hex');

                        //@ Save the recovery key in the password recovery table
                        $connection.query("INSERT INTO password_recovery (member,recovery_key) VALUES ($1,$2);SELECT * FROM password_recovery WHERE password_recovery_id = SCOPE_IDENTITY()", [userData[0].member_id, reckKey])
                            .then(recovery => {

                                if (recovery[0]) {

                                    let recovery_id = recovery[0].password_recovery_id;

                                    //@ Fetch the password recovery html template 
                                    let template = fs.readFileSync( path.join( __dirname,`./templates/password/forgot.html`), 'utf8');

                                    //@ Replace the template strings with the proper fetched data [sms.jambopay.co.ke]
                                    template = template.replace(/{{user}}/ig, `${userData[0]["name.first"]}`)
                                        .replace(/{{user_account}}/ig, `${userData[0]["account.name"]}`)
                                        .replace(/{{user_recovery_link}}/ig, `https://sms.jambopay.co.ke/#/app/password_recovery/${recovery_id}/${userData[0].email}/${reckKey}`)

                                    //@ Format the mail object for sending
                                    let mailObj = {
                                        from:config.email.accounts.passwords,
                                        to: userData[0].email,
                                        subject: 'Password recovery request',
                                        html: template
                                    }

                                    //@ Send the user a recovery email
                                    if (sendMail) {

                                        sendMail(mailObj)
                                            .then(msg => {
                                                log(`Successfully sent  a password recovery email to ${userData[0].email}`.yell)
                                                res.send(make_response(200, `A password recovery email is on its way to ${params.email}.<br><br>Please check your <b style="color:orange !important;">Junk</b> or <b style="color:orange !important;">spam</b> folders before trying again.`, 'continue'))
                                            })
                                            .catch(err => {
                                                log(`Something went wrong when trying to send a  password recovery email to ${str(userData[0])}`.err)
                                                errorEmail({ message: `Failed to send a password recovery email to the user <br><br>${str(userData[0])}`, details: err })
                                                res.status(500).send(make_response(500, `An error occured when trying to send a recovery link to your email (<font class="uk-text-success">${userData[0].email}</font>).<br>Please try again.<br><br><font class="uk-text-danger">Error</font>: ${err.message}`));
                                            })

                                    } else {

                                        log(`This server does not seem to be configured for email sending!!`.err)
                                        errorEmail(`The application server at ${myAddr} is not configured for mail sending!`)
                                        res.status(500).send(make_response(500, 'The email sending server has not been defined for this application.<br> Please consult your administrator for assistance'))

                                    }

                                } else {

                                    log(`Someone tried password recovery with invalid credentials: ${params.email}`.yell)
                                    res.status(500).send(make_response(500, "Failed to recover your password due to password recovery technicalities.<br>Please try again.", recovery))

                                }

                            })
                            .catch(err => {
                                errorEmail({ message: `The application at ${myAddr} failed to record a password recovery email token for ${params.email}`, details: err });
                                log(`Failed to record a password recovery token.\nReason:\n\n${err}`)
                                res.status(500).send(make_response(500, "Failed to record a recovery token.<br>Please try again", err.message))
                            })

                    } else {
                        res.status(404).send(make_response(404, "Sorry, we could not find an account with that email address.", userData))
                    }

                })
                .catch(err => {
                    errorEmail({message:`A nasty error showed up at the user data selection point of the password recovery engine for ${params.email}`, details: err})
                    res.status(500).send(make_response(500, err.message));
                })

        } else {

            res.status(417).send(make_response(417, 'Please provide your email address for password recovery'));

        }

    })

router.route("/recover/:id/:email/:token")
    // router.route("/recover")
    .all((req, res) => {

        if (isDefined(req.params, "id,email,token")) {

            let params = get_params(req);

            // console.log("Your parameters")
            // console.dir(params)

            //@ CHECK TO ENSURE THAT THE PROVIDED ROUTE PARAMETERS ARE VALID
            $connection.query("SELECT password_recovery_id FROM vw_password_recovery WHERE password_recovery_id=$1 AND member_email=$2 AND recovery_key=$3 ", [parseInt(req.params.id), req.params.email, req.params.token])
            .then(userData => {

                if (userData[0]) {

                    if (!params.password || !params.password2 || (params.password != params.password2)) {

                        res.send(make_response(200,`You are on the right track to password recovery. <br>Enter your new password.`));

                    } else {


                        //@ UPDATE THE USER PASSWORD
                        $connection.query("UPDATE members SET Password=$1 WHERE email=$2", [crypt.md5(params.password), req.params.email])
                        .then(()=>{
                            $connection.query(`SELECT * FROM members WHERE email=$1`,[req.params.email])
                            .then(resp => {
                             
                                if (resp[0]) {

                                    //@ DISABLE ALL OF THE USER'S PASSWORD RESET TOKENS
                                    $connection.query("UPDATE password_recovery SET used=$1 WHERE member=$2 AND used=$3", [1,resp[0].member_id,0])
                                        .then(() => {

                                            log(`Successfully the password for the account ${req.params.email}`.succ)
                                            res.send(make_response(200, `Your password has successfully been updated.<br><br><a href="/#/app/login"> Proceed to Login</a>`))

                                        })
                                        .catch(err => {
                                            errorEmail({message: `Failed to update the password for ${req.params.email}`, details: err})
                                            log(`Failed to update the password for ${req.params.email}\nReason:\n\n${err.message}`)
                                            res.send(make_response(500, err.message));
                                        })

                                } else {

                                    //@ FAILED TO DISABLE THE RECOVERY TOKEN
                                    errorEmail({message: `Failed to capture member details for the user ${req.params.email} at password recovery`, details: err})
                                    res.send(make_response(401, `You are not recognized as a valid user of this service.<br>Please contact support if this is a mistake.`))

                                }

                            })
                            .catch(err => {
                                errorEmail({message: `Failed to fetch the user details to aid in password recovery for the account ${params.email}`, details: err})
                                res.status(500).send(make_response(500, "Failed to update password. Please try again."))
                                // res.send(make_response(500, err.message))
                            })
                            

                        })                            
                        .catch(err => {
                            errorEmail({message: `Failed to disable used recovery tokens for the account ${params.email}`, details: err})
                            res.status(500).send(make_response(500, "Failed to update password. Please try again."))
                            // res.send(make_response(500, err.message))
                        })

                    }

                } else {

                    res.status(412).send(make_response(412,`The recovery link you clicked on is either invalid or expired.<br>Please initiate another recovery request.`));

                }



            })

        } else {

            res.status(412).send(make_response(412, `The recovery link you used is not valid for this service.`))

        }

    })

module.exports = router;