const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const multer = require('multer');
const multerOptions = {
    storage: multer.memoryStorage(),
    fileFilter(req, file, next){
        const isPhoto = file.mimetype.startsWith('image/');
        if(isPhoto){
            next(null, true);
        } else {
            next({message: `That filetype isn't allowed!`}, false);
        }
    }
};
const jimp = require('jimp');
//we will use uuid package for unique names without handling logic ourselves
const uuid = require('uuid');

exports.homePage = (req, res) => {
    res.render('index', {title: 'Home'});
};

exports.addStore = (req, res) => {
    res.render('editStore', {title: 'Add Store'});
};

//we need our middleware here, before create/update to handle upload
//remember, we are simply reading it into memory here
exports.upload = multer(multerOptions).single('photo');

/*now, lets add middleware to actually resize the photo, which is currently just stored in memory
and not actually written anywhere
*/

exports.resize = async (req, res, next) => {
    //check if there is no new file to resize
    if( !req.file ){
        next(); //skip to next middlewares
        return;
    }

    const extension = req.file.mimetype.split('/')[1];
    /*lets put the photo on the request body, remember in createStore we save it 
       using the body, so putting it here will ensure it is saved*/
    req.body.photo = `${uuid.v4()}.${extension}`;
    //now we resize
    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800, jimp.AUTO);
    await photo.write(`./public/uploads/${req.body.photo}`);
    //once we have written the photo to our filesystem, keep going!
    next();
};

exports.createStore = async (req, res) => {
    req.body.author = req.user._id;
    const store = await (new Store(req.body)).save();
    req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`);
    res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
    //1. Query DB for list of all stores
    const stores = await Store.find();
    res.render('stores', {title: 'Stores', stores});
};

//we are only going to use this function here, so we don't need to export it
const confirmOwner = (store, user) => {
    if(!store.author.equals(user._id)){
        //we throw an error here, so our error handling middleware should pick this up
       throw Error('You must own a store in order to edit it!');
    }
}

exports.editStore = async (req, res) => {
    //1. find store given the ID
    const store = await Store.findOne({_id : req.params.id});
    //2. Confirm they are the owner of the store
    confirmOwner(store, req.user);
    //3. Render out the edit form so the user can update their store
    res.render('editStore', {title: `Edit ${store.name}`, store});
};

exports.updateStore = async (req, res) => {
    //1. Set location data to be a Point after update
    req.body.location.type = 'Point';
    //2. Find and update the store
    const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
        new: true,
        runValidators: true
    }).exec();
    req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store</a>`);
    res.redirect(`/stores/${store._id}/edit`);
    //res.json(req.params);
};

exports.getStoreBySlug = async (req, res, next) => {
    //we can chain on populate() method to findOne() and get all the info about the author 
    //field populated from the user to which it belongs since we created relationship
    const store = await Store.findOne({slug: req.params.slug}).populate('author reviews');
    //remember, if somebody changes the URL there is a chance we will get no store back
    //sooooo...
    if(!store){
        next();
        return;
    }
    res.render('store', { title: store.name, store });
};

exports.getStoresByTag = async (req, res) =>{
    const tag = req.params.tag;
    //remember getTagsList() is a custom method we added on our schema 
    const tagsPromise = Store.getTagsList();
    const storesPromise = Store.find({ tags: tag });
    //two queries, each as a promise, awaited in Promise.all
    //this way we fire off to independent queries at the same time, but wait until 
    //everything is done + immediately descruture into variables
    const [ tags, stores ] =  await Promise.all( [tagsPromise, storesPromise] );
    res.render('tag', { tags , title: 'Tags', tag, stores });
};

exports.searchStores = async (req, res) => {
    //our find() needs to take an argument to tell it to search for name and description
    //properties with whatever query (req.query.q) is passed along
    //at the end, we are making use of MongoDB meta data, the 'score' key is made up of the 
    //textScore meta data, in this case, how many occurences of the searched value appear
    //in the name or description?
    //we chain on .sort() method to sort results by heighest to lowest on our textScore once again.
    //this is a MondoDB method, NOT the es6 native sort() method
    //finally, we want to chain on limit() since we only want 5 back (what if we had 10000 coffee stores)
    const stores = await Store.find({
        $text: {
            $search: req.query.q
        }
    }, {
       score: { $meta: 'textScore'} 
    })
    .sort({
        score: { $meta: 'textScore' }
    })
    .limit(5);
    res.json(stores);
};

exports.mapStores = async (req, res) => {
    const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
    //remember anything in this query object is MongoDB spefic, refer to the docs, these aren't pulled out of thin air and are not vanilla node
    const q = {
        location:{
            $near: {
               $geometry:{
                   type: 'Point',
                   coordinates
               },
               $maxDistance: 10000 // 10km
            }
        }
    }
    //the select() method can be chained onto the find() method to only query for fields we 
    //want back, (id will alwys come back as well)
    const stores = await Store.find(q).select('slug name description location').limit(10);
    //const stores = await Store.find(q).select('-author -tags');
    //above is alternate syntax to exclude fields we don't want
    res.json(stores);
};

exports.heartStore = async (req, res) => {
    //1. we need a list of users hearted stores, if they already have this store hearted, remove it
    //if they don't, add it
    const hearts = req.user.hearts.map(obj => obj.toString());
    const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
    const user = await User.findByIdAndUpdate(req.user._id,
                                              {[operator]: { hearts: req.params.id }},
                                              { new: true }
                ); 

    console.log(hearts);
    res.json(user);
};

exports.getHeartedStores = async (req, res) => {
    //query for Store ids that are IN our array of hearted stores (on the User model)
    const heartedStores = await Store.find({
        _id : { $in: req.user.hearts }
    });
    console.log(heartedStores);
    
    res.render('stores',{title: 'Hearts', stores: heartedStores});

}

exports.getTopStores = async (req, res) => {
    //here, getTopStores() is going to be our own custom method on the Store model
    const stores = await Store.getTopStores();
    res.render('topStores', { title: 'Top Stores', stores });
}