const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');
const mail = require('../handlers/mail');

exports.login = passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: 'Failed Login!',
    successRedirect: '/',
    successFlash: 'You are now logged in!'
});

exports.logout = (req, res) => {
    req.logout();
    req.flash('success', 'You are now logged out!');
    res.redirect('/');
};

//middleware to check if the user is logged in (so of course, we are passing it next as an arg)
exports.isLoggedIn = (req, res, next) => {
    // first check if user is authenticated
    //the passport middleware is adding the isAuthenticated() method to req Object
    if(req.isAuthenticated()){
        next(); //carry on, we are logged in
        return; //calling next() still doesn't end function execution, lets return
    }

    req.flash('error', 'Oops, this action requires you to be logged in!');
    res.redirect('/login');  
};

exports.forgot = async (req, res) => {
    //1. See if user with that email exists
    const user = await User.findOne({ email: req.body.email });
    if(!user){
        req.flash('error', 'No account with that email exists');
        return res.redirect('/login'); //we return this to stop function execution as well
    }

    //2. Set reset tokens and expiry on their account
    user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordExpires = Date.now() + 3600000;
    //now that we have set these two fields for reset on our user, we need to save them
    await user.save(); 
    //3. Send them an email with the token
    const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
    
    await mail.send({
        user,
        subject: 'Password Reset',
        resetURL,
        filename: 'password-reset',
    });

    req.flash('success', `You have been emailed a password reset link.`);
    //4. Redirect to login page
    res.redirect('/login');
}

exports.reset = async (req, res) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        //look for an expires that is greater than now, meaning it has not expired
        resetPasswordExpires: { $gt: Date.now() }
    });
    if(!user){
        req.flash('error', 'Password reset token is invalid or has expired');
        return res.redirect('/login');
    }

    //if there is a user, show the rest password form
    res.render('reset', { title: 'Reset your Password' });
};

exports.confirmedPasswords = (req, res, next) => {
    if(req.body.password === req.body['password-confirm']){
        next(); //keep it going
        return;
    }

    req.flash('error', 'Passwords do not match!');
    res.redirect('back'); 
}

exports.update = async (req, res) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        //look for an expires that is greater than now, meaning it has not expired
        resetPasswordExpires: { $gt: Date.now() }
    });
    
    if(!user){
        req.flash('error', 'Password reset token is invalid or has expired');
        return res.redirect('/login');
    }

    const setPassword = promisify(user.setPassword, user); //made avaiable to us from plugin in User.js
    await setPassword(req.body.password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    const updatedUser = await user.save();
    await req.login(updatedUser);
    req.flash('success', 'Nice, your password has been reset!');
    res.redirect('/');
};