/***********************
  Load Components!

  Express      - A Node.js Framework
  Body-Parser  - A tool to help use parse the data in a post request
  Pg-Promise   - A database tool to help use connect to our PostgreSQL database
***********************/
var express = require('express'); //Ensure our express framework has been added
var app = express();
var bodyParser = require('body-parser'); //Ensure our body-parser tool has been added
app.use(bodyParser.json());              // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

//Create Database Connection
var pgp = require('pg-promise')();

/**********************
  Database Connection information
  host: This defines the ip address of the server hosting our database.  We'll be using localhost and run our database on our local machine (i.e. can't be access via the Internet)
  port: This defines what port we can expect to communicate to our database.  We'll use 5432 to talk with PostgreSQL
  database: This is the name of our specific database.  From our previous lab, we created the football_db database, which holds our football data tables
  user: This should be left as postgres, the default user account created when PostgreSQL was installed
  password: This the password for accessing the database.  You'll need to set a password USING THE PSQL TERMINAL THIS IS NOT A PASSWORD FOR POSTGRES USER ACCOUNT IN LINUX!
**********************/
const dbConfig = {
	host: 'localhost',
	port: 5432,
	database: 'football_db',
	user: 'postgres',
	password: 'password'
};

var db = pgp(dbConfig);

// set the view engine to ejs
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/'));//This line is necessary for us to use relative paths and access our resources directory

// login page 
app.get('/', function(req, res) {
	res.render('pages/login',{
		local_css:"signin.css", 
		my_title:"Login Page"
	});
});

// registration page 
app.get('/register', function(req, res) {
	res.render('pages/register',{
		my_title:"Registration Page"
	});
});

app.get('/home', function(req, res) {
	var query = 'select * from favorite_colors;';
	db.any(query)
        .then(function (rows) {
            res.render('pages/home',{
				my_title: "Home Page",
				data: rows,
				color: '',
				color_msg: ''
			})

        })
        .catch(function (err) {
            // display error message in case an error
            console.log('error', err);
            response.render('pages/home', {
                title: 'Home Page',
                data: '',
                color: '',
                color_msg: ''
            })
        })
});

app.get('/home/pick_color', function(req, res) {
	var color_choice = req.query.color_selection;
	var color_options =  'select * from favorite_colors;';
	var color_message = "select color_msg from favorite_colors where hex_value = '" + color_choice + "';";
	db.task('get-everything', task => {
        return task.batch([
            task.any(color_options),
            task.any(color_message)
        ]);
    })
    .then(info => {
    	res.render('pages/home',{
				my_title: "Home Page",
				data: info[0],
				color: color_choice,
				color_msg: info[1][0].color_msg
			})
    })
    .catch(err => {
        // display error message in case an error
            console.log('error', err);
            response.render('pages/home', {
                title: 'Home Page',
                data: '',
                color: '',
                color_msg: ''
            })
    });

});

app.post('/home/pick_color', function(req, res) {
	var color_hex = req.body.color_hex;
	var color_name = req.body.color_name;
	var color_message = req.body.color_message;
	var insert_statement = "INSERT INTO favorite_colors(hex_value, name, color_msg) VALUES('" + color_hex + "','" +
							color_name + "','" + color_message +"') ON CONFLICT DO NOTHING;";

	var color_select = 'select * from favorite_colors;';
	db.task('get-everything', task => {
        return task.batch([
            task.any(insert_statement),
            task.any(color_select)
        ]);
    })
    .then(info => {
    	res.render('pages/home',{
				my_title: "Home Page",
				data: info[1],
				color: color_hex,
				color_msg: color_message
			})
    })
    .catch(err => {
        // display error message in case an error
            console.log('error', err);
            response.render('pages/home', {
                title: 'Home Page',
                data: '',
                color: '',
                color_msg: ''
            })
    });
});

app.get('/team_stats', function(req, res) {
	var query1 = 'select * from football_games;';
	var query2 = 'select count(*) from football_games where home_score > visitor_score;';
	var query3 = 'select count(*) from football_games where home_score < visitor_score;';
	db.task('get-everything', task => {
	    return task.batch([
	        task.any(query1),
	        task.any(query2),
	        task.any(query3)
	    ]);
	})
	.then(data => {
		res.render('pages/team_stats',{
				my_title: "Page Title Here",
				result_1: data[0],
				result_2: data[1],
				result_3: data[2]
			})
	})
	.catch(err => {
	    // display error message in case an error
	        console.log('error', err);
	        res.render('pages/team_stats',{
				my_title: "Page Title Here",
				result_1: '',
				result_2: '',
				result_3: ''
			})
	});
});

app.get('/player_info', function(req,res) {
	var query = 'select name, id from football_players';
db.any(query)
    .then(function (rows) {
        res.render('pages/player_info',{
			my_title: "My Title Here",
			data: rows
		})

    })
    .catch(function (err) {
        // display error message in case an error
        console.log('error', err);
        res.render('pages/player_info',{
			my_title: "My Title Here",
			data: ''
		})
	})
});

app.get('/player_info/post', function(req, res) {
	var player_id = req.query.player_choice;
	var query1 = 'select name, id from football_players;';
	var query2 = 'select * from football_players where ' + player_id +' = id;';
	var query3 = 'SELECT COUNT(*) from football_games where '+ player_id+' = ANY(football_games.players);'
	db.task('get-everything', task => {
	    return task.batch([
	        task.any(query1),
	        task.any(query2),
	        task.any(query3)
	    ]);
	})
	.then(data => {
		res.render('pages/player_info',{
				my_title: "Page Title Here",
				result_1: data[0],
				result_2: data[1],
				result_3: data[2]
			})
	})
	.catch(err => {
	    // display error message in case an error
	        console.log('error', err);
	        res.render('pages/player_info',{
				my_title: "Page Title Here",
				result_1: '',
				result_2: '',
				result_3: ''
			})
	});
});

/*Add your other get/post request handlers below here: */


app.listen(3000);
console.log('3000 is the magic port');
