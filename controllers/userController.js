const mongoose = require('mongoose');
//we can do this below since we imported model in start.js
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.loginForm = (req, res) => {
    res.render('login', {title: 'Login'});
};

exports.registerForm = (req, res) => {
    res.render('register', {title: 'Register'});
};

//lets make our own middleware here to do a bunch of validation/checks before we hit our model/db
//remember, we need next as an arg any time we are dealind with middleware
exports.validateRegister = (req, res, next) => {
    //we are using app.use(expressValidator()) in app.js, sanitizeBody is a method it exposes
    req.sanitizeBody('name');
    req.checkBody('name', 'You must supply a name!').notEmpty();
    req.checkBody('email', 'That Email is not valid').isEmail();
    req.sanitizeBody('email').normalizeEmail({
        remove_dots: false,
        remove_extension: false,
        gmail_remove_subaddress: false
    });
    req.checkBody('password', 'Password cannot be blank!').notEmpty();
    req.checkBody('password-confirm', 'Confirmed Password cannot be Blank!').notEmpty();
    req.checkBody('password-confirm', 'Oops, your password do not match').equals(req.body.password);

    const errors = req.validationErrors();

    if(errors){
        req.flash('error', errors.map(err => err.msg));
        res.render('register', {title: 'Register', body: req.body, flashes: req.flash() });
        return; //we found errors and handled them, let's stop function from running
    }

    next(); //there were no errors, lets keep it moving (register + save to db in this case)
};

//we are also passing next here since this is ALSO a middleware, remember, once a user is 
//registered we still need to log them in, so we're still 'in the middle'
exports.register = async (req, res, next) => {
    const user = new User({ email: req.body.email, name: req.body.name });
    //making password register method Promise based with promisify
    //pass method we want to make Promise based + Object to bind to
    const registerWithPromise = promisify(User.register, User);
    await registerWithPromise(user, req.body.password);
    next(); //pass to authController.login
};

exports.account = (req, res) => {
    res.render('account', { title: 'Edit Account' });
}

exports.updateAccount = async (req, res) => {

    //we need to grab all data and users have sent us to update
    const updates = {
        name: req.body.name,
        email: req.body.email
    };

    const user = await User.findOneAndUpdate(
        { _id: req.user._id},
        //set what we are passing on ontop of what is already there, we 
        //might not be passing a 1:1 for each value in DB for this model
        { $set: updates},
        { new: true, runValidators: true, context: 'query' }
    );
    
    //'back' passed to redirect just sends them back to where they came from
    //helpful if we had multiple endpoints hitting this method
    req.flash('success', 'Updated the profile!');
    res.redirect('back');
}