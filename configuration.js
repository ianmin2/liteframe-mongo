//@ +====================================================================================
//# Essential &  swichable application running

//@ Define the authentication database [mongo/sql]
global.authMeth = "mongo";

//@ Set the application's running port [the default port is 1357]
app.port = "2433";

//@ Allow
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'app_key,X-Requested-With,Content-Type,Access-Control-Allow-Origin,Authorization,Origin,Accept,x-auth-token,Authdata');
    // res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    next();
}

app.use(allowCrossDomain);

framify.inject('new_expiry', (minutes = 120,date=new Date().toISOString())  => 
{   
    date = (typeof(date) == 'string') ? date : date.toISOString();
    let now = new Date(date);
    return new Date(now.valueOf() + ( minutes * 60000));
});

//@ +====================================================================================
//# General configuration

//@ Import the main configuration file
framify.inject( [{ config: require(path.join(__dirname,'/config/config')) }] );

//@ Avail encrypt/decrypt methods globally
framify.inject([ require( path.join(__dirname, '/utilities/encrypt-decrypt.js') )] );



//@ +======================================================================================
//# Database connection Related configuration


framify.inject([{
    mongoose : require(`mongoose`),
    mongo_connect: () => new Promise((resolve,reject) =>
    {                            
        resolve(framify.mongoose.connect(`mongodb://${framify.config.mongo.host.url}:${framify.config.mongo.host.port}/${framify.config.mongo.db}`,
        {
            user                : framify.config.mongo.user,
            pass                : framify.config.mongo.password,
            authSource          : framify.config.mongo.authDB,    
            useUnifiedTopology  : true,
            useNewUrlParser     : true,
        }));
    })
}]);


framify.mongo_connect().then(d=>c_log(`Connected to mongo!`)).catch(console.dir);