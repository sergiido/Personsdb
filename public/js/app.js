window.onload = function(){
	// Get the modal
	var modal = document.getElementById('popupWrapper');
	// Get the button that opens the modal
	var btn = document.getElementById("addPerson");
	// Get the <span> element that closes the modal
	var span = document.getElementsByClassName("close")[0];
	// When the user clicks on the button, open the modal
	btn.onclick = function() {
		document.forms.addperson.reset();
	    modal.style.display = "block";
	}
	// When the user clicks on <span> (x), close the modal
	span.onclick = function() {
	    modal.style.display = "none";
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
	    document.getElementById('popupWrapper').style.display = "none";
		// console.log("res: " + res);
		addRow('userTable', res);
	});
}

function updateUser(updateBtn){
	var itemAttr = updateBtn.getAttribute("item");
	// alert(itemAttr);
	var reqDataObj = {
		method: "PUT",
		uri: "/update/" + itemAttr,
		objData: {_id: itemAttr},
		action: "Update"
	};
	sendAjax(reqDataObj, function(res){
		console.log(res);
	});
	// href='/update/#{item._id}?_method=PUT'
}

function deleteUser(rowId){
	var reqDataObj = {
		method: "DELETE",
		uri: "/delete/" + rowId,
		action: "Delete"
	};
	sendAjax(reqDataObj, function(res){
		deleteRow(rowId);
		console.log(res);
	});
}

function sendAjax(reqDataObj, callback){
	$.ajax({
		type: reqDataObj.method,
		url: reqDataObj.uri,
		data: reqDataObj.objData || null,
		// processData: false,
		// contentType: false,
		// dataType: "json",
		success: function(res){
			callback (res);
			$.notify(reqDataObj.action + " success", {
				className: 'success',
  				globalPosition: 'top center'});
		},
		error: function(res){
			console.log(JSON.parse(res.responseText).err);
			$.notify(reqDataObj.action  + " error", {
				className: "warn",
  				globalPosition: 'top center'});
			;
		}
	});
}

function addRow(tableName, res) {
	var userTable = document.getElementById(tableName);
	var len = userTable.rows.length;
	var row = userTable.insertRow(len);
	var nr = row.insertCell(0).innerHTML = len;
	var name = row.insertCell(1).innerHTML = res.name;
	var name = row.insertCell(2).innerHTML = res.secondname;
	var name = row.insertCell(3).innerHTML = res.age;
	if (res.gender == null) res.gender = "-";
	var name = row.insertCell(4).innerHTML = res.gender;
	var name = row.insertCell(5).innerHTML = res.groupid;
	var name = row.insertCell(6).innerHTML = res.login;
	var name = row.insertCell(7).innerHTML = res.pwd;
	var name = row.insertCell(8).innerHTML = res.role;
	var name = row.insertCell(9).innerHTML = res.created;
	var name = row.insertCell(10).innerHTML = res.active;
}

function deleteRow(rowid) {
    var row = document.getElementById(rowid);
    row.parentNode.removeChild(row);
}

function getGroup() {
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
			row.insertCell(0).innerHTML = i + 1;
			row.insertCell(1).innerHTML = res[i].id;
			row.insertCell(2).innerHTML = res[i].name;
			row.insertCell(3).innerHTML = res[i].secondname;
			row.insertCell(4).innerHTML = res[i].group;
			row.insertCell(5).innerHTML = res[i].hw1;
			row.insertCell(6).innerHTML = res[i].hw2;
			row.insertCell(7).innerHTML = res[i].cw;
		}
		// console.log(res);
	});
}
