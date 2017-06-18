const express = require('express');
const bodyParser = require('body-parser'); // reading data from the <form> element
const cookieParser = require('cookie-parser');
const favicon = require('serve-favicon');
const low = require('lowdb');
const app = express();

app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(bodyParser.urlencoded({extended: true}));

app.use( function( req, res, next ) {
    if ( req.query._method == 'DELETE' ) {
        req.method = 'DELETE';
        req.url = req.path;
    }
    next();
});

app.use(express.static(__dirname + '/public'));

require('./router/router')(app);

app.listen(8888, 'localhost', () => {
	console.log("Server: localhost, port 8888");
});
