//@ Make the base framify object globally accessible
Object.assign(global,{ framify :  require( `liteframe-core`) });

//# Load the application base configurations
require(`./configuration`);

const LocalStrategy = require(`passport-local`).Strategy

//@ grab a copy of the schema 
const schema    = require(path.join(__dirname,`/schema/schema.js`)); 

//@ make the helpers avalable via the framify object
framify.inject([{schema}]);

//@ Initialize passport for use
app.use( passport.initialize() );

passport.use(new LocalStrategy(framify.schema.Member.createStrategy(),console.dir));
passport.serializeUser(framify.schema.Member.serializeUser());
passport.deserializeUser(framify.schema.Member.deserializeUser());


//@ Alter the passport strategy for JWT
require(path.join(__dirname,"/config/passport"))( passport );



//@ SETUP BODY PARSER MIDDLEWARE 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use("/auth", require(`${__dirname}/routes/auth.js`));


app.listen(app.port,e=>{
    c_log(`\n\n${framify.icons.success}\tRunning app service at http://${myAddr}:${app.port}\n`.yell)
});