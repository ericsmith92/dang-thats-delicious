const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');

const { catchErrors } = require('../handlers/errorHandlers');

// Do work here
router.get('/', catchErrors(storeController.getStores));
router.get('/stores', catchErrors(storeController.getStores));
router.get('/stores/page/:page', catchErrors(storeController.getStores));
//super cool below, we first check with out isLoggedIn() middleware on the authController before
//passing them to addStore since you must be logged in to add a store
router.get('/add', authController.isLoggedIn, storeController.addStore);
//remember, createStore method is async await, so we need to wrap it in our catch errors function - referred to as composition
//here, we are passing our middleware sequentially to this route, before we ultimately hit our createStore controller
router.post('/add', storeController.upload,
                    catchErrors(storeController.resize),
                    catchErrors(storeController.createStore));
router.post('/add/:id', catchErrors(storeController.updateStore));
router.get('/stores/:id/edit', catchErrors(storeController.editStore));
router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));
router.get('/tags', catchErrors(storeController.getStoresByTag));
router.get('/tags/:tag', catchErrors(storeController.getStoresByTag));

//new controller for user activities (login, password reset, etc)
router.get('/login', userController.loginForm);
router.post('/login', authController.login);
router.get('/register', userController.registerForm);
//what about when we POST to register
//1. Validate registration data
//2. Register the user
//3. Log them in
router.post('/register', userController.validateRegister,
                         userController.register,
                         authController.login);

router.get('/logout', authController.logout);

router.get('/account', authController.isLoggedIn, userController.account);
router.post('/account', catchErrors(userController.updateAccount));
router.post('/account/forgot', catchErrors(authController.forgot));
router.get('/account/reset/:token', catchErrors(authController.reset));
router.post('/account/reset/:token', authController.confirmedPasswords ,
                                     catchErrors(authController.update));

router.get('/hearts', authController.isLoggedIn, catchErrors(storeController.getHeartedStores));
router.post('/reviews/:id', authController.isLoggedIn ,catchErrors(reviewController.addReview));

router.get('/top', catchErrors(storeController.getTopStores));


/*
API ENDPOINTS (remember, these are also just routes we are hiting)
*/

router.get('/api/search', catchErrors(storeController.searchStores));
router.get('/api/stores/near', catchErrors(storeController.mapStores));
//above, we are just querying DB, so these are get requests
//below, we are using our API to post to the DB since the User is pushing data (liking/hearting)
router.post('/api/stores/:id/heart', catchErrors(storeController.heartStore));

module.exports = router;
