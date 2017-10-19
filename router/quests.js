(function() {
	var counter = 10;
	var users = [];
	var questions = [{
			id: "a1",
			q: "Which tag inserts an image to HTML document?",
			options: ["image", "img", "picture"],
			tag: "radio"
		},
		{
			id: "a2",
			q: "Каким тегом можно создать нумерованый список",
			options: ["list", "dl", "ul", "ol"],
			tag: "radio"
		},
		{
			id: "a3",
			q: "Types for input tags",
			options: ["text", "password", "image", "button"],
			tag: "checkbox"
		},
		{
			id: "a4",
			q: "Выберите правильный вариант создания чекбокса",
			options: ["&lt;input type=&quot;checkbox&quot;&gt;", "&lt;input type=&quot;check&quot;", "&lt;check&gt;", "&lt;checkbox&gt;"],
			tag: "radio"
		},
		{
			id: "a5",
			q: "Выберите правильный вариант создания комментариев в HTML",
			options: ["&lt;!-- ... --&gt;", "/* ... */", "// .."],
			tag: "radio"
		},
		{
			id: "a6",
			q: "Что обозначает аббревиатура HTML",
			options: ["Hyper Text Markup Language", "Hot Mail", "How to Make Lasagna"],
			tag: "radio"
		}
	];
	var correctAnswers = new Map();
	correctAnswers.set("a1", "img");
	correctAnswers.set("a2", "ol");
	correctAnswers.set("a3", ["text", "password", "button"]);
	correctAnswers.set("a4", '<input type="checkbox">');
	correctAnswers.set("a5", '<!-- ... -->');
	correctAnswers.set("a6", "Hyper Text Markup Language");

	module.exports = {
		getQuestions: function(cb) {
			cb(questions);
		},
		checkAnswers: function(quizResults, cb) {
			var rightCounter = 0;
 			for (key in quizResults) {
 				if ( (quizResults[key] == correctAnswers.get(key))&&(quizResults[key] != 'object') ) {
 					rightCounter++;
 				} else if ( (quizResults[key] == 'object')&&( quizResults[key].join('') == correctAnswers.get(key).join('')) ) {
					rightCounter++;
 				} else {
 					// console.log (quizResults[key] + " : " + correctAnswers.get(key));
 					// console.log (typeof quizResults[key] );
 				}
 			}
 			// console.log (rightCounter);
 			// console.log (Object.keys(quizResults).length);
 			cb(Math.round(rightCounter * 100 / Object.keys(quizResults).length));
		}
	};
}());