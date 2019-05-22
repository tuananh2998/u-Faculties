const express = require('express');
router = express.Router();
const ejs = require("ejs");
const fs = require("fs");
const connection = require("../config");
const passport = require('passport');

const authenticateController = require('../controllers/authenticate-controller'),
    registerController = require('../controllers/register-controller'),
    unitController = require('../controllers/units-controller'),
    employeeController = require('../controllers/employee-controller');

require('../config/passport')(passport)

router.route('/signin')
    .post(authenticateController.userLogin)

router.route('/controllers/register-controller')
    .post(registerController.register);

router.route('/signup')
    .get((req, res) => res.render("signup"))

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

const User = require('../models/user')
router.route('/index')
    .get((req, res) => {
        if (req.isAuthenticated()) {
            res.render("index", { name: req.session.passport.user })
        } else {
            res.redirect('/')
        }
    })

router.route('/field_research')
    .get((req, res) => { res.render("field_research") })

router.route('/profile')
    .get((req, res) => {
        if (req.isAuthenticated()) {
            res.render('profile')
        } else {
            res.redirect('/')
        }
    })

// Render with HTML
function renderHTML(path, res, data) {
    var htmlContent = fs.readFileSync(path, 'utf-8');
    data.filename = path;

    var htmlRenderized = ejs.render(htmlContent, data);

    res.writeHeader(200, { "Content-Type": "text/html" });
    res.end(htmlRenderized);
}

router.route('/unit')
    .get(function (req, res) {
        if(req.isAuthenticated()) {
            connection.query('SELECT * FROM units', function (err, result, fields) {
                if (err) throw err;
                renderHTML('./views/unit.ejs', res, { units: result, role: req.user[0].role });
            });
        } else {
            connection.query('SELECT * FROM units', function (err, result, fields) {
                if (err) throw err;
                renderHTML('./views/unit.ejs', res, { units: result, role: "guest" });
            });
        }
    })

router.route('/controllers/units-controller')
    .post(unitController.addUnit); 

router.route('/unit-manage')
    .post(unitController.delUnit);

router.route('/employee-manage')
    .delete(employeeController.deleteEmployee)
    .post(employeeController.editEmployee)

router.route('/controllers/employee-controller')
    .post(employeeController.addEmployee);

router.route('/employee')
    .get(function (req, res) {
        if(req.isAuthenticated()) {
            connection.query('SELECT * FROM employee', function (err, result, fields) {
                if (err) throw err;
                renderHTML('./views/employee.ejs', res, { employee: result, role: req.user[0].role });
            });
        } else {
            connection.query('SELECT * FROM employee', function (err, result, fields) {
                if (err) throw err;
                renderHTML('./views/employee.ejs', res, { employee: result, role: "guest" });
            });
        }
    })



router.route('/upload')
    .post(employeeController.addEmployeeByExcel)

router.route('/session')
    .get((req, res) => {
        if (req.isAuthenticated()) {
            console.log(req.user[0].role)
            res.redirect('/employee')
        } else {
            res.redirect('/');
        }
    })

module.exports = router;