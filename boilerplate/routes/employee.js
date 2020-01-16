'use strict';

const express = require('express');
const router = express.Router();

const {check, validationResult} = require('express-validator/check');

const loki = require("lokijs");

const db = new loki("employee.db");

const employees = db.addCollection("employees");

const shortid = require("shortid");

const request = require('request-promise');

const bodyParser = require('body-parser');

var sleep = require('sleep'); 




/* GET employees listing. */
router.get('', function(req, res) {

  res.render("../views/employee/index", {employees: employees});

  //return res.send(employees.find());
});

  function showErrorPage(message, res){
    console.log(message);
    res.render("../views/employee/error", {error: message});
  }

  // Validate the roles case-insensitive and there can only be one CEO.
  function validRole(roleString, res){

    var tempRoleString = roleString.toUpperCase();
    
    var expectedRoles = ['CEO', 'VP', 'MANAGER', 'LACKEY'].includes(tempRoleString);
    
    if(expectedRoles){
      if(tempRoleString == "CEO"){

        var searchRegex = new RegExp(roleString, 'i');
        var ceoFound = employees.find({"role": {'$regex': searchRegex}});
  
        if(ceoFound.length > 0){
          showErrorPage("There can only be one CEO", res);
          return false;
        }else{
          return true;
        }
  
      }else{
        return true;
      }
    }else{
      showErrorPage("The role must be one of the following: CEO, VP, MANAGER, and LACKEY.", res);
      return false;
    }
    
  }


/* Create a new record using a randomly generated unique identifier and get async API responses*/
router.post('',
[
  check('firstName').not().isEmpty().withMessage('First Name is required'),
  check('firstName').isString().withMessage('First Name must be String'),
  check('lastName').not().isEmpty().withMessage('Last Name is required'),
  check('lastName').isString().withMessage('Last Name must be String'),
  check('hireDate').not().isEmpty().withMessage('Hire Date is required'),
  check('hireDate').isISO8601('yyyy-mm-dd').withMessage('Hire Date must be in yyyy-mm-dd'),
  check('role').not().isEmpty().withMessage('Role is required'),
  check('role').isString().withMessage('Role is must be String'),
  
],
 async function(req, res) {

  const errors = validationResult(req);
    console.log(req.body);

    // Create errors for html display
    if (!errors.isEmpty()) {
      var errorsList = '';

      for (var i = 0; i < errors.array().length; i++) {
        if(i == errors.array().length - 1 && i != 0){
          errorsList += " and " + errors.array()[i].msg + ".";
        }else if(i == errors.array().length - 1){
          errorsList += errors.array()[i].msg + '.';
        }else{
          errorsList += errors.array()[i].msg + ', ';
        }
       
      }
      res.render("../views/employee/error", {error: errorsList});
      //return res.status(422).jsonp(errors.array());
    }else{

    

  var employeeDict = {};



  var roleString = req.body.role;
 
  var date = req.body.hireDate;
  if((validRole(roleString, res) && validDate(date, res))){

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
 } //return res.send(employees.find());
});

// This function helps get API responses
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
   
    showErrorPage("No employee found with Id: " + id, res);
  }

  //return res.send(employees.find({"identifier": id}));
});

// Validate the date is in the future
function validDate(date, res){
  var maxDate = new Date();
  maxDate.setDate(maxDate.getDate() - 1);

  if(new Date(date) > maxDate){
    showErrorPage("The hire date, " + date + ", is not in the past.", res);
    return false;

  }else{
    return true;
  }

}



/*Replace the record corresponding to :id with the contents of the PUT body*/
router.put('/:id',
[
  check('firstName').not().isEmpty().withMessage('First Name is required'),
  check('firstName').isString().withMessage('First Name must be String'),
  check('lastName').not().isEmpty().withMessage('Last Name is required'),
  check('lastName').isString().withMessage('Last Name must be String'),
  check('hireDate').not().isEmpty().withMessage('Hire Date is required'),
  check('hireDate').isISO8601('yyyy-mm-dd').withMessage('Hire Date must be in yyyy-mm-dd'),
  check('role').not().isEmpty().withMessage('Role is required'),
  check('role').isString().withMessage('Role is must be String'),
  
],
function(req, res) {
  var id = req.params.id;
  var originalEmployee = employees.find({'identifier': id});

  if(originalEmployee == null){
    showErrorPage("The employee with Id: " + id + " was not found.", res);
    
  }else{
    //Parse PUT body and replace values in the original employee
  var replaceEmployee = req.body;

  var replaceEmployeeDict = {};


  var validDateUpdate = true;
  var validRoleUpdate = true;

  
  for (var attribute in originalEmployee[0]) {
  
    
    var replacementAttribute = replaceEmployee[attribute];
    console.log(attribute+": " + replacementAttribute);
    

        if(attribute == "role"){

            validRoleUpdate = validRole(replacementAttribute, res);
            
        }
        
        if(attribute == "hireDate"){

            validDateUpdate = validDate(replacementAttribute, res);
            
        }

      
  
  if((attribute != "meta" && attribute != "$loki")){
    if (replacementAttribute != originalEmployee[0][attribute] ) {
      
      if(typeof replacementAttribute == 'undefined'){
        
        replaceEmployeeDict[attribute] = originalEmployee[0][attribute];
      }else{
       
        replaceEmployeeDict[attribute] = replacementAttribute;
      }
      
      
    }else{
      console.log(replacementAttribute); 
      replaceEmployeeDict[attribute] = originalEmployee[0][attribute];
    }
  }
  }
  if(validRoleUpdate && validDateUpdate){
    console.log(replaceEmployeeDict); 
    employees.findAndRemove({'identifier': id});
    
    employees.insert(replaceEmployeeDict);
    var updatedEmployee = employees.find({'identifier': id})
    res.render("../views/employee/show", {employee: updatedEmployee[0]});
  }
  
  //return res.send(employees.find({"identifier": id}));
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