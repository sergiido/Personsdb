const low = require('lowdb');
// https://github.com/typicode/lowdb
const db = low('db.json', { storage: fileAsync});
const fileAsync = require('lowdb/lib/storages/file-async');

module.exports = function(app) {

	app.get('/', checkAuth, (req,res) => {
		res.redirect('/app');
	});

	app.get('/login', (req, res) => {
		if (typeof req.session.user == 'undefined'){
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
	};

	app.post('/login', (req, res) => {
		// console.log(req.body);
		// console.log(req.body.name + ':' + req.body.pwd + ':' + req.body.rememberMe);
		if (authUserList.hasOwnProperty(req.body.name)) {
			if (req.body.rememberMe == 'on') {
				var oneMin = 60000;
				req.session.cookie.expires = new Date(Date.now() + oneMin*10);
    			req.session.cookie.maxAge = oneMin*10;
			} else {
				req.session.cookie.expires = false; // enable the cookie to remain for only the duration of the user-agent
			}
			req.session.user = {
				id:   authUserList[req.body.name]._id,
				name: authUserList[req.body.name].name,
				role: authUserList[req.body.name].role
			};
			res.redirect('/app');
	// var userLoginDb = db.get('users').find({ login: req.body.name });
	// console.log("--- from db: " + userLoginDb.login);
		} else {
			res.render('login', {title: 'myApp', message: 'Login', errMsg: 'login or pwd is not valid'});
		}
	});

	 app.get('/app', checkAuth, function(req, res) {
	 	var data = db.get('users').value();
		res.render('app', {userDetails: req.session.user, dbdata: data});
	});

	 app.get('/jsondata', function(req, res) {
	 	var data = db.get('users').value();
	 	res.header('Access-Control-Allow-Origin', '*');
		res.send(JSON.stringify(data));
	});

	app.post('/add', checkAuth, (req, res) => {
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
		if (req.session.user) {
			// res.clearCookie('rememberme');
			delete req.session.user;
		}
		res.redirect('/login');
	});

	app.delete('/delete/:id', checkAuth, function (req, res) {
		console.log(req.params.id);
		const id = parseInt(req.params.id);
    	db.get('users').remove({ id }).write();
		res.redirect('/app');
	});

	function checkAuth(req, res, next) {
		if (typeof req.session.user == 'undefined') {
			res.redirect('/login');
		} else {
			next();
		}
	}

}
