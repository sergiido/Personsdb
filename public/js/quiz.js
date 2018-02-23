var quizModule = (function () {
	var currQuestion;
	var display = "block";
	var maxMark = 10;

	function urlencodeFormData(fd){
	    var s = '';
	    function encode(s){
	    	return encodeURIComponent(s).replace(/%20/g,'+');
	    }
	    for(var pair of fd.entries()){
	        if(typeof pair[1]=='string'){
	            s += (s?'&':'') + encode(pair[0])+'='+encode(pair[1]);
	        }
	    }
	    return s;
	}

	return {
		startQuiz: function(btn) {
			var reqDataObj = {
				method: "GET",
				uri: "/quizstart",
				action: "Get"
			};
			sendAjax(reqDataObj, function(res) {
				btn.style.display = "none";
				document.getElementById('squeezeContainer').style.display = "block";
				console.log(res.resp);
				if (res.resp == false) {
					alert (" You can't pass the test 2nd time");
					document.getElementById('squeezeContainer').style.display = "none";
				} else {
					res.forEach (function(question){
						var htmlQuests = "<div class='layer' style='display:"+display+"'><div>" + question.q + "</div><hr><ul>";
						question.options.forEach(function(option, index) {
							htmlQuests += '<li> <input type="'+question.tag+'" id="answ' + question.id + index + '" name="' + question.id + '" value="' + option + '" />';
							htmlQuests += '<label class="radio-inline" for="answ' + question.id + index + '">' + option + '</li>';
						});
						htmlQuests += "</ul></div>"
						document.getElementById('qContainer').innerHTML += htmlQuests;
						display = "none";
					});
					currQuestion = document.getElementById("qContainer").firstChild;
				}
			});
		},
		nextQuestion: function(){
			// console.log (currQuestion.nextElementSibling);
			if (currQuestion.nextElementSibling != null) {
				currQuestion.style.display = "none";
				currQuestion = currQuestion.nextElementSibling;
				currQuestion.style.display = "block";
			} else {
				document.querySelector('#squeezeContainer').style.display = "none";
				// send answers
				var inputTags = document.getElementById('qContainer').querySelectorAll('input:checked');
				var formData = new FormData();
				for (var i = 0; i < inputTags.length; i++) {
					console.log(inputTags[i].getAttribute("name") + " : " + inputTags[i].getAttribute("value"));
					formData.append(inputTags[i].getAttribute("name"), inputTags[i].getAttribute("value"));
				}
				var xhr = new XMLHttpRequest;
				xhr.open('POST', '/getAnswers', true);
				xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
				xhr.send(urlencodeFormData(formData));
				// output results
				xhr.onreadystatechange = function() {
					if (xhr.readyState != 4) return;
					document.getElementById("quizArea").innerHTML = '<div class="male fontSize2"> Your result is: ' + Math.round(JSON.parse(xhr.responseText).score*maxMark/100) + '  </div>';
				}
			}
		}
	};
})();
