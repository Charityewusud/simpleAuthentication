const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');

const uri = process.env.MONGO_URI;
const MongoDBSession = require('connect-mongodb-session')(session);

const store = new MongoDBSession({
	uri : uri,
	collection : "klauthSession"
});

const port = 8080;



app.use(express.static(__dirname + "/public"));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
  secret: 'klauth',
  resave: false,
  saveUninitialized: false,
	store: store
  
}))



const User = mongoose.model('User',
						new mongoose.Schema({
							username: String,
							email: String,
							password: String
						})
);

mongoose.connect(uri,
{useNewUrlParser:true,
 useUnifiedTopology:true
}
)
.then(()=>{
	console.log('db connection success')
})
.catch(err=>{
	console.log('db connection error')
})


app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html')
});

app.get('/logout', (req, res) => {
	req.session.destroy((err) => {
		if(err) throw err;
		res.redirect('/');
	});
});

app.get('/signupform', (req, res) => {
  res.sendFile(__dirname + '/signup.html')
});

app.get('/loginform', (req, res) => {
	res.sendFile(__dirname + '/login.html')
})

app.get('/welcome', function(req,res,next){
	console.log(req.session.klauth);
	if(req.session.klauth){
		next()
	}else{
		res.redirect('/loginform')
	}
} , (req, res) => {
  res.sendFile(__dirname + '/welcome.html')
})


app.post('/register', async (req, res) => {

	let user = await User.findOne({email: req.body.email});
	const salt = await bcrypt.genSalt(8);

	if(user){
		return res.status(400).send(' That user already exists!')
	}else{
		user = new User ({
		username: req.body.username,
		email:req.body.email,
		password:bcrypt.hashSync(req.body.password,salt)
	 
	});

	}

	await user.save((err)=>{

		if (err){
			throw err;
		}else{
			res.redirect('/welcome')
		}

	});

	
	});


	app.post('/login', async (req, res) => {
		let user = await User.findOne({email: req.body.email})

		if(!user){
			return res.redirect('/loginform')
		}else{
			
			const pwdCheck = await bcrypt.compare(req.body.password, user.password);

			if(!pwdCheck){
				return res.redirect('/loginform')
			}else{
				req.session.klauth = true;
				res.redirect('/welcome');
			}

		console.log('user exists!')
	 
	};



	})


// app.get("/logout",(req,res)=>{
//     req.logout();
//     res.redirect("/");
// });

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})