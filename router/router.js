const low = require('lowdb');
// https://github.com/typicode/lowdb
const db = low('db.json', { storage: fileAsync});
const fileAsync = require('lowdb/lib/storages/file-async');

module.exports = function(app) {

	app.get('/', checkAuth, (req,res) => {
		res.redirect('/app');
	});

	app.get('/login', (req, res) => {
		if (loogedUser.loggedin != true){
        	res.render('login', {title: 'myApp', 'message': 'Login', 'errMsg': ''});
		} else {
			res.redirect('/app');
		}
	});

	var authUserList = {
		admin: {
			name: 'Adminname',
			pwd: '12345',
			role: 'admin',
			id: 1
		},
		user:{
			name: 'Username',
			pwd: '54321',
			role: 'user',
			id: 2
		}
	}

	var loogedUser = {
		name: null,
		role: null,
		loggedin: false
	};

	app.post('/login', (req, res) => {
		if (authUserList.hasOwnProperty(req.body.name)) {
			loogedUser.name = authUserList[req.body.name].name;
			loogedUser.role = authUserList[req.body.name].role;
			loogedUser.loggedin = true;
			res.redirect('/app');
		} else {
			res.render('login', {title: 'myApp', message: 'Login', errMsg: 'login or pwd is not valid'});
		}
	});

	 app.get('/app', checkAuth, function(req, res) {
	 	var data = db.get('users').value();
		res.render('app', {userDetails: loogedUser, dbdata: data});

	});

	 app.get('/jsondata', function(req, res) {
	 	var data = db.get('users').value();
		res.json({ dbdata: data });
	});	

	
	app.post('/add', (req, res) => {
		db.get('users').push({
		id: Date.now(),
		name: req.body.name,
		login: req.body.login,
		pwd: req.body.pwd,
		role: req.body.roles,
		created: Date.now(),
		active: true
		}).write();
		res.redirect('/app');
	});

 	app.get('/logout', function(req, res) {
 		loogedUser.loggedin = false;
		res.redirect('/login');
	});

	app.delete('/delete/:id', function (req, res) {
		console.log(req.params.id);
		const id = parseInt(req.params.id);
    	db.get('users').remove({ id }).write();
		res.redirect('/app');
	});

	function checkAuth(req, res, next) {
		if (loogedUser.loggedin != true) {
			res.redirect('/login');
		} else {
			next();
		}
	}

}
