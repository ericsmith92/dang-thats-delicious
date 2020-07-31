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
    photo: String
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

    //TODO: Add logic for unique slugs
});

module.exports = mongoose.model('Store', storeSchema);