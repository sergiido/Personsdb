const low = require('lowdb');
// https://github.com/typicode/lowdb
// https://github.com/typicode/lowdb/tree/master/examples
const db = low('users.json', { storage: fileAsync});
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
			name: 'Admincheg',
			pwd: '12345',
			role: 'admin',
			id: 1
		},
		user:{
			name: 'Usercheg',
			pwd: '54321',
			role: 'user',
			id: 2
		}
	};

	app.post('/login', (req, res) => {
		// console.log(req.body);
		// console.log(req.body.name + ':' + req.body.pwd + ':' + req.body.rememberMe);
		// console.log(authUserList[req.body.name]['pwd']);

		if (authUserList.hasOwnProperty(req.body.name) && (authUserList[req.body.name]['pwd'] == req.body.pwd)) {
			if (req.body.rememberMe == 'on') {
				var oneMin = 60000;
				req.session.cookie.expires = new Date(Date.now() + oneMin*10);
    			req.session.cookie.maxAge = oneMin*10;
			} else {
				req.session.cookie.expires = false; // enable the cookie to remain for only the duration of the user-agent
			}
			req.session.user = {
				id:   authUserList[req.body.name].id,
				name: authUserList[req.body.name].name,
				role: authUserList[req.body.name].role
			};
			res.redirect('/app');
		} else {
			var userLoginDb = db.get('users').find({ login: req.body.name }).value();
			if ((userLoginDb != null)&&(userLoginDb.pwd == req.body.pwd)) {
				req.session.cookie.expires = false;
				req.session.user = {
					id:   userLoginDb.id,
					name: userLoginDb.name,
					role: userLoginDb.role
				};
				res.redirect('/app');
			} else {
				res.render('login', {title: 'Login', message: 'Login', errMsg: 'login or pwd is not valid'});
			}
		}
	});

	 app.get('/app', checkAuth, function(req, res) {
	// Set some defaults if your JSON file is empty
	// db.defaults({ posts: [], user: {} }).write()
	 	var data = db.get('users').value();
		res.render('app', {userDetails: req.session.user, dbdata: data});
	});

	 app.get('/jsondata', function(req, res) {
	 	var data = db.get('users').cloneDeep().value();
	 	res.header('Access-Control-Allow-Origin', '*');
	 	// console.log (data.length);
	 	data.forEach(function(obj){
	 		delete obj.pwd; //remove pwd key
	 	});
		res.send(JSON.stringify(data));
	});

	app.post('/add', checkAuth, (req, res) => {
		// console.log("add: " + req.body.name);
		const record = db.get('users').push({
			id: Date.now(),
			name: req.body.name,
			secondname: req.body.secondname,
			age: req.body.age,
			gender: req.body.gender,
			group: req.body.group,
			login: req.body.login,
			pwd: req.body.pwd,
			role: req.body.roles,
			created: Date.now(),
			active: true
		}).last()
		//.assign({ id: Date.now() })
		.write();
		if (record == 'undefined') {
			res.status(400).json({
				err: {status: 400, data: err, message: "failed to add"}
			});
		} else {
			res.status(200).json(record);
		}
	});

 	app.get('/logout', function(req, res) {
		if (req.session.user) {
			// res.clearCookie('rememberme');
			delete req.session.user;
		}
		res.redirect('/login');
	});

	app.delete('/delete/:id', checkAuth, function (req, res) {
		// console.log(req.params.id);
		const allowedUsers = ['admin'];
		if (allowedUsers.indexOf(req.session.user.role) != -1) {
			// console.log ("delete is allowed");
			const id = parseInt(req.params.id);
			db.get('users').remove({ id }).write();
		}
		res.redirect('/app');
	});

	app.put('/update/:id', checkAuth, function (req, res) {
		// console.log(req.params.id);
		// console.log(req.body._id);
		const id = parseInt(req.params.id);
		var record = db.get('users').find({ id: id }).value();
		console.log(record);
		if (record == 'undefined') {
			res.status(400).json({
				err: {status: 400, data: err, message: "failed to update..."}
			});
		} else {
			res.status(200).json(record);
			// res.send(obj);
		}
	});

	function checkAuth(req, res, next) {
		if (typeof req.session.user == 'undefined') {
			res.redirect('/login');
		} else {
			next();
		}
	}


}
