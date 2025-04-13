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
app.use(express.json());
app.use(express.static("public"));


app.set("view engine", "ejs");


const time = [
  { type: "breakfast", imageUrl: "/images/morning.jpg" },
  { type: "lunch", imageUrl: "/images/afternoon.jpeg" },
  { type: "snacks", imageUrl: "/images/evening.jpeg" },
  { type: "dinner", imageUrl: "/images/night.avif" }
];

app.get('/',(req , res)=>{
    res.render("home.ejs")
})

app.get("/login" , (req , res)=>{
    res.render("login.ejs")
})

app.get("/register" , (req , res)=>{
    res.render("register.ejs")
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
        console.log(profile.picture);
        const result = await db.query("SELECT * FROM users WHERE email = $1", [
          profile.email,
  
        ]);
        if (result.rows.length === 0) {
          const newUser = await db.query(
            "INSERT INTO users (email, password , image , fname) VALUES ($1, $2 , $3 , $4)",
            [profile.email, "google" , profile.picture , profile.given_name]
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
        const name  = await db.query("SELECT * FROM users where id = $1" , [req.user.id] );
        const rows = name.rows[0]
        console.log(rows.fname)
        
        const result = await db.query("SELECT * FROM recipes");
        const data = result.rows;
        res.render("user.ejs" , {
            foods:data,
            user:rows
    
        });
    } catch (error) {
        console.log(error)
    }
    
})


app.post('/user/dashboard', ensureAuthenticated , async (req , res)=>{
    try {
      const newName  = await db.query("SELECT * FROM users where id = $1" , [req.user.id] );
      const rows = newName.rows[0]
        const name = req.body.name;

        const result = await db.query(
            "SELECT * FROM recipes WHERE name ILIKE $1",
            [`%${name}%`] // Adding wildcards directly in the parameter
        );
        const data = result.rows;
        res.render("user.ejs" , {
            foods:data,
            user:rows
        });
    } catch (error) {
        console.log(error)
    }
    
})


app.get('/user/meals' ,ensureAuthenticated, async (req , res)=>{
    try {
       const chefs = await db.query("SELECT * FROM cheefs ");
      const name  = await db.query("SELECT * FROM users where id = $1" , [req.user.id] );
        const rows = name.rows[0]
        const result = await db.query("SELECT * FROM chefs");
        const data = result.rows;
       res.render('meals.ejs' , {
        chefs:data,
        time:time,
        user:rows,
        names:chefs.rows
       }) 
    } catch (error) {
        console.log(error)
    }
})

// Spices Routes
app.get('/user/spices', ensureAuthenticated, async (req, res) => {
    try {
        const user = await db.query("SELECT * FROM users WHERE id = $1", [req.user.id]);
        const products = await db.query("SELECT * FROM homemade_products ORDER BY created_at DESC");
        res.render('spices.ejs', {
            user: user.rows[0],
            spices: products.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

// Cart Routes
app.get('/cart', ensureAuthenticated, async (req, res) => {
    try {
        const user = await db.query("SELECT * FROM users WHERE id = $1", [req.user.id]);
        const cartItems = await db.query(`
            SELECT ci.id, ci.quantity, hp.* 
            FROM cart_items ci 
            JOIN homemade_products hp ON ci.product_id = hp.id 
            WHERE ci.user_id = $1
        `, [req.user.id]);

        let subtotal = 0;
        cartItems.rows.forEach(item => {
            subtotal += item.price * item.quantity;
        });

        const shipping = 50;
        const tax = subtotal * 0.18; // 18% tax
        const total = subtotal + shipping + tax;

        res.render('cart.ejs', {
            user: user.rows[0],
            cartItems: cartItems.rows,
            subtotal: subtotal.toFixed(2),
            shipping: shipping.toFixed(2),
            tax: tax.toFixed(2),
            total: total.toFixed(2)
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

app.post('/cart/add', ensureAuthenticated, async (req, res) => {
    try {
        const productId = parseInt(req.body.productId, 10);
        const quantity = parseInt(req.body.quantity, 10) || 1;
        
        if (isNaN(productId)) {
            return res.status(400).json({ success: false, error: 'Invalid product ID' });
        }

        // Check if item already exists in cart
        const existingItem = await db.query(
            "SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2",
            [req.user.id, productId]
        );

        if (existingItem.rows.length > 0) {
            // Update quantity if item exists
            await db.query(
                "UPDATE cart_items SET quantity = quantity + $1 WHERE user_id = $2 AND product_id = $3",
                [quantity, req.user.id, productId]
            );
        } else {
            // Add new item if it doesn't exist
            await db.query(
                "INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)",
                [req.user.id, productId, quantity]
            );
        }

        // Calculate updated cart totals
        const cartItems = await db.query(`
            SELECT ci.quantity, hp.price 
            FROM cart_items ci 
            JOIN homemade_products hp ON ci.product_id = hp.id 
            WHERE ci.user_id = $1
        `, [req.user.id]);

        let subtotal = 0;
        cartItems.rows.forEach(item => {
            subtotal += item.price * item.quantity;
        });

        const total = subtotal + 50 + (subtotal * 0.18); // Adding shipping (50) and tax (18%)

        res.json({
            success: true,
            subtotal: subtotal.toFixed(2),
            total: total.toFixed(2)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

app.post('/cart/update', ensureAuthenticated, async (req, res) => {
    try {
        const { itemId, action } = req.body;
        
        // Get current quantity
        const currentItem = await db.query(
            "SELECT ci.quantity, hp.price FROM cart_items ci JOIN homemade_products hp ON ci.product_id = hp.id WHERE ci.id = $1 AND ci.user_id = $2",
            [itemId, req.user.id]
        );

        if (currentItem.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Item not found' });
        }

        let newQuantity = currentItem.rows[0].quantity;
        if (action === 'increase') {
            newQuantity += 1;
        } else if (action === 'decrease' && newQuantity > 1) {
            newQuantity -= 1;
        }

        // Update quantity
        await db.query(
            "UPDATE cart_items SET quantity = $1 WHERE id = $2 AND user_id = $3",
            [newQuantity, itemId, req.user.id]
        );

        // Calculate new totals
        const cartItems = await db.query(`
            SELECT ci.quantity, hp.price 
            FROM cart_items ci 
            JOIN homemade_products hp ON ci.product_id = hp.id 
            WHERE ci.user_id = $1
        `, [req.user.id]);

        let subtotal = 0;
        cartItems.rows.forEach(item => {
            subtotal += item.price * item.quantity;
        });

        const total = subtotal + 50 + (subtotal * 0.18); // Adding shipping (50) and tax (18%)

        res.json({
            success: true,
            quantity: newQuantity,
            subtotal: subtotal.toFixed(2),
            total: total.toFixed(2)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

app.post('/cart/remove', ensureAuthenticated, async (req, res) => {
    try {
        const { itemId } = req.body;

        // Remove item
        await db.query(
            "DELETE FROM cart_items WHERE id = $1 AND user_id = $2",
            [itemId, req.user.id]
        );

        // Calculate new totals
        const cartItems = await db.query(`
            SELECT ci.quantity, hp.price 
            FROM cart_items ci 
            JOIN homemade_products hp ON ci.product_id = hp.id 
            WHERE ci.user_id = $1
        `, [req.user.id]);

        let subtotal = 0;
        cartItems.rows.forEach(item => {
            subtotal += item.price * item.quantity;
        });

        const total = subtotal + 50 + (subtotal * 0.18); // Adding shipping (50) and tax (18%)

        res.json({
            success: true,
            subtotal: subtotal.toFixed(2),
            total: total.toFixed(2)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Checkout route
app.get('/checkout', ensureAuthenticated, async (req, res) => {
    try {
        const user = await db.query("SELECT * FROM users WHERE id = $1", [req.user.id]);
        const cartItems = await db.query(`
            SELECT ci.id, ci.quantity, hp.* 
            FROM cart_items ci 
            JOIN homemade_products hp ON ci.product_id = hp.id 
            WHERE ci.user_id = $1
        `, [req.user.id]);

        if (cartItems.rows.length === 0) {
            return res.redirect('/cart');
        }

        let subtotal = 0;
        cartItems.rows.forEach(item => {
            subtotal += item.price * item.quantity;
        });

        const shipping = 50;
        const tax = subtotal * 0.18; // 18% tax
        const total = subtotal + shipping + tax;

        res.render('checkout.ejs', {
            user: user.rows[0],
            cartItems: cartItems.rows,
            subtotal: subtotal.toFixed(2),
            shipping: shipping.toFixed(2),
            tax: tax.toFixed(2),
            total: total.toFixed(2)
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

// Process order
app.post('/checkout/complete', ensureAuthenticated, async (req, res) => {
    try {
        // Start transaction
        await db.query('BEGIN');

        // Get cart items
        const cartItems = await db.query(`
            SELECT ci.id, ci.quantity, hp.id as product_id, hp.price, hp.name, hp.image_url
            FROM cart_items ci 
            JOIN homemade_products hp ON ci.product_id = hp.id 
            WHERE ci.user_id = $1
        `, [req.user.id]);

        if (cartItems.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(400).json({ success: false, error: 'Cart is empty' });
        }

        // Calculate totals
        let subtotal = 0;
        cartItems.rows.forEach(item => {
            subtotal += item.price * item.quantity;
        });

        const shipping = 50;
        const tax = subtotal * 0.18; // 18% tax
        const total = subtotal + shipping + tax;

        // Create order
        const orderResult = await db.query(
            "INSERT INTO orders (user_id, total_amount, shipping_fee, tax_amount) VALUES ($1, $2, $3, $4) RETURNING *",
            [req.user.id, total, shipping, tax]
        );
        
        const newOrder = orderResult.rows[0];

        // Add order items
        for (const item of cartItems.rows) {
            const itemSubtotal = item.price * item.quantity;
            await db.query(
                "INSERT INTO order_items (order_id, product_id, quantity, price, subtotal) VALUES ($1, $2, $3, $4, $5)",
                [newOrder.id, item.product_id, item.quantity, item.price, itemSubtotal]
            );
        }

        // Clear cart
        await db.query("DELETE FROM cart_items WHERE user_id = $1", [req.user.id]);

        // Commit transaction
        await db.query('COMMIT');

        return res.json({ success: true, orderId: newOrder.id });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error(error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Orders route
app.get('/orders', ensureAuthenticated, async (req, res) => {
    try {
        const user = await db.query("SELECT * FROM users WHERE id = $1", [req.user.id]);
        
        // Get all orders for the user
        const ordersResult = await db.query(`
            SELECT * FROM orders 
            WHERE user_id = $1 
            ORDER BY order_date DESC
        `, [req.user.id]);
        
        const orders = [];
        
        // For each order, get its items
        for (const order of ordersResult.rows) {
            const itemsResult = await db.query(`
                SELECT oi.*, hp.name, hp.image_url 
                FROM order_items oi
                JOIN homemade_products hp ON oi.product_id = hp.id
                WHERE oi.order_id = $1
            `, [order.id]);
            
            orders.push({
                ...order,
                items: itemsResult.rows
            });
        }
        
        res.render('orders.ejs', {
            user: user.rows[0],
            orders: orders
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

app.listen(port , ()=>{
    console.log(`server hosted on ${port}`);
})


