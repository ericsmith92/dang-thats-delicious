const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');

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


module.exports = router;
