window.onload = function(){

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
		console.log(res.obj);
	});
	// href='/update/#{item._id}?_method=PUT'
}

function sendAjax(reqDataObj, callback){
	$.ajax({
		type: reqDataObj.method,
		url: reqDataObj.uri,
		data: reqDataObj.objData,
		success: function(res){
			$.notify(reqDataObj.action + " success", {
				className: 'success',
  				globalPosition: 'top center'});
			callback (res);
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