DROP TABLE IF EXISTS ing_test, users, comments, recipe, recipe_ingredients, ingredients, recipe_category CASCADE;
-- DROP TABLE IF EXISTS ingredients CASCADE;
-- -- -- , feedback, recipe, recipe_ingredients, ingredients, measurements, recipe_category
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS feedback CASCADE;
-- DROP TABLE IF EXISTS recipe CASCADE;
-- DROP TABLE IF EXISTS recipe_ingredients CASCADE;
-- DROP TABLE IF EXISTS ingredients CASCADE;
-- DROP TABLE IF EXISTS recipe_category CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT,
  hashed_pw TEXT,
  email_address VARCHAR
);

CREATE TABLE recipe (
  id SERIAL PRIMARY KEY,
  name TEXT,
  date_created DATE,
  date_modified DATE,
  instructions TEXT,
  user_id INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) on DELETE CASCADE
);

CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  recipe_id INTEGER,
  FOREIGN KEY (recipe_id) REFERENCES recipe(id) on DELETE CASCADE,
  user_id INTEGER, 
  FOREIGN KEY (user_id) REFERENCES users(id) on DELETE CASCADE,
  review TEXT,
  rating INTEGER,
  date_given DATE
);


CREATE TABLE ingredients (
  id SERIAL,
  ingredient_name TEXT,
  ingredient_type TEXT,
  ingredient_flavor TEXT,
  PRIMARY KEY (ingredient_name,ingredient_type, ingredient_flavor),
  measurement_name TEXT,
  abv DECIMAL(5,2)
);

CREATE TABLE recipe_ingredients (
  recipe_id INTEGER,
  FOREIGN KEY (recipe_id) REFERENCES recipe(id) on DELETE CASCADE,
  ingredient_name TEXT,
  ingredient_type TEXT,
  ingredient_flavor TEXT, 
  amount NUMERIC
);

CREATE TABLE recipe_category (
  recipe_id INTEGER,
  FOREIGN KEY (recipe_id) REFERENCES recipe(id) on DELETE CASCADE,
  sweet NUMERIC,
  sour NUMERIC,
  bitter NUMERIC,
  savory NUMERIC,
  spicy NUMERIC,
  fruity NUMERIC,
  overall_abv NUMERIC
);

UPDATE recipe
SET date_modified = '2022-01-01'
WHERE id = 3;

UPDATE ingredients


-- INSERT INTO recipe (name, instructions) VALUES ('banana daiquiri','Add the rum, banana liqueur, lime juice and demerara syrup into a shaker with ice and shake until well-chilled.');

-- INSERT INTO ingredients (ingredient_name, ingredient_type, ingredient_flavor, measurement_name, abv) VALUES 
-- ('rum', 'alcohol', 'spicy', 'ml', 0.4),
-- ('banana liquer', 'liquer', 'fruity', 'ml', 0.2),
-- ('lime juice', 'mixer', 'sour', 'ml', 0),
-- ('demerara syrup', 'mixer', 'sweet', 'ml', 0)
-- ON CONFLICT
-- DO NOTHING;

-- INSERT INTO recipe_ingredients (recipe_id, ingredient_name, ingredient_type, ingredient_flavor, amount) VALUES 
-- (5, 'rum', 'alcohol', 'spicy', 20),
-- (5, 'banana liquer', 'liquer', 'fruity', 20),
-- (5,'lime juice', 'mixer', 'sour',15),
-- (5,'demerara syrup', 'mixer', 'sweet', 5);

-- INSERT INTO recipe_category ()

-- SELECT recipe.id, recipe.name, ingredients.ingredient_name, ingredients.ingredient_type, ingredients.ingredient_flavor, ingredients.measurement_name, ingredients.abv, recipe_ingredients.amount 
-- FROM recipe 
-- RIGHT JOIN recipe_ingredients ON recipe.id = recipe_ingredients.recipe_id 
-- INNER JOIN ingredients ON 
-- ingredients.ingredient_name = recipe_ingredients.ingredient_name
-- AND ingredients.ingredient_type = recipe_ingredients.ingredient_type
-- AND ingredients.ingredient_flavor = recipe_ingredients.ingredient_flavor 
-- WHERE recipe.id = 5;

-- INSERT INTO recipe_category VALUES (5, 0.3, 0.3, 0 ,0, 0,0, 15 )

-- INSERT INTO ingredients (ingredient_name) values ('gin') on conflict (ingredient_name) DO UPDATE SET ingredient_name=EXCLUDED.ingredient_name RETURNING id;

-- INSERT INTO ingredients (ingredient_name)
-- VALUES
--     ('rum')
-- ON CONFLICT (ingredient_name)
-- WHERE ((ingredient_name)::text = 'rum'::text)
-- DO NOTHING
-- RETURNING id;

-- INSERT INTO ingredients (ingredient_name, ingredient_flavor,ingredient_type) 
--        VALUES ('gin', 'alcohol', 'alcohol'), 
--               ('rum',  'alcohol', 'alcohol') 
-- ON CONFLICT(ingredient_name) 
-- DO UPDATE SET 
--     ingredient_name=EXCLUDED.ingredient_name 
-- RETURNING id;

-- INSERT INTO recipe_ingredients (recipe_id, ingredient_name, amount) VALUES


-- WITH ins1 as (
--   INSERT INTO recipe (recipe_name, date_created, instructions) VALUES ('margarita', '2022/02/01', 'mix well!')
--   RETURNING id AS recipe_id
--   )
--   , ins2 as (
--   INSERT INTO ingredients (ingredient_name, ingredient_flavor,ingredient_type) 
--       VALUES ('tequila', 'alcohol', 'alcohol'), 
--               ('peach juice',  'sweet', 'mixer') 
--   ON CONFLICT DO NOTHING
--   )
--   INSERT INTO recipe_ingredients (recipe_id, ingredient_name, amount) VALUES 
--   (3, 'tequila', 30),
--   (3, 'peach juice', 20)

--   SELECT recipe.recipe_name, ingredients.ingredient_name, ingredients.measurement_name, ingredients.abv, ingredients.ingredient_flavor, recipe_ingredients.amount FROM recipe RIGHT JOIN recipe_ingredients ON recipe.id = recipe_ingredients.recipe_id INNER JOIN ingredients ON ingredients.ingredient_name = recipe_ingredients.ingredient_name WHERE recipe.id = 1;


--   INSERT INTO ingredients (ingredient_name, ingredient_flavor,ingredient_type) 
--   VALUES ('apple juice', 'alcohol', 'alcohol'), ('peachy',  'sweet', 'mixer') 
--   WHERE 'apple juice' NOT IN (SELECT ingredient_name FR0M ingredients)


-- INSERT INTO ingredients (ingredient_name, ingredient_flavor,ingredient_type) 
-- SELECT 'banana liquer', 'smoky', 'liquer'
-- WHERE NOT EXISTS   
--   (SELECT ingredient_name, ingredient_flavor, ingredient_type
--   FROM ingredients
--   WHERE ingredient_name = 'banana liquer' AND ingredient_flavor = 'smoky'AND ingredient_type = 'liquer'
-- );

-- INSERT INTO ingredients (ingredient_name, ingredient_flavor, ingredient_type, measurement_name, abv) 
-- SELECT $1, $2, $3
-- WHERE NOT EXISTS   
--   (SELECT ingredient_name, ingredient_flavor, ingredient_type
--   FROM ingredients
--   WHERE ingredient_name = $1 AND ingredient_flavor = $2 AND ingredient_type = $3
-- )


-- INSERT INTO ingredients (ingredient_name, ingredient_flavor, ingredient_type, measurement_name, abv) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (ingredient_name) DO NOTHING

-- SELECT recipe.recipe_name, ingredients.ingredient_name, ingredients.measurement_name, ingredients.abv, ingredients.ingredient_flavor, recipe_ingredients.amount, ingredients.id 
-- FROM recipe 
-- RIGHT JOIN recipe_ingredients 
-- ON recipe.id = recipe_ingredients.recipe_id 
-- INNER JOIN ingredients 
-- ON ingredients.id = recipe_ingredients.ingredients_id WHERE recipe.id = 1;




-- INSERT INTO recipe (name,date_created, instructions, user_id) VALUES ('banana daiquiri','2022-03-02','Add the rum, banana liqueur, lime juice and demerara syrup into a shaker with ice and shake until well-chilled.',1);

-- SELECT * FROM recipe_category WHERE recipe_id = 17;

-- SELECT recipe.id, recipe.name, ingredients.ingredient_name, ingredients.ingredient_type, ingredients.ingredient_flavor, ingredients.measurement_name, ingredients.abv, recipe_ingredients.amount, recipe_category.* FROM recipe_category INNER JOIN recipe ON recipe_category.recipe_id = recipe.id RIGHT JOIN recipe_ingredients ON recipe.id = recipe_ingredients.recipe_id INNER JOIN ingredients ON ingredients.ingredient_name = recipe_ingredients.ingredient_name AND ingredients.ingredient_type = recipe_ingredients.ingredient_type AND ingredients.ingredient_flavor = recipe_ingredients.ingredient_flavor WHERE recipe.id = 17

-- INSERT into recipe_ingredients (recipe_id, ingredient_name, ingredient_type, ingredient_flavor, amount) VALUES (24, 'vanilla liquer', 'liquer', 'sweet', '20');SELECT conname, contype
