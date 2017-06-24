window.onload = function(){
	document.forms.addperson.reset();
	// Get the modal
	var modal = document.getElementById('popupWrapper');
	// Get the button that opens the modal
	var btn = document.getElementById("addPerson");
	// Get the <span> element that closes the modal
	var span = document.getElementsByClassName("close")[0];
	// When the user clicks on the button, open the modal
	btn.onclick = function() {
	    modal.style.display = "block";
	}
	// When the user clicks on <span> (x), close the modal
	span.onclick = function() {
	    modal.style.display = "none";
	}
	// When the user clicks anywhere outside of the modal, close it
	window.onclick = function(event) {
	    if (event.target == modal) {
	        modal.style.display = "none";
	    }
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
			group: formData.get('group'),
			login: formData.get('login'),
			pwd: formData.get('pwd'),
			roles: formData.get('roles')
		},
		action: "Add"
	};
	sendAjax(reqDataObj, function(res){
	    document.getElementById('popupWrapper').style.display = "none";
		// console.log("res: " + res);
		renderTable(res);
	});
}

function update(updateBtn){
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

function sendAjax(reqDataObj, callback){
	$.ajax({
		type: reqDataObj.method,
		url: reqDataObj.uri,
		data: reqDataObj.objData,
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

function renderTable(res) {
	var userTable = document.getElementById('userTable');
	var len = userTable.rows.length;
	var row = userTable.insertRow(len);
	var nr = row.insertCell(0).innerHTML = len;
	var name = row.insertCell(1).innerHTML = res.name;
	var name = row.insertCell(2).innerHTML = res.secondname;
	var name = row.insertCell(3).innerHTML = res.age;
	if (res.gender == "empty") res.gender = "-";
	var name = row.insertCell(4).innerHTML = res.gender;
	var name = row.insertCell(5).innerHTML = res.group;
	var name = row.insertCell(6).innerHTML = res.login;
	var name = row.insertCell(7).innerHTML = res.pwd;
	var name = row.insertCell(8).innerHTML = res.role;
	var name = row.insertCell(9).innerHTML = res.created;
	var name = row.insertCell(10).innerHTML = res.active;
}
