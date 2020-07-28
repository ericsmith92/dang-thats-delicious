const express = require('express');
const router = express.Router();

// Do work here
router.get('/', (req, res) => {
  //res.send('Hey! It works!');
  console.log(req.query);
  res.render('hello', {
    name: 'Wes',
    dog: req.query.dog
  });
});

router.get('/reverse/:name', (req, res) => {
  const reverse = req.params.name.split('').reverse().join('')
  res.send(reverse);
})

module.exports = router;
