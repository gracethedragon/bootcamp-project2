import {calcStrength, flavorList} from './jsonfileStorage.js'
import express, { response } from 'express'
import pg from 'pg'
import cookieParser from 'cookie-parser'

const {Pool} = pg

const pgConnectionConfigs = {
  user: 'grace',
  server: 'localhost',
  database: 'project2',
  port: 5432
}

const pool = new Pool(pgConnectionConfigs)

const app = express()
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
// app.use(methodOverride('_method'));
app.use(cookieParser());

app.get('/signup', (req,res)=>{
  res.render('signup')
})

app.post('/signup', (req,res)=>{
  const userData = [req.body.email_address, req.body.username, req.body.password]

  pool.query('INSERT INTO users (email_address, username, hashed_pw) VALUES ($1, $2, $3)', userData, (err,result)=>{
    if(err){
      console.log('error', err.stack)
    }
    console.log('successfully signedup', result.rows)
  })
})

app.get('/login', (req,res)=>{
  res.render('login')
})

app.post('/login', (req,res)=>{
  const userData = [req.body.username, req.body.password]
  pool.query ('SELECT * FROM users WHERE username=$1 AND hashed_pw=$2', userData, (err,result)=>{
    console.log(result.rows)
    if(result.rows.length === 1){
      res.cookie('loggedIn', true)
      res.cookie('user', req.body.username)
      res.redirect('/recipes')
    }
    else{
      res.send('wrong username or password, please try again')
    }
  })
})

app.get('/recipes', (req,res)=>{
  pool.query('SELECT * FROM recipe', (err,result)=>{
    if(err){
      console.log('error', err)
    }
    const outputData = {data:result.rows}
    console.log(outputData)
    res.render('recipe-index', outputData)
  })
  
})

app.get('/recipes/:id', (req,res)=>{
  const recipeId = req.params.id
  let recipeData = {}
  pool.query(`SELECT recipe.id, recipe.name, ingredients.ingredient_name, ingredients.ingredient_type, ingredients.ingredient_flavor, ingredients.measurement_name, ingredients.abv, recipe_ingredients.amount, recipe_category.* FROM recipe_category INNER JOIN recipe ON recipe_category.recipe_id = recipe.id RIGHT JOIN recipe_ingredients ON recipe.id = recipe_ingredients.recipe_id INNER JOIN ingredients ON ingredients.ingredient_name = recipe_ingredients.ingredient_name AND ingredients.ingredient_type = recipe_ingredients.ingredient_type AND ingredients.ingredient_flavor = recipe_ingredients.ingredient_flavor WHERE recipe.id = ${recipeId}`, (err, result)=>{
    if(err){
      console.log('error',err.stack)
    }
    recipeData["data"] = result.rows
    console.log(recipeData)

    res.render('recipe', recipeData)
  })
})
// app.get('/recipes/:id', (req,res)=>{
//   const recipeId = req.params.id
//   let recipeData = {}
//   Promise.all([pool.query(`SELECT recipe.id, recipe.name, ingredients.ingredient_name, ingredients.ingredient_type, ingredients.ingredient_flavor, ingredients.measurement_name, ingredients.abv, recipe_ingredients.amount FROM recipe RIGHT JOIN recipe_ingredients ON recipe.id = recipe_ingredients.recipe_id INNER JOIN ingredients ON ingredients.ingredient_name = recipe_ingredients.ingredient_name AND ingredients.ingredient_type = recipe_ingredients.ingredient_type AND ingredients.ingredient_flavor = recipe_ingredients.ingredient_flavor WHERE recipe.id = ${recipeId}`), pool.query(`SELECT * FROM recipe_category WHERE recipe_id=${recipeId}`)
// ]).then((allResults)=>{
//   console.log(allResults, 'all')
// })
  
//   // , (err, result)=>{
//   //   if(err){
//   //     console.log('error',err.stack)
//   //   }
//   //   recipeData["data"]=result.rows
//   //   console.log(recipeData)

//   //   res.render('recipe', recipeData)
//   // })
 
// })


app.get('/submit', (req,res)=>{
  res.render('submit')
})

app.post('/submit', (req,res)=>{
  console.log('req body', req.body)
  const userId = 1
  const recipeData = [req.body.recipe_name, new Date(),  req.body.instructions, userId]
  
  let abvArr = []

  req.body.ingredient_type.forEach(ing =>{
    if(ing === 'alcohol'){
      abvArr.push(0.4)
    } else if (ing === 'liquer'){
      abvArr.push(0.2)
    } else {
      abvArr.push(0)
    }
  })
  console.log(abvArr)
  const ingData = 
  { ingredient_name: req.body.ingredient_name,
    ingredient_flavor: req.body.ingredient_flavor,
    ingredient_type: req.body.ingredient_type,
    measurement_name: req.body.measurement_name,
    amount: req.body.amount,
    abv: abvArr
  }
  

  // console.log(recipeData)
  console.log(ingData, 'ingData') 
  let recipe_id;

  pool.query('INSERT INTO recipe (name, date_created, instructions, user_id) VALUES ($1, $2, $3, $4) RETURNING id', recipeData).then((result)=>{
    console.log(result.rows[0].id, 'resultrows')
    recipe_id = result.rows[0].id

    ingData.ingredient_name.map((ingredient, index) => {
    
    const ingInputArr = [ingredient,
    ingData.ingredient_type[index], 
    ingData.ingredient_flavor[index], ingData.measurement_name[index], ingData.abv[index], ]

    const recIngInputArr = [recipe_id, ingredient,ingData.ingredient_type[index],ingData.ingredient_flavor[index], ingData.amount[index]]

    console.log('ingInputArr', ingInputArr)
    console.log('ingInputArr', recIngInputArr)

    const newPromise = Promise.all([pool.query('INSERT INTO ingredients (ingredient_name, ingredient_type,ingredient_flavor, measurement_name, abv) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING', ingInputArr),

    pool.query('INSERT INTO recipe_ingredients (recipe_id, ingredient_name, ingredient_type, ingredient_flavor, amount) VALUES ($1, $2, $3, $4,$5) returning ingredient_name ', recIngInputArr)])
    
    newPromise.then((result)=> console.log('done'))
    })
    return pool.query(`SELECT recipe.id, recipe.name, ingredients.ingredient_name, ingredients.ingredient_type, ingredients.ingredient_flavor, ingredients.measurement_name, ingredients.abv, recipe_ingredients.amount FROM recipe RIGHT JOIN recipe_ingredients ON recipe.id = recipe_ingredients.recipe_id INNER JOIN ingredients ON ingredients.ingredient_name = recipe_ingredients.ingredient_name AND ingredients.ingredient_type = recipe_ingredients.ingredient_type AND ingredients.ingredient_flavor = recipe_ingredients.ingredient_flavor WHERE recipe.id = ${recipe_id}`)
  }) 
    .then((result)=>{
     
      console.log('result',result.rows)
      const abv_arr = []
      const amount_arr = []
      const flavor_arr = []
      result.rows.forEach(row=>{
        abv_arr.push(parseFloat(row.abv))
        amount_arr.push(parseFloat(row.amount))
        flavor_arr.push(row.ingredient_flavor)
      })

      console.log('strength',calcStrength(amount_arr, abv_arr))   
      let ctgData = flavorList(amount_arr, flavor_arr)
      ctgData["overall_abv"] = calcStrength(amount_arr, abv_arr)
      console.log(ctgData, 'ctgData')
      let ctgInputData = Object.values(ctgData)
      console.log(ctgInputData, 'ctgInputData')
      
      pool.query(`INSERT INTO recipe_category VALUES (${recipe_id}, $1, $2, $3, $4, $5, $6, $7)`, ctgInputData)
   
    })

    .catch((error) => console.log(error.stack))  
    res.send('done')

  })
  
app.listen(3004)