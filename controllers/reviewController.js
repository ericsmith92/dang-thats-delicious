const mongoose = require('mongoose');
const Review = mongoose.model('Review');

exports.addReview = async (req, res) => {
    //id coming from signed in user
    req.body.author = req.user._id;
    //id coming in from URL (set up in routes)
    req.body.store = req.params.id;
    const newReview = await (new Review(req.body)).save();
    req.flash('success', 'Review Saved!');
    res.redirect('back');
};