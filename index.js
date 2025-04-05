import express from 'express';
import bodyParser from 'body-parser';
import pg from 'pg';
import env from 'dotenv';
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import session from "express-session";

const app = express();
const port = 3000;
const saltRounds = 10;
env.config();
const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
  });
  db.connect();

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());



app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));


app.set("view engine", "ejs");


const time = [{type:"breakfast" , imageUrl :"images/morning.jpg" } ,{type:"lunch" , imageUrl :"images/afternoon.jpeg" } , {type:"snacks" , imageUrl :"images/evening.jpeg" } , {type:"dinner" , imageUrl :"images/night.avif" } ]

app.get('/',(req , res)=>{
    res.render("home.ejs")
})

app.get("/login" , (req , res)=>{
    res.render("login.ejs")
})

app.get("/logout", (req, res) => {
    req.logout(function (err) {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  });

//authentication added by google oauth
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get(
  "/auth/google/user/dashboard",
  passport.authenticate("google", {
    successRedirect: "/user/dashboard",
    failureRedirect: "/login",
  })
);

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/user/dashboard",
    failureRedirect: "/login",
  })
);

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect("/login");
  }

app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      req.redirect("/login");
    } else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
        } else {
          const result = await db.query(
            "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
            [email, hash]
          );
          const user = result.rows[0];
          req.login(user, (err) => {
            console.log("success");
            res.redirect("/user/dashboard");
          });
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
});

passport.use(
  "local",
  new Strategy(async function verify(username, password, cb) {
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1 ", [
        username,
      ]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedHashedPassword = user.password;
        bcrypt.compare(password, storedHashedPassword, (err, valid) => {
          if (err) {
            console.error("Error comparing passwords:", err);
            return cb(err);
          } else {
            if (valid) {
              return cb(null, user);
            } else {
              return cb(null, false);
            }
          }
        });
      } else {
        return cb("User not found");
      }
    } catch (err) {
      console.log(err);
    }
  })
);

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/user/dashboard",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        console.log(profile);
        const result = await db.query("SELECT * FROM users WHERE email = $1", [
          profile.email,
        ]);
        if (result.rows.length === 0) {
          const newUser = await db.query(
            "INSERT INTO users (email, password) VALUES ($1, $2)",
            [profile.email, "google"]
          );
          return cb(null, newUser.rows[0]);
        } else {
          return cb(null, result.rows[0]);
        }
      } catch (err) {
        return cb(err);
      }
    }
  )
);
passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});



app.get('/user/dashboard',ensureAuthenticated , async (req , res)=>{
    
    try {
        const result = await db.query("SELECT * FROM recipes");
        const data = result.rows;
        res.render("user.ejs" , {
            foods:data,
            
        });
    } catch (error) {
        console.log(error)
    }
    
})


app.post('/user/dashboard', async (req , res)=>{
    try {
        const name = req.body.name;
        console.log(name)
        const result = await db.query(
            "SELECT * FROM recipes WHERE name ILIKE $1",
            [`%${name}%`] // Adding wildcards directly in the parameter
        );
        const data = result.rows;
        console.log(data)
        res.render("user.ejs" , {
            foods:data
        });
    } catch (error) {
        console.log(error)
    }
    
})


app.get('/user/meals' ,ensureAuthenticated, async (req , res)=>{
    try {
        const result = await db.query("SELECT * FROM chefs");
        const data = result.rows;
       res.render('meals.ejs' , {
        chefs:data,
        time:time
       }) 
    } catch (error) {
        console.log(error)
    }
})

app.listen(port , ()=>{
    console.log(`server hosted on ${port}`);
})


