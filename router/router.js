const quiz = require('./quests');

const low = require('lowdb');
const fileAsync = require('lowdb/lib/storages/file-async');

const usersdb = low('db/users.json', {storage: fileAsync});
const marksdb = low('db/marks.json', {storage: fileAsync});
const groupsdb = low('db/groups.json', {storage: fileAsync});

const formidable = require('formidable');
const fs = require('fs');

const bcrypt = require('bcrypt-nodejs');

console.log('router - started ...');
console.log('process.env.OPENSHIFT_KEY_1: ' + process.env.OPENSHIFT_KEY_1);

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
			quiz: 'html',
			id: 1
		},
		editor: {
			name: 'Editorcheg',
			pwd: '321',
			role: 'editor',
			id: 2
		}
	};

	app.post('/login', (req, res) => {
		// console.log(req.body);
		// console.log(req.body.login + ':' + req.body.pwd + ':' + req.body.rememberMe);
		// console.log(authUserList[req.body.login]['pwd']);

		if (authUserList.hasOwnProperty(req.body.login) && (authUserList[req.body.login]['pwd'] == req.body.pwd)) {

			req.session.user = {
				id:   authUserList[req.body.login].id,
				name: authUserList[req.body.login].name,
				role: authUserList[req.body.login].role,
				quiz: authUserList[req.body.login].quiz
			};
			res.redirect('/app');
		} else {
			var userLoginDb = usersdb.get('users').find({ login: req.body.login, active: true });
			userLoginDbValue = userLoginDb.value();
			if (userLoginDbValue != null) { //userLoginDbValue.pwd == req.body.pwd
				bcrypt.compare(req.body.pwd, userLoginDbValue.pwd, function(err, pwdComp) {
					if (pwdComp) {
						if (req.body.rememberMe == 'on') {
							var oneMin = 60000;
							req.session.cookie.expires = new Date(Date.now() + oneMin * 10);
			    			req.session.cookie.maxAge = oneMin * 10;
						} else {
							req.session.cookie.expires = false; // enable the cookie to remain for only the duration of the user-agent
						}
						req.session.user = {
							id:   userLoginDbValue.id,
							name: userLoginDbValue.name +" "+ userLoginDbValue.secondname,
							role: userLoginDbValue.role,
							quiz: userLoginDbValue.quiz
						};

						// update last login value
						userLoginDb.assign({'lastlogin': Date.now()}).write();

						res.redirect('/app');
					} else {
						res.render('login', {title: 'Login', message: 'Login', errMsg: 'login or pwd is not valid(active)'});
					}
				});
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
			bcrypt.hash(req.body.pwd, null, null, function(err, hash) {
				usersdb.get('users').push({
					id: Date.now(),
					name: req.body.name,
					secondname: req.body.secondname,
					age: null,
					gender: null,
					groupid: null,
					email: req.body.email,
					login: req.body.login,
					pwd: hash,
					role: "user",
					ava: null,
					quiz: "empty",
					created: Date.now(),
					lastlogin: null,
					active: false
				}).last().write();
			});
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
		res.render('app', {activeTab: "maint", userDetails: req.session.user, users: users, groups: groups});
	});

	app.get('/marks', checkAuth, function(req, res) {
		var users = usersdb.get('users').cloneDeep().value();
		users.forEach(function(user){
			delete user.pwd;   //remove pwd key
		});
		var groups = groupsdb.get('groups').value();		
		res.render('app', {activeTab: "marks", userDetails: req.session.user, users: users, groups: groups});
	});

	app.get('/json/maint', function(req, res) {
		var data = usersdb.get('users').cloneDeep().value();
		res.header('Access-Control-Allow-Origin', '*');
		// console.log (data.length);
		// data.forEach(function(obj){
		// 	delete obj.login; //remove login key
		// 	delete obj.pwd;   //remove pwd key
		// });
		res.send(JSON.stringify(data));
	});


	app.post('/json/upload', function(req, res) {
		req.setEncoding('utf8');
  		req.rawBody = '';
  		req.on('data', function(chunk) {
			req.rawBody += chunk;
		});
		req.on('end', function(){
			var usersArr = JSON.parse(req.rawBody);
			// console.log(JSON.parse(req.rawBody));
			// console.log(usersArr[0].name);
			var absentGroups = [];
			for (var i = 0; i < usersArr.length; i++) {
				var group = groupsdb.get('groups').find({ id: usersArr[i].groupid }).value();
				if (group == null && absentGroups.indexOf(usersArr[i].groupid) === -1) {
					absentGroups.push(usersArr[i].groupid);
				}
				usersdb.get('users').push({
					id: usersArr[i].id,
					name: usersArr[i].name,
					secondname: usersArr[i].secondname,
					age: usersArr[i].age,
					gender: usersArr[i].gender,
					groupid: usersArr[i].groupid,
					email: usersArr[i].email,
					login: usersArr[i].login,
					pwd: usersArr[i].pwd,
					role: usersArr[i].role,
					ava: usersArr[i].ava,
					quiz: usersArr[i].quiz,
					created: usersArr[i].created,
					lastlogin: usersArr[i].lastlogin,
					active: usersArr[i].active
				}).last()
				.write();
			}
			// console.log(absentGroups);
			if (absentGroups.length > 0){
				groupsdb.get('groups').push({
					id: absentGroups[0], // defect: create ALL groups
					name: absentGroups[0].toString(),
					created: Date.now(),
					active: true
				}).last().write();
			}
			res.status(200).json({res:usersArr.length + " users loaded"});		
			/*
			fs.writeFile('db/users.json', req.rawBody, function (err) {
				if (err) throw err;
				// console.log('Saved!');
			});
			*/
		});
	});


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
		form.uploadDir = __dirname + '/../tempuploads';
		form.keepExtensions = true;
		form.parse(req, function(err, fields, file) {
			// console.log('Got file:', file.ava.name);
			// console.log('Got a field: groupid=', fields.groupid);
			const allowedUsers = ['admin', 'editor'];
			if (allowedUsers.indexOf(req.session.user.role) != -1) {
				var userExists = usersdb.get('users').find({ login: fields.login }).value();
				if (userExists == null) {
					bcrypt.hash(fields.pwd, null, null, function(err, hash) {
						// console.log(fields.pwd + ": " + hash);
						usersdb.get('users').push({
							id: Date.now(),
							name: fields.name,
							secondname: fields.secondname,
							age: fields.age,
							gender: fields.gender,
							groupid: parseInt(fields.groupid),
							email: fields.email || "",
							login: fields.login,
							pwd: hash, //fields.pwd,
							role: fields.roles,
							ava: file.ava.name,
							quiz: fields.qiuz,
							created: Date.now(),
							lastlogin: null,
							active: true
						}).last()//.assign({ id: Date.now() })
						.write()
						.then(function(newUser){
							var group = groupsdb.get('groups').find({ id: newUser.groupid }).value();
							var output = {
								id: newUser.id,
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
								lastlogin: null,
								active: newUser.active
							};
							res.status(200).json(output);
						})
						.catch(err => res.status(200).json({message: "failed to add"}));
					});
				} else {
					res.status(200).json({message: "user exists"});
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
			res.status(200).json({message: "user is not found"});
		} else {
		// перебрать пришедший объект и удалить из него ключи с null или undefined
			var group = groupsdb.get('groups').find({ id: user.groupid }).value();
			// console.log ("group: ") + group;
			if (group != null) {
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
					quiz: user.quiz,
					active: user.active
				};
			} else {
				obj = {
					id: user.id,
					name: user.name,
					secondname: user.secondname,
					email: user.email,
					login: user.login,
					role: user.role,
					quiz: user.quiz,
					active: user.active
				};
			}
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
			.catch(err => res.status(200).json({message: "failed to add"}))
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
			usersdb.get('users').remove({ id }).write()
			.then(function(user) {
				// console.log(user[0].id);
				// remove user's marks if exist
				var mark = marksdb.get('marks').find({ userid: user[0].id }).value();
				// console.log(mark);
				if (mark != 'undefined') {
					marksdb.get('marks').remove({ userid: user[0].id }).write();
				}
				res.status(200).json(user[0].id);
			} )
			.catch(err => res.status(200).json({message: "failed to delete"}));
		}
	});


	app.put('/update/:id', checkAuth, function (req, res) {
		// console.log(req.params.id);
		// console.log(req.body.quiz);
		var oldAva = true;
		if (req.body.ava) {
			var extension = (req.body.ava).substring("data:image/".length, (req.body.ava).indexOf(";base64")).toLowerCase();
			var base64Data = req.body.ava.replace(/^data:image\/([a-zA-Z]*);base64,/, "");
			require("fs").writeFile("./public/uploads/user"+ req.params.id+"."+ extension, base64Data, 'base64', function(err) {
				if (err) console.log(err);
			});
			oldAva = false;
		}
		const id = parseInt(req.params.id);
		var user = usersdb.get('users').find({ id: id }).value();
		var prevUserActive = user.active;
		if (req.body.pwd == "") {
			// DEFECT: заменяет null на пустую строку в базе			
			usersdb.get('users').find({ id: id })
				.assign({
					name: req.body.name,
					secondname: req.body.secondname,
					age: req.body.age,
					gender: req.body.gender,
					groupid: parseInt(req.body.groupid),
					email: req.body.email,
					login: req.body.login,
					ava: (oldAva) ? (user.ava) : ("user"+ req.params.id +"."+ extension),
					role: req.body.role,
					quiz: req.body.quiz,
					active: (req.body.active === 'on') ? true : false,
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
						role: user.role,
						quiz: user.quiz,
						created: user.created,
						active: user.active
					};
					// send e-mail
					/*if (!prevUserActive && user.active) {
						sgMail.setApiKey("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");
						const msg = {
						  to: user.email,
						  from: 'htmljs@qastartup.com',
						  subject: 'Your account is activated',
						  text: 'Your account is activated. HTML + JS QA StartUp',
						  html: 'Hi ' + user.name + '. <br/>Your account '+user.login+ ' is activated. <br/>You can log in now using your credentials. <br/><br/> HTML + JS QA StartUp',
						};
						sgMail.send(msg);	
					}*/
					res.status(200).json(output);
				})
				.catch(err => res.status(200).json({message: "failed to add"}));
		} else {
			bcrypt.hash(req.body.pwd, null, null, function(err, hash) {
				usersdb.get('users').find({ id: id })
					.assign({
						name: req.body.name,
						secondname: req.body.secondname,
						age: req.body.age,
						gender: req.body.gender,
						groupid: parseInt(req.body.groupid),
						email: req.body.email,
						login: req.body.login,
						pwd: hash,
						role: req.body.role,
						quiz: 'html',
						active: (req.body.active === 'on') ? true : false,
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
							quiz: 'html',
							created: user.created,
							active: user.active
						};
						res.status(200).json(output);
					})
					.catch(err => res.status(200).json({message: "failed to add"}));
			});
		}
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
 		var marks = marksdb.get('marks').value();
 		// console.log(marks);
		obj = {
			id: null,
			name: user.name,
			secondname: user.secondname,
			//group: group.name,
			hw1: "0",
			hw2: "0",
			cw1: "0",
			cw2: "0"
		};
		marks.forEach(function(mark){
			if (user.id == mark.userid) {
				obj = {
					id: mark.id,
					name: user.name,
					secondname: user.secondname,
					//group: group.name,
					hw1: mark.hw1.mark,
					hw2: mark.hw2.mark,
					cw1: mark.cw1.mark,
					cw2: mark.cw2.mark
				};
			} 
		});
		res.status(200).json(obj);
	});

	app.get('/marks/group/:id', checkAuth, function(req, res) {
		const id = parseInt(req.params.id);
		// var group = groupsdb.get('groups').find({ id: id }).value();
		var users = usersdb.get('users').filter({groupid: id}).value();
		// var marks = marksdb.get('marks').value();
		var output = [];
		if (users != null) {
			// users.forEach(function(user) {
			for (var user = 0; user < users.length; user++) {
				var userMarks = marksdb.get('marks').filter({userid: users[user].id}).value();
				// console.log(userMarks);
				if (userMarks.length != 0) {
					obj = {
						id: userMarks[0].id,
						userid: users[user].id,
						name: users[user].name,
						secondname: users[user].secondname,
						//group: group.name,
						hw1: userMarks[0].hw1.mark,
						hw2: userMarks[0].hw2.mark,
						cw1: {
							created: userMarks[0].cw1.created,
							mark: userMarks[0].cw1.mark
						},
						cw2: userMarks[0].cw2.mark
					};
				} else {
					var obj = {
						id: null,
						userid: users[user].id,
						name: users[user].name,
						secondname: users[user].secondname,
						//group: group.name,
						hw1: null,
						hw2: null,
						cw1: {
							created: null,
							mark: null
						},
						cw2: null
					};
				}
				output.push(obj);
			}
			// });
		}
		res.status(200).json(output);
	});

	app.put('/mark/:id', checkAuth, function (req, res) {
		const id = parseInt(req.params.id);
		const allowedUsers = ['admin', 'editor'];
		if (allowedUsers.indexOf(req.session.user.role) != -1) {

			var userMarks = marksdb.get('marks').find({ userid: id }).value();
			// console.log(userMarks);
			if (!userMarks) {
				marksdb.get('marks').push({
					id: Date.now(),
					userid: id,
					hw1: {
						created: Date.now(),
						mark: req.body.hw1},
					hw2: {
						created: Date.now(),
						mark: req.body.hw2},
					cw1: {
						created: Date.now(),
						mark: "0"},
					cw2: {
						created: Date.now(),
						mark: "0"}
				}).last().write()
				.then((record) => res.status(200).json(record) )
				.catch(err => res.status(200).json({message: "failed to update"}));
			} else {
				marksdb.get('marks').find({ userid: id }).assign({
					hw1: {
						created: Date.now(),
						mark: req.body.hw1},
					hw2: {
						created: Date.now(),
						mark: req.body.hw2}//,
					// cw1: {
					// 	created: Date.now(),
					// 	mark: req.body.cw1},
					// cw2: {
					// 	created: Date.now(),
					// 	mark: req.body.cw2}
				}).write()
				.then((record) => res.status(200).json(record) );
			}
		}
	});

	app.get('/quizstart', (req, res) => {
		quiz.getQuestions(function(resp) {
			//console.log (resp);
			res.status(200).json(resp);
		});
	});

	app.post('/getAnswers', (req, res) => {
		// console.log(req.body);
		// console.log((req.body).a1);
		quiz.checkAnswers(req.body, function(resp) {
			// console.log (req.session.user.id);
			req.session.user.quiz = null;
			var userMarks = marksdb.get('marks').find({ userid: req.session.user.id }).value();
			if (!userMarks) {
				marksdb.get('marks').push({
					id: Date.now(),
					userid: req.session.user.id,
					hw1: {
						created: Date.now(),
						mark: "0"},
					hw2: {
						created: Date.now(),
						mark: "0"},
					cw1: {
						created: Date.now(),
						mark: Math.round(resp/10).toString()},
					cw2: {
						created: Date.now(),
						mark: "0"}
				}).last().write()
				.then((record) => {
					usersdb.get('users').find({ id: req.session.user.id })
						.assign({
							quiz: null
						}).write();
					res.status(200).json({score: resp})
			}) } else {
				marksdb.get('marks').find({ userid: req.session.user.id }).assign({
					cw1: {
						created: Date.now(),
						mark: Math.round(resp/10)}
				}).write()
				.then((record) => {
					// console.log(resp);
					usersdb.get('users').find({ id: req.session.user.id })
						.assign({
							quiz: null
						}).write();
					res.status(200).json({score: resp})})
				.catch(err => console.log("failed to find the user in marks table"))
			}
		});
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

}
