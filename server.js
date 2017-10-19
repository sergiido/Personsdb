const express = require('express');
const bodyParser = require('body-parser'); // reading data from the <form> element
const cookieParser = require('cookie-parser');
const favicon = require('serve-favicon');
const session = require('express-session');
const low = require('lowdb');
const app = express();

const port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080;
const ip = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');
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
  secret: 'sessionsecret',
  // cookie: { maxAge: 60000 }
  // ephemeral: true
}));

require('./router/router')(app);

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);
