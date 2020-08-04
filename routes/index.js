const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const { catchErrors } = require('../handlers/errorHandlers');

// Do work here
router.get('/', catchErrors(storeController.getStores));
router.get('/stores', catchErrors(storeController.getStores));
router.get('/add', storeController.addStore);
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
router.get('/register', userController.registerForm);
//what about when we POST to register
//1. Validate registration data
//2. Register the user
//3. Log them in
router.post('/register', userController.validateRegister,
                         userController.register,
                         authController.login);


module.exports = router;
