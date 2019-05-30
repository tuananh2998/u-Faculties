const express = require('express');
router = express.Router();
const ejs = require("ejs");
const fs = require("fs");
const connection = require("../config/database");
const passport = require('passport');
const multer = require('multer');

const authenticateController = require('../controllers/authenticate-controller'),
    registerController = require('../controllers/register-controller'),
    unitController = require('../controllers/units-controller'),
    employeeController = require('../controllers/employee-controller');

require('../config/passport')(passport)


// User account route
router.route('/signin')
    .post(authenticateController.userLogin)

router.route('/controllers/register-controller')
    .post(registerController.register);

// Register account (UNAVAILABLE TEMPORARY)
// router.route('/signup')
//     .get((req, res) => res.render("signup"))

router.route('/logout')
    .post((req, res) => {
        console.log('logging out');
        req.logout();
        req.session.destroy(err => {
            res.clearCookie();
            res.redirect('/');
        });
    })

router.route('/')
    .get((req, res) => {
        if (req.isAuthenticated()) {
            res.redirect('/index');
        } else {
            res.render("login")
        }
    })
    .post((req, res) => res.render('login'))

router.route('/index')
    .get((req, res) => {
        if (req.isAuthenticated()) {
            res.render("index", { name: req.session.passport.user, role: req.user[0].role })
        } else {
            res.redirect('/')
        }
    })

router.route('/field_research')
    .get((req, res) => {
        if (req.isAuthenticated()) {
            if (req.user[0].role === "admin") {
                connection.query('SELECT * FROM field ORDER BY parent_id', function (err, result) {
                    res.render("field_research", { field: result, name: req.session.passport.user, role: req.user[0].role })
                })
            } else {
                res.redirect('/')
            } 
        } else {
            res.redirect('/')
        }
    })


// Render with DB
function renderHTML(path, res, data) {
    var htmlContent = fs.readFileSync(path, 'utf-8');
    data.filename = path;

    var htmlRenderized = ejs.render(htmlContent, data);

    res.writeHeader(200, { "Content-Type": "text/html" });
    res.end(htmlRenderized);
}


// Unit route
router.route('/unit')
    .get(function (req, res) {
        if(req.isAuthenticated()) {
            connection.query('SELECT * FROM units', function (err, result) {
                if (err) throw err;
                renderHTML('./views/unit.ejs', res, { units: result, name: req.session.passport.user, role: req.user[0].role });
            });
        } else {
            res.redirect('/')
        }
    })


router.route('/controllers/units-controller')
    .post(unitController.addUnit); 

router.route('/unit-manage')
    .delete(unitController.delUnit)
    .post(unitController.editUnit)

// Profile page route
router.route('/profile')
    .get((req, res) => {
        if (req.isAuthenticated()) {
            if (req.session.passport.user === "admin") {
                res.redirect('/index');
            } else {
                connection.query('SELECT * FROM employee WHERE username = ?', req.session.passport.user, function (err, result) {
                    if (err) throw err;
                    renderHTML('./views/profile.ejs', res, { user: result, name: req.session.passport.user, role: req.user[0].role });
                });
            }
        } else {
            res.redirect("/")
        }
    })


// Employee route
router.route('/employee')
    .get(function (req, res) {
        if(req.isAuthenticated()) {
            connection.query('SELECT * FROM employee', function (err, result) {
                renderHTML('./views/employee.ejs', res, { employee: result, name: req.session.passport.user, role: req.user[0].role });
            });
        } else {
            res.redirect('/')
        }
    })

router.route('/controllers/employee-controller')
    .post(employeeController.addEmployee);

router.route('/employee-manage')
    .delete(employeeController.deleteEmployee)
    .post(employeeController.editEmployee)

// router.route('/employee-upload')
//     .post(employeeController.addEmployeeByExcel)


//============== upload image ================
// Config storage for image
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/image/user')
    },
    filename: function(req, file, cb) {
      cb(null, file.originalname)
    }
})

var upload = multer({storage: storage})

router.route('/uploadImage')
    .post(upload.single('file'), function(req, res) {
        console.log(req.file.originalname);
        res.redirect('/profile')
    })

router.route('/uploadExcel')
    .post(upload.single('file'), function(req, res) {
        employeeController.addEmployeeByExcel(req.file.originalname)
        res.redirect('/employee')
    })
//============================================
router.route('/search-unit/:id')
.get(function(req, res){
  const name = req.params.id;
  connection.query('SELECT * FROM employee WHERE employeeId=?', name, (err,rows) => {
    //console.log(rows);
    //if (err) throw err;
    if (rows.length > 0) {
      res.send(rows);
      //res.render("profile1.ejs", {degree: rows[0].degree, name: rows[0].name, employeeId: rows[0].employeeId, employeeType: rows[0].employeeType});
    } else {
      res.json(rows);
    }
   });
});

router.route('/search-unit1/:id')
.get(function(req, res){
  const name = req.params.id;
  connection.query('SELECT * FROM employee WHERE company=?', name, (err,rows) => {
    //console.log(rows);
    //if (err) throw err;
    if (rows.length > 0) {
      res.send(rows);
      //res.render("profile1.ejs", {degree: rows[0].degree, name: rows[0].name, employeeId: rows[0].employeeId, employeeType: rows[0].employeeType});
    } else {
      res.json(rows);
    }
   });
});

router.route('/search-unit')
.get(function(req, res){
  if(req.isAuthenticated()) {
    connection.query('SELECT * FROM employee', function (err, result) {
      if (err) throw err;
      renderHTML('./views/search-unit.ejs', res, { unit: result, role: req.user[0].role, name: req.session.passport.user });
    });
  } else {
    connection.query('SELECT * FROM employee', function (err, result) {
        if (err) throw err;
        renderHTML('./views/search-unit.ejs', res, { unit: result, role: "guest", name: "guest" });
    });
  }
});


module.exports = router;