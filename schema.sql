-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    image VARCHAR(255),
    fname VARCHAR(255)
);

-- Create recipes table
CREATE TABLE recipes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    ingredients TEXT[],
    instructions TEXT[],
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 

CREATE TABLE chefs(
	user_id SERIAL PRIMARY KEY,
	name text,
	image_url text	
);

CREATE TABLE cheefs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    image_url TEXT,
    description TEXT,
    cuisine VARCHAR(100),
    place VARCHAR(100),
    delivery_time INTEGER,
    stars FLOAT
);

-- Create homemade products table
CREATE TABLE homemade_products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(255),
    category VARCHAR(50) NOT NULL, -- e.g., 'spices', 'pickles', 'snacks', 'sweets'
    seller_id INTEGER REFERENCES users(id),
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    reviews INTEGER DEFAULT 0,
    ingredients TEXT[],
    shelf_life VARCHAR(100),
    is_vegetarian BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drop cart_items table if it exists
DROP TABLE IF EXISTS cart_items;

-- Create cart items table
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    product_id INTEGER REFERENCES homemade_products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Insert sample homemade products

-- Spices Category
INSERT INTO homemade_products (name, description, price, image_url, category, stock_quantity, ingredients, shelf_life, is_vegetarian) VALUES
('Homemade Garam Masala', 'Traditional blend of roasted and ground spices including cardamom, cinnamon, cloves, and more', 199.00, '/images/spices/garam-masala.jpg', 'spices', 100, ARRAY['Cardamom', 'Cinnamon', 'Cloves', 'Black pepper', 'Cumin'], '12 months', true),
('Special Chai Masala', 'Perfect blend for making authentic Indian masala chai', 149.00, '/images/spices/chai-masala.jpg', 'spices', 150, ARRAY['Cardamom', 'Ginger powder', 'Cinnamon', 'Black pepper'], '6 months', true),
('Kitchen King Masala', 'Versatile spice blend for vegetables and curries', 179.00, '/images/spices/kitchen-king.jpg', 'spices', 80, ARRAY['Coriander', 'Cumin', 'Turmeric', 'Red chili'], '8 months', true);

-- Pickles Category
INSERT INTO homemade_products (name, description, price, image_url, category, stock_quantity, ingredients, shelf_life, is_vegetarian) VALUES
('Mango Pickle', 'Traditional raw mango pickle made with authentic spices', 299.00, '/images/pickles/mango-pickle.jpg', 'pickles', 50, ARRAY['Raw mango', 'Mustard oil', 'Spices', 'Salt'], '12 months', true),
('Mixed Vegetable Pickle', 'Assorted vegetables pickled in mustard oil with Indian spices', 249.00, '/images/pickles/mixed-pickle.jpg', 'pickles', 60, ARRAY['Carrot', 'Cauliflower', 'Green chili', 'Spices', 'Mustard oil'], '12 months', true),
('Lemon Pickle', 'Tangy and spicy lemon pickle', 199.00, '/images/pickles/lemon-pickle.jpg', 'pickles', 70, ARRAY['Lemon', 'Salt', 'Red chili powder', 'Spices'], '12 months', true);

-- Snacks Category
INSERT INTO homemade_products (name, description, price, image_url, category, stock_quantity, ingredients, shelf_life, is_vegetarian) VALUES
('Mathri', 'Crispy and flaky traditional Indian snack', 199.00, '/images/snacks/mathri.jpg', 'snacks', 40, ARRAY['Wheat flour', 'Oil', 'Spices', 'Salt'], '3 months', true),
('Namak Para', 'Crunchy and savory diamond-shaped snack', 179.00, '/images/snacks/namak-para.jpg', 'snacks', 45, ARRAY['Wheat flour', 'Oil', 'Cumin seeds', 'Salt'], '2 months', true),
('Chakli', 'Spiral-shaped crispy rice snack', 229.00, '/images/snacks/chakli.jpg', 'snacks', 35, ARRAY['Rice flour', 'Gram flour', 'Spices', 'Oil'], '2 months', true);

-- Sweets Category
INSERT INTO homemade_products (name, description, price, image_url, category, stock_quantity, ingredients, shelf_life, is_vegetarian) VALUES
('Besan Ladoo', 'Traditional sweet made with roasted gram flour and ghee', 399.00, '/images/sweets/besan-ladoo.jpg', 'sweets', 30, ARRAY['Gram flour', 'Ghee', 'Sugar', 'Cardamom'], '15 days', true),
('Coconut Barfi', 'Sweet coconut squares with cardamom flavor', 349.00, '/images/sweets/coconut-barfi.jpg', 'sweets', 25, ARRAY['Coconut', 'Sugar', 'Milk', 'Cardamom'], '10 days', true),
('Atta Ladoo', 'Wholesome sweet balls made with whole wheat flour', 299.00, '/images/sweets/atta-ladoo.jpg', 'sweets', 35, ARRAY['Whole wheat flour', 'Ghee', 'Sugar', 'Nuts'], '15 days', true);

-- Ready-to-Cook Category
INSERT INTO homemade_products (name, description, price, image_url, category, stock_quantity, ingredients, shelf_life, is_vegetarian) VALUES
('Instant Dhokla Mix', 'Quick and easy mix for soft and spongy dhoklas', 149.00, 'https://rakskitchen.net/wp-content/uploads/2011/09/khaman-besan.jpg', 'ready-to-cook', 70, ARRAY['Gram flour', 'Spices', 'Citric acid', 'Salt'], '6 months', true),
('Pav Bhaji Masala Mix', 'Special blend for authentic street-style pav bhaji', 199.00, 'https://vegecravings.com/wp-content/uploads/2016/10/Pav-Bhaji-Recipe-Step-By-Step-Instructions-9.jpg', 'ready-to-cook', 60, ARRAY['Mixed spices', 'Dried vegetables', 'Herbs'], '6 months', true),
('Instant Idli Mix', 'Traditional south Indian idli batter mix', 129.00, 'https://foodlore.in/cdn/shop/files/Rava-Idli-using-Instant-Mix1S.jpg?v=1700047650&width=1445', 'ready-to-cook', 80, ARRAY['Rice flour', 'Urad dal flour', 'Salt'], '4 months', true);

-- DROP TABLE orders CASCADE;

-- Create orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 50.00,
    tax_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dabbawala_id INTEGER REFERENCES dabbawalas(id)
);

-- Create order items table
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES homemade_products(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create dabbawalas table for delivery personnel
CREATE TABLE dabbawalas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image VARCHAR(255) DEFAULT '/images/dabbawala-default.jpg',
    phone VARCHAR(15),
    experience INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 4.5,
    reviews INTEGER DEFAULT 0,
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample dabbawala data
INSERT INTO dabbawalas (name, image, phone, experience, rating, reviews) VALUES
('Ramesh Gaikwad', '/images/dabbawala1.jpg', '+91-9876543210', 15, 4.9, 1250),
('Suresh Patil', '/images/dabbawala2.jpg', '+91-9876543211', 8, 4.7, 870),
('Vijay Deshmukh', '/images/dabbawala3.jpg', '+91-9876543212', 12, 4.8, 1120),
('Ganesh Jadhav', '/images/dabbawala4.jpg', '+91-9876543213', 5, 4.6, 520);