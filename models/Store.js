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
},{
    //we want virtual fields to populate in JSON output and Object dumps
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

//Define our indexes - all of our indexing in MongoDB happens in our Schema
//we pass the index() method an object of fields we want indexed
//we want to index our 'name' and 'description' fields as text so we can search through them easily
//below is a 'compound' index, since we are indexing two fields as one
storeSchema.index({
    name: 'text',
    description: 'text'
});

//lets make a new index for location, we are going to make it geospatial
//it will store meta data about location as geospatial (easy to search nearby lat and lngs)

storeSchema.index({ location: '2dsphere'} );


//TODO: add another pre save hook to strip HTML before saving to DB

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
};

//we are gonna use something native to mongoose called virtual populate to essentially perform
//an additional query to get reviews associated with stores
//localField && foreignField are like PK and FK in relational DBs - and this is like a join
// 'find review where the stores _d property === reviews store property'
storeSchema.virtual('reviews', {
    ref: 'Review',
    localField: '_id', //which field on the store?
    foreignField: 'store' //which field on the review?
});

module.exports = mongoose.model('Store', storeSchema);