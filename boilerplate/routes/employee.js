'use strict';

const express = require('express');
const router = express.Router();

const loki = require("lokijs");

var db = new loki("employee.db");
var employees = db.addCollection("employees");

var shortid = require("shortid");

var request = require('request');

var bodyParser = require('body-parser');

/* GET employees listing. */
router.get('', function(req, res) {

  res.render("../views/employee/index", {employees: employees});

  //return res.send(employees.find());
});

/* Create a new record using a randomly generated unique identifier */
router.post('', function(req, res) {

  var employeeDict = {};


  /*if(roleString.toUpperCase() === 'ceo'.toUpperCase()){

    if(employees.find({"role": { '$in' : [roleString.toUpperCase(), roleString.toLowerCase()]}})){
      console.log("Error: There can only be one CEO");
      return res.send(employees.find());
    }

  }*/

  employeeDict["identifier"] = shortid.generate();
  employeeDict["firstName"] = req.body.firstName;
  employeeDict["lastName"] = req.body.lastName;
  employeeDict["hireDate"] = req.body.hireDate;
  employeeDict["role"] = req.body.role;



  let jokeOptions = {
    url: 'https://icanhazdadjoke.com/',
    method: 'GET',
    headers: {
        'Accept': 'application/json',

    },
    json: true
}


  var joke = request(jokeOptions, function(error, response, body){
   if (!error && response.statusCode === 200) {
        console.log(body.joke);
        employeeDict["favoriteJoke"] = body.joke;


    }
    else{
      console.log(error);

    }
});


let quoteOptions = {
  url: 'https://ron-swanson-quotes.herokuapp.com/v2/quotes',
  method: 'GET',
  headers: {
      'Accept': 'application/json',

  }
}
var quote = request(quoteOptions, function(error, response, body){
  if (error) {
      console.log(error);
  } else if (!error && response.statusCode === 200) {
      employeeDict["favoriteQuote"] = JSON.parse(body)[0];

  }
});


  employees.insert(employeeDict);

  res.render("../views/employee/index", {employees: employees});
  //return res.send(employees.find());
});

/* Return the record corresponding to the id parameter */
router.get('/:id', function(req, res) {
  var id = req.params.id;

  var employee = employees.find({"identifier": id});
  console.log(employee);
  res.render("../views/employee/show", {employee: employee[0]});
  //return res.send(employees.find({"identifier": id}));
});

/*Replace the record corresponding to :id with the contents of the PUT body*/
router.put('/:id', function(req, res) {
  var id = req.params.id;
  var originalEmployee = employees.findObject({'identifier': id});
  //Parse PUT body and replace values in the original employee
  var replaceEmployee = req.body;

  for (var attribute in replaceEmployee){
    console.log(attribute+": "+replaceEmployee[attribute]);

    if (replaceEmployee.hasOwnProperty(attribute) && originalEmployee.hasOwnProperty(attribute)) {
      originalEmployee[attribute] = replaceEmployee[attribute];
  }

  }
  employees.update(originalEmployee);
  res.render("../views/employee/update", {employee: originalEmployee});
  return res.send(employees.find({"identifier": id}));
});

/*delete the record corresponding to the id parameter*/
router.delete('/:id', function(req, res) {

  var id = req.params.id;

  var employee = employees.find({"identifier": id});
  employees.findAndRemove({'identifier': id});
  res.render("../views/employee/delete", {id: id});

  //return res.send(employees.findAndRemove({'identifier': req.params.id}));
});

module.exports = router;
