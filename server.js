const express = require('express');
const bodyParser = require('body-parser'); // reading data from the <form> element
const cookieParser = require('cookie-parser');
const favicon = require('serve-favicon');
const session = require('express-session');
const low = require('lowdb');
const app = express();

app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(cookieParser('cookiesecret'));
app.use(bodyParser.urlencoded({extended: true}));

app.use( function( req, res, next ) {
    if ( req.query._method == 'DELETE' ) {
        req.method = 'DELETE';
        req.url = req.path;
    }
    next();
});

app.use(express.static(__dirname + '/public'));

app.use(session({
  resave: true, // false=don't save session if unmodified
  //path: '/',
  saveUninitialized: true, // false=don't create session until something stored
  secret: 'sessionsecret'
  // cookie: { maxAge: 60000 }
}));

require('./router/router')(app);

app.listen(8888, 'localhost', () => {
	console.log("Server: localhost, port 8888");
});
