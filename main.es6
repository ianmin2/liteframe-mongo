//@ Make the base framify object globally accessible
Object.assign(global,{ framify :  require( `liteframe-core`) });

const LocalStrategy = require(`passport-local`)

//@ grab a copy of the schema 
const schema    = require(path.join(__dirname,`/schema/schema.js`)); 
// const passport  = require(`passport`);

//@ make the helpers avalable via the framify object
framify.inject([{schema}]);

passport.use(new LocalStrategy(framify.schema.Member.createStrategy(),console.dir));
passport.serializeUser(framify.schema.Member.serializeUser());
passport.deserializeUser(framify.schema.Member.deserializeUser());

require(`./configuration`);


setTimeout(() => {
    console.log("Done!")
}, 3000000);

console.log("Running!")