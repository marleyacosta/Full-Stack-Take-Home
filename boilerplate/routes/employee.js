'use strict';

const express = require('express');
const router = express.Router();

const loki = require("lokijs");

var db = new loki("employee.db");

var employees = db.addCollection("employees");

var shortid = require("shortid");

var request = require('request-promise');

var bodyParser = require('body-parser');

/* GET employees listing. */
router.get('', function(req, res) {

  res.render("../views/employee/index", {employees: employees});

  //return res.send(employees.find());
});


  function onlyOneCEO(roleString, res){
    if(roleString.toUpperCase() == "CEO"){
      var ceoFound = employees.find({"role": { '$in' : [roleString.toUpperCase(), roleString.toLowerCase()]}});

      if(ceoFound.length > 0){
        var message = "Error: There can only be one CEO";
        console.log(message);
        res.render("../views/employee/error", {error: message});
        return false;
      }else{
        return true;
      }

    }else{
      return true;
    }
  }


/* Create a new record using a randomly generated unique identifier */
router.post('', async function(req, res) {

  var employeeDict = {};

  var roleString = req.body.role;
  var date = req.body.hireDate;
  if((onlyOneCEO(roleString.toString(), res) && validDate(date, res))){



    employeeDict["identifier"] = shortid.generate();
    employeeDict["firstName"] = req.body.firstName;
    employeeDict["lastName"] = req.body.lastName;
    employeeDict["hireDate"] = date;
    employeeDict["role"] = roleString;



    let jokeOptions = {
      url: 'https://icanhazdadjoke.com/',
      method: 'GET',
      headers: {
          'Accept': 'application/json',

      },
      json: true,
      rejectUnauthorized: false
  }

  await getFavoritesAPI(jokeOptions)
  .then((body) => employeeDict["favoriteJoke"] = body.joke)
  .catch((e) => console.log(e.message));

  let quoteOptions = {
    url: 'https://ron-swanson-quotes.herokuapp.com/v2/quotes',
    method: 'GET',
    headers: {
        'Accept': 'application/json',

    },
     rejectUnauthorized: false
  }

  await getFavoritesAPI(quoteOptions)
  .then( (body) => employeeDict["favoriteQuote"] = JSON.parse(body)[0])
    .catch((e) => console.log(e.message));

    employees.insert(employeeDict);

    res.render("../views/employee/index", {employees: employees});
}
  //return res.send(employees.find());
});

 function getFavoritesAPI(options) {
  try{
    var response = request.get(options);
    return response;
  }catch(e) {
    console.log(e.message);
  }
}

/* Return the record corresponding to the id parameter */
router.get('/:id', function(req, res) {
  var id = req.params.id;

  var record = employees.find({"identifier": id});

  if(record.length > 0){
    res.render("../views/employee/show", {employee: record[0]});
  }else{
    var message = "No employee found with Id: " + id;
    console.log(message);
    res.render("../views/employee/error", {error: message});
  }

  //return res.send(employees.find({"identifier": id}));
});

function validDate(date, res){
  var maxDate = new Date();
  maxDate.setDate(maxDate.getDate() - 1);

  if(new Date(date) > maxDate){

    var message = "The hire date, " + date + ", is not in the past.";
    console.log(message);
    res.render("../views/employee/error", {error: message});
    return false;

  }else{
    return true;
  }

}

/*Replace the record corresponding to :id with the contents of the PUT body*/
router.put('/:id', function(req, res) {
  var id = req.params.id;
  var originalEmployee = employees.findObject({'identifier': id});

  if(originalEmployee == null){
    var message = " The employee with Id: " + id + " was not found.";
    console.log(message);
    res.render("../views/employee/error", {error: message});
  }else{
    //Parse PUT body and replace values in the original employee
  var replaceEmployee = req.body;

  for (var attribute in replaceEmployee){
    var replacementAttribute = replaceEmployee[attribute];
    console.log(attribute+": " + replacementAttribute);

    if (replaceEmployee.hasOwnProperty(attribute) && originalEmployee.hasOwnProperty(attribute)) {

        onlyOneCEO(replacementAttribute, res);
        if(attribute == "hireDate"){
          validDate(replacementAttribute, res);
        }

      originalEmployee[attribute] = replacementAttribute;
  }

  }
  employees.update(originalEmployee);
  res.render("../views/employee/update", {employee: originalEmployee});
  return res.send(employees.find({"identifier": id}));
  }


});

/*delete the record corresponding to the id parameter*/
router.delete('/:id', function(req, res) {

  var id = req.params.id;

  var employee = employees.find({"identifier": id});
  employees.findAndRemove({'identifier': id});
  res.render("../views/employee/delete", {id: id});

  //return res.send(employees.findAndRemove({'identifier': req.params.id}));
});

router.get('/favicon.ico', (req, res) => res.status(204));

module.exports = router;