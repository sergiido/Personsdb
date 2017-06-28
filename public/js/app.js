window.onload = function(){

}

function showAddPersonPop() {
	var personmodal = document.getElementById('personpopup');
	document.forms.addperson.reset();
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
	var reqDataObj = {
		method: "POST",
		uri: "/add",
		objData: {name: formData.get('name'),
			secondname: formData.get('secondname'),
			age: formData.get('age'),
			gender: formData.get('gender'),
			groupid: formData.get('group'),
			login: formData.get('login'),
			pwd: formData.get('pwd'),
			roles: formData.get('roles')
		},
		action: "Add"
	};
	sendAjax(reqDataObj, function(res){
	    document.getElementById('personpopup').style.display = "none";
		// console.log("res: " + res);
		addRow('userTable', res);
	});
}

function showUpdatePersonPop(updateBtn) {
	var personUpdatemodal = document.getElementById('personupdatepopup');
	document.forms.addperson.reset();
	personUpdatemodal.style.display = "block";
	var personPopCloseBtn = personUpdatemodal.getElementsByClassName("close")[0];
	personPopCloseBtn.onclick = function() {
		personUpdatemodal.style.display = "none";
	}
	var userId = updateBtn.dataset.userid;
	// console.log(updateBtn.dataset);
	var personRow = document.getElementById(userId);
	personUpdatemodal.querySelector('input[name="userid"]').value = userId;
	personUpdatemodal.querySelector('input[name="name"]').value = personRow.childNodes[1].innerHTML;
	personUpdatemodal.querySelector('input[name="secondname"]').value = personRow.childNodes[2].innerHTML;
	personUpdatemodal.querySelector('input[name="age"]').value = personRow.childNodes[3].innerHTML;
	personUpdatemodal.querySelector('select[name="group"]').value = "1";
	personUpdatemodal.querySelector('input[name="login"]').value = personRow.childNodes[6].innerHTML;
	personUpdatemodal.querySelector('input[name="pwd"]').value = personRow.childNodes[7].innerHTML;
	personUpdatemodal.querySelector('select[name="roles"]').value = personRow.childNodes[8].innerHTML;
}

function updatePerson(){
	var formData = new FormData(document.forms.updateperson);
	var userId = formData.get('userid');
	var reqDataObj = {
		method: "PUT",
		uri: "/update/" + userId,
		objData: {name: formData.get('name'),
			secondname: formData.get('secondname'),
			age: formData.get('age'),
			gender: formData.get('gender'),
			groupid: formData.get('group'),
			login: formData.get('login'),
			pwd: formData.get('pwd'),
			roles: formData.get('roles')
		},
		action: "Update"
	};
	sendAjax(reqDataObj, function(res){
		document.getElementById('personupdatepopup').style.display = "none";
		// console.log(res);
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
	    document.getElementById('addgrouppopup').style.display = "none";
	    // add created option to select group dropdown
	    var select = document.getElementById("groupselect");
	    var option = document.createElement('option');
	    option.value = res.id;
	    option.innerHTML = res.name;
	    select.appendChild(option);
		// console.log("res: " + res);
	});
}

function sendAjax(reqDataObj, callback) {
	$.ajax({
		type: reqDataObj.method,
		url: reqDataObj.uri,
		data: reqDataObj.objData || null,
		// processData: false,
		// contentType: false,
		// dataType: "json",
		success: function(res) {
			callback (res);
			$.notify(reqDataObj.action + " success", {
				className: 'success',
  				globalPosition: 'top center'});
		},
		error: function(res) {
			// console.log(JSON.parse(res.responseText).err);
			$.notify(reqDataObj.action  + " error", {
				className: "warn",
  				globalPosition: 'top center'});
		}
	});
}

function addRow(tableName, res) {
	var userTable = document.getElementById(tableName);
	var len = userTable.rows.length;
	var row = userTable.insertRow(len);
	row.insertCell(0).innerHTML = len;
	row.insertCell(1).innerHTML = res.name;
	row.insertCell(2).innerHTML = res.secondname;
	row.insertCell(3).innerHTML = res.age;
	if (res.gender == null) res.gender = "-";
	row.insertCell(4).innerHTML = res.gender;
	row.insertCell(5).innerHTML = res.groupid;
	row.insertCell(6).innerHTML = res.login;
	row.insertCell(7).innerHTML = res.pwd;
	row.insertCell(8).innerHTML = res.role;
	row.insertCell(9).innerHTML = res.created;
	row.insertCell(10).innerHTML = res.active;
	var updateBtn = '<button class="customfont" onclick="showUpdatePersonPop(this)" data-userid=' +res.id+ ' style="color: orange"> &#xe804; </button>';
	row.insertCell(11).innerHTML = updateBtn;
}

function deleteRow(rowid) {
    var row = document.getElementById(rowid);
    row.parentNode.removeChild(row);
}

function getGroupMarks() {
	var group = document.getElementsByName("group")[1];
	var value = group.value;
	// alert(value);
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
			var row = userTable.insertRow(i + 1);
			row.insertCell(0).innerHTML = res[i].id;
			row.insertCell(1).innerHTML = res[i].name;
			row.insertCell(2).innerHTML = res[i].secondname;
			row.insertCell(3).innerHTML = res[i].group;
			row.insertCell(4).innerHTML = res[i].hw1;
			row.insertCell(5).innerHTML = res[i].hw2;
			row.insertCell(6).innerHTML = res[i].cw;
			row.insertCell(7).innerHTML = i + 1;
		}
		// console.log(res);
	});
}
