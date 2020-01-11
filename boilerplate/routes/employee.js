'use strict';

const express = require('express');
const router = express.Router();

const loki = require("lokijs");

var db = new loki("employee.db");
var employees = db.addCollection("employees");

var shortid = require("shortid");

var request = require('request');

/* GET employees listing. */
router.get('', function(req, res) {

  return res.send(employees.find());
});

/* Create a new record using a randomly generated unique identifier */
router.post('', function(req, res) {

  var id = shortid.generate();
  var fName = req.query.firstName;
  var lName = req.query.lastName;
  var hDate = req.query.hireDate;
  var position = req.query.role;


  var joke = request('https://icanhazdadjoke.com', { json: true }, (err, res, body) => {
                    if (err) { return console.log(err); }
                    return (body.explanation);

                    });

  var quote = request('https://ron-swanson-quotes.herokuapp.com/v2/quotes', { json: true }, (err, res, body) => {
                    if (err) { return console.log(err); }
                    return (body.explanation);
                    });


  employees.insert({ identifier: id, firstName : fName, lastName: lName, hireDate: hDate,
     role: position, favoriteJoke: joke, favoriteQuote: quote});

  return res.send(employees.find());
});

/* Return the record corresponding to the id parameter */
router.get(':id', function(req, res) {
  var id = req.params.id;
  return res.send(employees.find({"identifier": id}));
});

/*Replace the record corresponding to :id with the contents of the PUT body*/
router.put(':id', function(req, res) {

  var originalEmployee = employees.find({'identifier': req.params.id});
  //Parse PUT body and replace values in the original employee

  employees.update(originalEmployee);
  return res.send(employees.find());
});

/*delete the record corresponding to the id parameter*/
router.delete(':id', function(req, res) {

  return res.send(employees.find({'identifier': req.params.id}).remove());
});

module.exports = router;
