const util = require('util');

const low = require('lowdb');
// https://github.com/typicode/lowdb
// https://github.com/typicode/lowdb/tree/master/examples
const fileAsync = require('lowdb/lib/storages/file-async');

const usersdb = low('db/users.json', {storage: fileAsync});
const marksdb = low('db/marks.json', {storage: fileAsync});
const groupsdb = low('db/groups.json', {storage: fileAsync});

const formidable = require('formidable');
const fs = require('fs');

const bcrypt = require('bcrypt-nodejs');
// const salt = 'personspwdhash';

bcrypt.hash("testgroup", null, null, function(err, hash) {
    // Store hash in your password DB
	// $2a$10$38cofP8SNliuqwIXnZa9YelRfA23mGpnYwBCSWBJcjENIBmIHUaGW
    console.log("hash: " + hash);
});
bcrypt.compare("testgroup", "$2a$10$38cofP8SNliuqwIXnZa9YelRfA23mGpnYwBCSWBJcjENIBmIHUaGW", function(err, res) {
    // res == true
    console.log("compare:" + res);
});


module.exports = function(app) {

	app.get('/', checkAuth, (req,res) => {
		res.redirect('/app');
	});

	app.get('/login', (req, res) => {
		if (typeof req.session.user == 'undefined'){
        	res.render('login', {title: 'Blotter', 'message': 'Blotter v.' + process.env.npm_package_version, 'errMsg': ''});
		} else {
			res.redirect('/app');
		}
	});

	app.get('/register', (req, res) => {
        res.render('register', {title: 'Register', 'message': 'Register', 'errMsg': ''});
	});

	var authUserList = {
		admin: {
			name: 'Admincheg',
			pwd: '123',
			role: 'admin',
			id: 1
		},
		user:{
			name: 'Usercheg',
			pwd: '321',
			role: 'user',
			id: 2
		}
	};

	app.post('/login', (req, res) => {
		// console.log(req.body);
		// console.log(req.body.login + ':' + req.body.pwd + ':' + req.body.rememberMe);
		// console.log(authUserList[req.body.login]['pwd']);

		if (authUserList.hasOwnProperty(req.body.login) && (authUserList[req.body.login]['pwd'] == req.body.pwd)) {
			if (req.body.rememberMe == 'on') {
				var oneMin = 60000;
				req.session.cookie.expires = new Date(Date.now() + oneMin*10);
    			req.session.cookie.maxAge = oneMin*10;
			} else {
				req.session.cookie.expires = false; // enable the cookie to remain for only the duration of the user-agent
			}
			req.session.user = {
				id:   authUserList[req.body.login].id,
				name: authUserList[req.body.login].name,
				role: authUserList[req.body.login].role
			};
			res.redirect('/app');
		} else {
			var userLoginDb = usersdb.get('users').find({ login: req.body.login, active: true }).value();
			if ((userLoginDb != null)&&(userLoginDb.pwd == req.body.pwd)) {
				req.session.cookie.expires = false;
				req.session.user = {
					id:   userLoginDb.id,
					name: userLoginDb.name +" "+ userLoginDb.secondname,
					role: userLoginDb.role
				};
				res.redirect('/app');
			} else {
				res.render('login', {title: 'Login', message: 'Login', errMsg: 'login or pwd is not valid(active)'});
			}
		}
	});

	app.post('/register', (req, res) => {
		var regLogin = usersdb.get('users').find({ login: req.body.login }).value();
		if (regLogin != null) {
			res.render('register', {title: 'Register', message: 'Register', errMsg: 'login exists'});
		} else {
			usersdb.get('users').push({
				id: Date.now(),
				name: req.body.name,
				secondname: req.body.secondname,
				age: null,
				gender: null,
				groupid: null,
				email: req.body.email,
				login: req.body.login,
				pwd: req.body.pwd,
				role: "user",
				created: Date.now(),
				active: false
			}).last().write();
			// res.redirect('/login');
			res.render('login', {title: 'Login', message: 'Login', errMsg: 'Wait for your account activation'});
		}
	});

	app.get('/app', checkAuth, function(req, res) {
	// Set some defaults if your JSON file is empty
	// usersdb.defaults({ posts: [], user: {} }).write()
		var users = usersdb.get('users').cloneDeep().value();
		users.forEach(function(user){
			delete user.pwd;   //remove pwd key
		});
		var groups = groupsdb.get('groups').value();
		res.render('app', {userDetails: req.session.user, users: users, groups: groups});
	});


	app.get('/json/maint', function(req, res) {
		var data = usersdb.get('users').cloneDeep().value();
		res.header('Access-Control-Allow-Origin', '*');
		// console.log (data.length);
		data.forEach(function(obj){
			delete obj.login; //remove login key
			delete obj.pwd;   //remove pwd key
		});
		res.send(JSON.stringify(data));
	});


	function copyFile(src, dest) {
		var readStream = fs.createReadStream(src);
		readStream.once('error', (err) => {
			console.log(err);
		});
		readStream.once('end', () => {
			// console.log('---done copying---');
			// delete the file
			fs.unlink(src, function(err){
				if(err) return console.log(err);
				console.log(src + ' deleted successfully');
			});
		});
		readStream.pipe(fs.createWriteStream(dest));
	}


	app.post('/user/add', checkAuth, (req, res) => {
		// console.log("add name: " + req.body.name);

		// output the headers
		// console.log(req.headers);

		/* // capture the encoded form data
		req.on('data', (data) => {
			console.log(data.toString());
		});
		// send a response when finished reading the encoded form data
		req.on('end', () => {
			console.log('ok');
		}); */

		var form = new formidable.IncomingForm();

		form.uploadDir = __dirname+'/../tempuploads';
		form.keepExtensions = true;

		form.parse(req, function(err, fields, file) {
			// console.log('Got file:', file.ava.name);
			// console.log('Got a field: groupid=', fields.groupid);

			const allowedUsers = ['admin', 'editor'];
			if (allowedUsers.indexOf(req.session.user.role) != -1) {
				var userExists = usersdb.get('users').find({ login: fields.login }).value();
				if (userExists == null) {
					usersdb.get('users').push({
						id: Date.now(),
						name: fields.name,
						secondname: fields.secondname,
						age: fields.age,
						gender: fields.gender,
						groupid: parseInt(fields.groupid),
						email: fields.email || "",
						login: fields.login,
						pwd: fields.pwd,
						role: fields.roles,
						ava: file.ava.name,
						created: Date.now(),
						active: true
					}).last()
						//.assign({ id: Date.now() })
						.write()
						.then(function(newUser){
							var group = groupsdb.get('groups').find({ id: newUser.groupid }).value();
							var output = {
								name: newUser.name,
								secondname: newUser.secondname,
								age: newUser.age,
								gender: newUser.gender,
								groupid: group.name,
								email: newUser.email,
								login: newUser.login,
								// pwd: newUser.pwd,
								role: newUser.role,
								created: newUser.created,
								active: newUser.active
							};
							res.status(200).json(output);
						})
						.catch(err => res.status(400).json({message: "failed to add"}))
				} else {
					res.status(400).json({message: "user exists"});
				}
			}

		});

		form.on('file', function(name, file) {
			// console.log(name); // =ava
			// console.log(file);
			var temp_path = file.path;
			var file_name = file.name;			
			if (file.size != 0) {
				var destDir = __dirname+'/../public/uploads';
				fs.access(destDir, (err) => {
					if(err) fs.mkdirSync(destDir);
					copyFile(temp_path, (destDir+'/'+file_name));
				});
			} else {
				// delete the fsource ile
				console.log(temp_path);
				fs.unlink(temp_path, function(err){
					if(err) return console.log(err);
					console.log(temp_path + ' deleted successfully');
				});				
			}
		});

		// form.on('end', function() {
		// 	/* Temporary location of our uploaded file */
		// 	var temp_path = this.openedFiles[0].path;
		// 	/* The file name of the uploaded file */
		// 	var file_name = this.openedFiles[0].name;
		// });

	});

	app.get('/user/:id', checkAuth, function(req, res) {
	 	const id = parseInt(req.params.id);
	 	var user = usersdb.get('users').find({ id: id }).value();
	 	// console.log(user);
		if (user == 'undefined') {
			res.status(400).json({message: "user is not found"});
		} else {
			var group = groupsdb.get('groups').find({ id: user.groupid }).value();
			obj = {
				id: user.id,
				name: user.name,
				secondname: user.secondname,
				age: user.age,
				gender: user.gender,
				groupid: group.name,
				email: user.email,
				login: user.login,
				// pwd: user.pwd,
				role: user.role,
				ava: user.ava,
				active: user.active
			};
			res.status(200).json(obj);
		}
	});	

	app.post('/addgroup', checkAuth, (req, res) => {
		// console.log(util.inspect(req.body, {showHidden: false, depth: 2}));
		const allowedUsers = ['admin', 'editor'];
		if (allowedUsers.indexOf(req.session.user.role) != -1) {
			groupsdb.get('groups').push({
				id: Date.now(),
				name: req.body.name,
				created: Date.now(),
				active: true
			}).last().write()
			.then((group) => res.status(200).json(group) )
			.catch(err => res.status(400).json({message: "failed to add"}))
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
			var result = usersdb.get('users').remove({ id }).write();
// remove user's marks
			if (result == 'undefined') {
				res.status(400).json({ message: "failed to delete"});
			} else {
				res.status(200).json(result);
			}
		}
		// res.redirect('/app');
	});

	app.put('/update/:id', checkAuth, function (req, res) {
		// console.log(req.params.id);
		// console.log(req.body.name);
		const id = parseInt(req.params.id);
		usersdb.get('users').find({ id: id })
			.assign({
				name: req.body.name,
				secondname: req.body.secondname,
				age: req.body.age,
				gender: req.body.gender,
				groupid: parseInt(req.body.groupid),
				email: req.body.email,
				login: req.body.login,
				// pwd: req.body.pwd,
				role: req.body.role,
				//created: Date.now(),
				active: true
			}).write()
			.then(function(user){
				var group = groupsdb.get('groups').find({ id: parseInt(req.body.groupid)}).value();
				var output = {
					id: user.id,
					name: user.name,
					secondname: user.secondname,
					age: user.age,
					gender: user.gender,
					groupid: group.name,
					email: user.email,
					login: user.login,
					// pwd: user.pwd,
					role: user.role,
					created: user.created,
					active: true
				};
				res.status(200).json(output);
			})
			.catch(err => res.status(400).json({message: "failed to add"}));
	});

	function checkAuth(req, res, next) {
		if (typeof req.session.user == 'undefined') {
			res.redirect('/login');
		} else {
			next();
		}
	}

	app.get('/marks/user/:id', checkAuth, function(req, res) {
	 	const id = parseInt(req.params.id);
	 	var user = usersdb.get('users').find({ id: id }).value();
	 	// console.log(user);
		if (user == 'undefined') {
			res.status(400).json({message: "user not found"});
		} else {
			var group = groupsdb.get('groups').find({ id: user.groupid }).value();
	 		var marks = marksdb.get('marks').value();
			marks.forEach(function(mark){
				if (user.id == mark.userid) {
					obj = {
						id: mark.id,
						name: user.name,
						secondname: user.secondname,
						group: group.name,
						hw1: mark.hw1.mark,
						hw2: mark.hw2.mark,
						cw1: mark.cw1.mark,
						cw2: mark.cw2.mark
					};
				}
			});
			res.status(200).json(obj);
		}
	});

	app.get('/marks/group/:id', checkAuth, function(req, res) {
		const id = parseInt(req.params.id);
		var group = groupsdb.get('groups').find({ id: id }).value();
		var users = usersdb.get('users').filter({groupid: id}).value();
		var marks = marksdb.get('marks').value();
		if (users == 'undefined') {
			res.status(400).json({message: "no users in group"});
		} else {
			var output = [];
			users.forEach(function(user){
				var obj = {
					id: null,
					userid: user.id,
					name: user.name,
					secondname: user.secondname,
					group: group.name,
					hw1: null,
					hw2: null,
					cw1: null,
					cw2: null
				};
				marks.forEach(function(mark){
					if (user.id == mark.userid) {
						obj = {
							id: mark.id,
							userid: user.id,
							name: user.name,
							secondname: user.secondname,
							group: group.name,
							hw1: mark.hw1.mark,
							hw2: mark.hw2.mark,
							cw1: mark.cw1.mark,
							cw2: mark.cw2.mark
						};
					}
				});
				output.push(obj);
			});
			res.status(200).json(output);
		}
	});


	app.put('/mark/:id', checkAuth, function (req, res) {
		const id = parseInt(req.params.id);
		const record = marksdb.get('marks').find({ id: id })
			.assign({
				hw1: {
					created: Date.now(),
					mark: req.body.hw1},
				hw2: {
					created: Date.now(),
					mark: req.body.hw2},
				cw1: {
					created: Date.now(),
					mark: req.body.cw1},
				cw2: {created: Date.now(),
					mark: req.body.cw2}
			}).write();
		if (record == 'undefined') {
			res.status(400).json({message: "failed to update"});
		} else {
			res.status(200).json(record);
		}
	});


	app.post('/mark', checkAuth, (req, res) => {
		const allowedUsers = ['admin', 'editor'];
		if (allowedUsers.indexOf(req.session.user.role) != -1) {
			const record = marksdb.get('marks').push({
				id: Date.now(),
				userid: req.body.userid,
				hw1: {
					created: Date.now(),
					mark: req.body.hw1},
				hw2: {
					created: Date.now(),
					mark: req.body.hw2},
				cw1: {
					created: Date.now(),
					mark: req.body.cw1},
				cw2: {created: Date.now(),
					mark: req.body.cw2}
			}).last().write();
			if (record == 'undefined') {
				res.status(400).json({message: "failed to add"});
			} else {
				res.status(200).json(record);
			}
		}
	});

}