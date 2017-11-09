window.onload = function(){

}

function showLoadPop() {
	var inputUploadJson = document.querySelector('#loadPersons>input');
	inputUploadJson.click();
	inputUploadJson.addEventListener("change", function(e) {
		// console.log(e.target.nodeName);
		// console.log (this.files[0]);
		var reader = new FileReader();
		reader.onload = function() {
			// console.log(reader.result);
			var xhr = new XMLHttpRequest();
			xhr.open("POST", "/json/upload", true);
			xhr.onreadystatechange = function () {
				if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
					// console.log(xhr.responseText);
					$.notify(JSON.parse(xhr.responseText).res, {
						className: 'success',
  						globalPosition: 'top center'});
				};
			};
			xhr.send(reader.result);
		};
		reader.readAsText(this.files[0]);
	});
}


function readSingleFile(fileInput) {
	var image = document.getElementById('userava');
  	var file  = fileInput.files[0];
	// console.log(file.size);
	var reader = new FileReader();
	reader.onload = function() {
		if (file.size < 100000) {
			image.src = reader.result;
		} else {
			alert ("File size > 100Kb");
		}
	};
	reader.readAsDataURL(file);
}

function showPersonPop(action) {
	var personmodal = document.getElementById('personpopup');
	document.forms[0].reset();
	// document.forms.addperson.reset();
	if (action == 'add') {
		document.getElementById('userava').src = "images/no_ava.png";
		document.querySelector('.form-app fieldset').disabled = false;
		document.querySelector('.form-app>h3').innerHTML = "&#xf2bb; Add person";
		document.querySelector('.form-app>form').setAttribute("name", "addperson");
		document.querySelector('.form-app>form').setAttribute("onsubmit", "event.preventDefault(); addPerson();");
		document.querySelector('.form-app>form>div>button[type="submit"]').innerHTML = "&#xf234; Add";
	} else {
		document.getElementById('spinner').classList.add("cssload-loader");
		document.querySelector('.form-app>h3').innerHTML = "&#xf2bb; Update person";
		document.querySelector('.form-app>form').setAttribute("name", "updateperson");
		document.querySelector('.form-app>form').setAttribute("onsubmit", "event.preventDefault(); updatePerson();");
		document.querySelector('.form-app>form>div>button[type="submit"]').innerHTML = "&#xe80d; Update";
		var userId = action; //updateBtn.dataset.userid;
		var reqDataObj = {
			method: "GET",
			uri: "/user/" + userId,
			action: "Get"
		};
		sendAjax(reqDataObj, function(res) {
			personmodal.querySelector('input[name="userid"]').value = res.id;
			personmodal.querySelector('input[name="name"]').value = res.name;
			var img = new Image();
			img.src = 'uploads/'+ res.ava;
			img.onload = function () {
				document.getElementById('userava').src = img.src;
				document.getElementById('spinner').classList.remove("cssload-loader");
			};
			img.onerror = function(){
				document.getElementById('userava').src = "images/no_ava.png";
				document.getElementById('spinner').classList.remove("cssload-loader");
			}
			personmodal.querySelector('input[name="secondname"]').value = res.secondname;
			personmodal.querySelector('input[name="age"]').value = res.age;
			personmodal.querySelector('select[name="gender"]').value = res.gender;
			groups.forEach(function(group){
				if (group.name == res.groupid) {
					personmodal.querySelector('select[name="groupid"]').value = group.id;
				}
			});
			personmodal.querySelector('input[name="email"]').value = res.email;
			personmodal.querySelector('input[name="login"]').value = res.login;
			// personmodal.querySelector('input[name="pwd"]').value = res.pwd;
			personmodal.querySelector('select[name="roles"]').value = res.role;
			personmodal.querySelector('select[name="quiz"]').value = res.quiz;
			personmodal.querySelector('input[type="checkbox"]').checked = res.active;
			document.querySelector('.form-app fieldset').disabled = false;
		});
	}

	personmodal.style.display = "block";
	var personPopCloseBtn = personmodal.getElementsByClassName("close")[0];
	personPopCloseBtn.onclick = function() {
		personmodal.style.display = "none";
	}
}


function showAddGroupPop() {
	var groupmodal = document.getElementById('grouppopup');
	document.forms.addgroup.reset();
	groupmodal.style.display = "block";
	var groupPopCloseBtn = groupmodal.getElementsByClassName("close")[0];
	groupPopCloseBtn.onclick = function() {
		groupmodal.style.display = "none";
	}
}

function addPerson(){
	var formData = new FormData(document.forms.addperson);
	// for (var pair of formData.entries()){
	// 	console.log(pair[0]+ ', '+ pair[1]);
	// }
	// console.log('ava:' + formData.get('ava'));
	var reqDataObj = {
		method: "POST",
		uri: "/user/add",
		/*objData: {name: formData.get('name'),
			secondname: formData.get('secondname'),
			age:        formData.get('age'),
			gender:     formData.get('gender'),
			groupid:    formData.get('groupid'),
			email:      formData.get('email'),
			login:      formData.get('login'),
			pwd:        formData.get('pwd'),
			roles:      formData.get('roles')
		},*/
		objData: formData,
		action: "Add"
	};
	sendFormData(reqDataObj, function(res){
	    document.getElementById('personpopup').style.display = "none";
		// console.log("res: " + res);
		addRow('userTable', res);
	});
}


function updatePerson(){
	var personmodal = document.getElementById('personpopup');
	// personmodal.querySelector('select[name="groupid"]').disabled = false;
	personmodal.querySelector('input[name="status"]').disabled = false;
	personmodal.querySelector('select[name="quiz"]').disabled = false;

	var formData = new FormData(document.forms.updateperson);
	var userId = formData.get('userid');
	// console.log(userId);
	var reqDataObj = {
		method: "PUT",
		uri: "/update/" + userId,
		objData: {
			name: formData.get('name'),
			secondname: formData.get('secondname'),
			age: formData.get('age'),
			gender: formData.get('gender'),
			groupid: formData.get('groupid'),
			email: formData.get('email'),
			login: formData.get('login'),
			pwd: formData.get('pwd'),
			role: formData.get('roles'),
			//ava:  document.getElementById('userava').src,
			quiz: formData.get('quiz'),
			active: formData.get('status')
		},
		action: "Update"
	};
	if ((/base64/).test(document.getElementById('userava').src)) {
		reqDataObj.objData.ava = document.getElementById('userava').src;
	}
	sendAjax(reqDataObj, function(res){
		document.getElementById('personpopup').style.display = "none";
		// console.log(res);
		var personRow = document.getElementById(res.id);
		personRow.childNodes[1].innerHTML = res.name;
		personRow.childNodes[2].innerHTML = res.secondname;
		personRow.childNodes[3].innerHTML = res.age;
		var genderClass;
		if (res.gender == 'male') {
			res.gender = "&#xf183;";
			genderClass = "male";
		} else if (res.gender == 'female') {
			res.gender = "&#xf182;";
			genderClass = "female";
		} else {
			res.gender = "-";
		}
		genderClass += " customfont";
		personRow.childNodes[4].innerHTML = res.gender;
		personRow.childNodes[4].className = genderClass;
		personRow.childNodes[5].innerHTML = res.groupid;
		personRow.childNodes[6].innerHTML = res.email.substr(0, res.email.indexOf("@")+1);
		personRow.childNodes[6].title = res.email;
		personRow.childNodes[7].innerHTML = res.login;
		// personRow.childNodes[8].innerHTML = res.pwd;
		personRow.childNodes[8].innerHTML = res.role;
		personRow.childNodes[9].innerHTML = formatDate(res.created);
		personRow.childNodes[10].innerHTML = res.active;
	});
	// href='/update/#{item._id}?_method=PUT'
}


function deletePerson(rowId){
	var reqDataObj = {
		method: "DELETE",
		uri: "/delete/" + rowId,
		action: "Delete"
	};
	sendAjax(reqDataObj, function(res){
		deleteRow(rowId);
		// console.log(res);
	});
}


function addGroup(){
	var formData = new FormData(document.forms.addgroup);
	var reqDataObj = {
		method: "POST",
		uri: "/addgroup",
		objData: {
			name: formData.get('groupname')
		},
		action: "Add"
	};
	sendAjax(reqDataObj, function(res){
	    document.getElementById('grouppopup').style.display = "none";
	    // add created option to select group dropdown on User pop up
	    var select = document.getElementById("groupselect");
	    var option = document.createElement('option');
	    option.value = res.id;
	    option.innerHTML = res.name;
	    select.appendChild(option);
		// console.log("res: " + res);
	});
}


function sendFormData(reqDataObj, callback) {
	$.ajax({
		type: reqDataObj.method,
		url: reqDataObj.uri,
		data: (reqDataObj.objData) || null,
		processData: false, //prevent jQuery from automatically transforming the data into a query
		contentType: false,
		success: function(res) {
			callback (res);
			$.notify(reqDataObj.action + " success", {
				className: 'success',
  				globalPosition: 'top center'});
		},
		error: function(res) {
			// console.log(res);
			$.notify(reqDataObj.action  + " error: " + JSON.parse(res).message, {
				className: "warn",
  				globalPosition: 'top center'});
		}
	});
}


function sendAjax(reqDataObj, callback) {
	// console.log(reqDataObj.objData);
	$.ajax({
		type: reqDataObj.method,
		url: reqDataObj.uri,
		data: (reqDataObj.objData) || null,
		success: function(res) {
			callback (res);
			$.notify(reqDataObj.action + " success", {
				className: 'success',
  				globalPosition: 'top center'});
		},
		error: function(res) {
			console.log(res);
			$.notify(reqDataObj.action  + " error: " + JSON.parse(res).message, {
				className: "warn",
  				globalPosition: 'top center'});
		}
	});
}


function addRow(tableName, res) {
	var userTable = document.getElementById(tableName);
	var len = userTable.rows.length;
	var row = userTable.insertRow(len);
	row.id =res.id;
	row.insertCell(0).innerHTML = len;
	row.insertCell(1).innerHTML = res.name;
	row.insertCell(2).innerHTML = res.secondname;
	row.insertCell(3).innerHTML = res.age;
	// console.log(res.gender);
	var gender, genderClass;
	if (res.gender == 'male') {
		gender = '&#xf183;';
		genderClass = 'customfont male';
	} else if (res.gender == 'female') {
		gender = '&#xf182;';
		genderClass = 'customfont female';
	} else {
		gender = "-";
		genderClass = 'center';
	}
	var cell4 = row.insertCell(4);
	cell4.innerHTML = gender;
	cell4.className = genderClass;

	row.insertCell(5).innerHTML = res.groupid;
	row.insertCell(6).innerHTML = res.email.substr(0, res.email.indexOf("@")+1);
	// row.insertCell(6).title = res.email;
	row.insertCell(7).innerHTML = res.login;
	row.insertCell(8).innerHTML = res.role;
	row.insertCell(9).innerHTML = res.created;
	row.insertCell(10).innerHTML = res.active;
	var updateBtn = '<button class="customfont" onclick="showPersonPop(' +res.id+ ')" data-userid=' +res.id+ ' style="color: orange"> &#xe804; </button>';
	row.insertCell(11).innerHTML = updateBtn;
}


function deleteRow(rowid) {
    var row = document.getElementById(rowid);
    row.parentNode.removeChild(row);
}


function getPersonMarks(userId) {
	var reqDataObj = {
		method: "GET",
		uri: "/marks/user/" + userId,
		action: "Get"
	};
	sendAjax(reqDataObj, function(res) {
		// add row
		var userTable = document.getElementById("marksTable");
		var rowCount = userTable.rows.length;
		for (var i = rowCount; i > 1; i--) {
			userTable.deleteRow(i - 1);
		}
		var row = userTable.insertRow(1);
		row.insertCell(0).innerHTML = 1;
		row.insertCell(1).innerHTML = res.id;
		row.insertCell(2).innerHTML = res.name;
		row.insertCell(3).innerHTML = res.secondname;
		// row.insertCell(4).innerHTML = res.group;
		row.insertCell(4).innerHTML = res.hw1;
		row.insertCell(5).innerHTML = res.hw2;
		row.insertCell(6).innerHTML = res.cw1;
		row.insertCell(7).innerHTML = res.cw2;
		row.insertCell(8).innerHTML = "no access";
		// console.log(res);
	});
}


function getGroupMarks() {

	var groupSelect = document.querySelector("div#marks select");
	var value = groupSelect.value;
	var reqDataObj = {
		method: "GET",
		uri: "/marks/group/" + value,
		action: "Get"
	};
	sendAjax(reqDataObj, function(res) {
		// add row
		var userTable = document.getElementById("marksTable");
		var rowCount = userTable.rows.length;
		for (var i = rowCount; i > 1; i--) {
			userTable.deleteRow(i - 1);
		}
		for (var i = 0; i < res.length; i++) {
			console.log(res[i]);
			var row = userTable.insertRow(i + 1);
			// console.log(res[i].userid);
			// if (res[i].id != null) row.id = res[i].userid;
			row.insertCell(0).innerHTML = i + 1;
			row.insertCell(1).innerHTML = res[i].id;
			row.insertCell(2).innerHTML = res[i].name;
			row.insertCell(3).innerHTML = res[i].secondname;
			// row.insertCell(4).innerHTML = res[i].group;
			if (res[i].hw1 == null) res[i].hw1=0
			row.insertCell(4).innerHTML = '<div class="markincell" oninput="paintBtn(this)" style="border: 1px solid #0B4C5F" contenteditable="true">'+ res[i].hw1 +'</div>';
			if (res[i].hw2 == null) res[i].hw2=0
			row.insertCell(5).innerHTML = '<div class="markincell" oninput="paintBtn(this)" style="border: 1px solid #0B4C5F" contenteditable="true">'+ res[i].hw2 +'</div>';
			if (res[i].cw1.mark == null) res[i].cw1.mark=0
			row.insertCell(6).innerHTML = '<div class="center" title="'+ formatDate(res[i].cw1.created) + '"><u>'+ res[i].cw1.mark +'</u></div>';
			if (res[i].cw2 == null) res[i].cw2=0
			row.insertCell(7).innerHTML = '<div class="center">'+ res[i].cw2 +'</div>';
			var updateBtn = '<button class="customfont" onclick="updateMarks(this)" data-userid= ' +res[i].userid + ' data-markid=' +res[i].id + ' style="color: #7FB3D5;"> &#xf14a;</button>';
			row.insertCell(8).innerHTML = updateBtn;
		}
	});
}


function paintBtn(elem) {
	elem.parentNode.parentNode.childNodes[8].childNodes[0].style.color= "#DC7633";
}


function updateMarks(updBtn){
	updBtn.style.color= "#229954";
	var row = updBtn.parentNode.parentNode;
	// var markId = updBtn.dataset.markid;
	var userId = updBtn.dataset.userid;
// numbers are related to columns
	var hw1 = row.childNodes[4].textContent;
	var hw2 = row.childNodes[5].textContent;
	// var cw1 = row.childNodes[6].textContent;
	var cw2 = row.childNodes[7].textContent;
	var uri = null;
	var method = null;
	var action = null;
	// if (markId > 0) {
		uri = "/mark/" + userId;
		method = "PUT";
		action = "Update";
	/*} else {
		uri = "/mark";
		method = "POST";
		action = "Add";
	}*/
	var reqDataObj = {
		method: method,
		uri: uri,
		objData: {
			userid: userId,
			hw1: hw1,
			hw2: hw2,
			// cw1: cw1,
			cw2: cw2
		},
		action: action
	};
	sendAjax(reqDataObj, function(res) {
		console.log(res);
	});
}

function formatDate(date) {
	var date = new Date(date)
    return ("0" + date.getDate()).slice(-2) + "-" + ("0"+(date.getMonth()+1)).slice(-2) + "-" + date.getFullYear() + " " + ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2)
}