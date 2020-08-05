const mongoose = require ('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: 'Please enter a store name!'
    },
    slug: String,
    description: {
        type: String,
        time: true
    },
    tags: [String],
    created: {
        type: Date,
        default: Date.now
    },
    location:{
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: [
            {
                type: Number,
                required: 'You must supply coordinates!'
            }
        ],
        address:{
            type: String,
            required: 'You must supply an address'
        }
    },
    photo: String,
    /*
    create a relationship between Stores and Users (if user created store) by giving an author
    field on Schema and setting it to be the ObjectId of the user (mongodb data type)
    ref points to 'User' (referring to User model)
    */
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'You must supply an author'
    }
});

storeSchema.pre('save', async function(next){
    if(!this.isModified('name')){
        next(); //skip it
        return; //stop function from running
    }

    this.slug = slug(this.name);
    //find other stores that have slug of start-of-string
    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
    //see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/constructor for more on this.constructor
    const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
    if(storesWithSlug.length){
        this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
    }

    next();
});

//we use .statics to add our own custom methods to our Model
//we need to use proper function and not => arrow function because we need to refer to keyword this
//we are binding this to the model
//the array is the 'pipeline', where we are aggregating our data 

storeSchema.statics.getTagsList = function() {
    //aggregate is baked in, similar to find() or findOne(), it accepts an array []
    return this.aggregate([
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } }},
        { $sort: { count: -1 }}
    ]);
}

module.exports = mongoose.model('Store', storeSchema);