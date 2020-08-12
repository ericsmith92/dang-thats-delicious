const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const reviewSchema = new mongoose.Schema({
    created:{
        type: Date,
        default: Date.now
    },
    //author is a relationship to User model
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required:'You must supply an author'
    },
    store:{
        type: mongoose.Schema.ObjectId,
        ref: 'Store',
        required: 'You must supply a store!'
    },
    text: {
        type: String,
        required: 'Your review must have text!'
    },
    rating:{
        type: Number,
        min: 1,
        max: 5
    }
});

//middlewear to populate the author based on the ID
function autoPopulate(next) {
    this.populate('author');
    next();
}

//add hook for autopuplate to schema
reviewSchema.pre('find', autoPopulate);
reviewSchema.pre('findOne', autoPopulate);

module.exports = mongoose.model('Review', reviewSchema);