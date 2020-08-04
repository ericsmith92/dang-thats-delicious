const passport = require('passport');

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

    
}