const mongoose = require('mongoose');
const Store = mongoose.model('Store');
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
}

exports.addStore = (req, res) => {
    res.render('editStore', {title: 'Add Store'});
}

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
}

exports.createStore = async (req, res) => {
    const store = await (new Store(req.body)).save();
    req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`);
    res.redirect(`/store/${store.slug}`);
}

exports.getStores = async (req, res) => {
    //1. Query DB for list of all stores
    const stores = await Store.find();
    res.render('stores', {title: 'Stores', stores});
}

exports.editStore = async (req, res) => {
    //1. find store given the ID
    const store = await Store.findOne({_id : req.params.id});
    console.log(store);
    //2. Confirm they are the owner of the store
    //3. Render out the edit form so the user can update their store
    res.render('editStore', {title: `Edit ${store.name}`, store});
}

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
}

exports.getStoreBySlug = async (req, res, next) => {
    const store = await Store.findOne({slug: req.params.slug});
    //remember, if somebody changes the URL there is a chance we will get no store back
    //sooooo...
    if(!store){
        next();
        return;
    }
    res.render('store', { title: store.name, store });
} 

exports.getStoresByTag = async (req, res) =>{
    const tag = req.params.tag;
    const tagsPromise = Store.getTagsList();
    const storesPromise = Store.find({ tags: tag });
    //two queries, each as a promise, awaited in Promise.all
    //this way we fire off to independent queries at the same time, but wait until 
    //everything is done + immediately descruture into variables
    const [ tags, stores ] =  await Promise.all( [tagsPromise, storesPromise] );
    res.render('tag', { tags , title: 'Tags', tag, stores });
}