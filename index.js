import {calcStrength, flavorList} from './jsonfileStorage.js'
import express, { response } from 'express'
import pg from 'pg'
import cookieParser from 'cookie-parser'
import jsSHA from 'jssha';
import methodOverride from 'method-override'
import moment from 'moment';



moment().format();
const {Pool} = pg

const pgConnectionConfigs = {
  user: 'grace',
  server: 'localhost',
  database: 'project2',
  port: 5432
}

const pool = new Pool(pgConnectionConfigs)

const app = express()
const SALT = 'yummydrinks'
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(cookieParser());


const checkHash = (userId) => {
  const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
  const unhashedString = userId+SALT
  shaObj.update(unhashedString);
  return shaObj.getHash('HEX');
};



app.get('/signup', (req,res)=>{
  res.render('signup')
})

app.post('/signup', (req,res)=>{
  
  const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' })
  shaObj.update(req.body.password+SALT)
  const hashedPassword = shaObj.getHash('HEX')
  const userData = [req.body.email_address, req.body.username, hashedPassword]

  pool.query('INSERT INTO users (email_address, username, hashed_pw) VALUES ($1, $2, $3)', userData, (err,result)=>{
    if(err){
      console.log('error', err.stack)
    }
    console.log('successfully signedup', result.rows)
    const loginData = {user: req.body.username}
    console.log(loginData)
    res.render('login', loginData)
  })
})

app.get('/login', (req,res)=>{
  const loginData = {user: req.body.username}
  console.log(loginData)
  res.render('login', loginData)
})

app.post('/login', (req,res)=>{
  const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' })
  shaObj.update(req.body.password+SALT)
  const hashedPassword = shaObj.getHash('HEX')
  const userData = [req.body.username, hashedPassword]
  pool.query ('SELECT id FROM users WHERE username=$1 AND hashed_pw=$2', userData, (err,result)=>{
    console.log(result.rows)
    if(result.rows.length === 1){
      const shaCookie = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' })
      const unhashedCookieString = result.rows[0].id + SALT
      shaCookie.update(unhashedCookieString);
      const hashedCookieString = shaCookie.getHash('HEX');
      res.cookie('loggedIn', hashedCookieString)
      console.log(result.rows[0].id)
      res.cookie('user', result.rows[0].id)
      res.redirect('/recipes')
    }
    else{
      res.send('wrong username or password, please try again')
    }
  })
})

app.get('/signout', (req,res)=>{
  res.clearCookie('loggedIn')
  res.clearCookie('user')
  res.redirect('/login')
})

app.use((req,res,next)=>{
  if(req.cookies.loggedIn){
    next()
  } else{  
    res.redirect('/login')
  }
  
})

app.get('/recipes', (req,res)=>{
  console.log(req.query.sort)
  const sortBy = req.query.sort
  const outputData = {}
  pool.query('SELECT * FROM recipe', (err,result)=>{
    if(err){
      console.log('error', err)
    }
    console.log(result.rows)
    
    switch (sortBy){
      case 'ascrating':
        console.log('ascrating')
        outputData["data"] = result.rows.sort((a,b) =>{
          return a.rating - b.rating})
        break
      case 'descrating':
        console.log('descrating')
        outputData["data"] = result.rows.sort((a,b) =>{
          return b.rating - a.rating})
        break
      case 'ascreviews':
        console.log('ascreviews')
        outputData["data"] = result.rows.sort((a,b) =>{
          return a.reviews - b.reviews})
        break
      case 'descreviews':
        console.log('descreviews')
        outputData["data"] = result.rows.sort((a,b) =>{
          return b.reviews - a.reviews})
        break
      case 'ascdate':
        console.log('ascdate')
        outputData["data"] = result.rows.sort((a,b) =>{
          return a.date_created - b.date_created})
        break
      case 'descdate':
        console.log('descdate')
        outputData["data"] = result.rows.sort((a,b) =>{
          return b.date_created - a.date_created})
        break
      default:
      outputData["data"] = result.rows.sort((a,b) =>{
        return b.rating - a.rating})
    }
    console.log(outputData)
    res.render('recipe-index', outputData)
  })
  
})

// app.get('/recipe?sort=asc', (req,res)=>{
//   const sort = req.query.sort;
//   console.log(sort)
//   console.log('done')
// })

app.get('/recipes/:id', (req,res)=>{
  const recipeId = req.params.id
  let recipeData = {}
  pool.query(`SELECT users.username, recipe.*, ingredients.ingredient_name, ingredients.ingredient_type, ingredients.ingredient_flavor, ingredients.measurement_name, ingredients.abv, recipe_ingredients.amount, recipe_category.* FROM users INNER JOIN recipe ON users.id = recipe.user_id INNER JOIN recipe_category ON recipe_category.recipe_id = recipe.id RIGHT JOIN recipe_ingredients ON recipe.id = recipe_ingredients.recipe_id INNER JOIN ingredients ON ingredients.ingredient_name = recipe_ingredients.ingredient_name AND ingredients.ingredient_type = recipe_ingredients.ingredient_type AND ingredients.ingredient_flavor = recipe_ingredients.ingredient_flavor WHERE recipe.id = ${recipeId}`, (err, result)=>{
    if(err){
      console.log('error',err.stack)
    } 
    console.log('result', result)
    if(typeof(result) === "undefined"){
      res.redirect('/recipes')
    } else {
       if(checkHash(result.rows[0].user_id) === req.cookies.loggedIn){   
        recipeData["userIsOwner"] = true
      } else {
        recipeData["userIsOwner"] = false
      }
      console.log(result.rows)
      recipeData["data"] = result.rows

      pool.query(`SELECT users.username, comments.review, comments.rating, comments.date_given FROM users INNER JOIN comments ON comments.user_id = users.id WHERE comments.recipe_id = ${recipeId} `).then((result)=>{
        recipeData["comments"] = result.rows
        recipeData["avgRating"] = 'Yet to be rated'
        if(result.rows.length !==0){
        const ratings = recipeData.comments.map(comment=>comment.rating)
        const numberRatings = ratings.length
        recipeData["avgRating"] = (ratings.reduce((a,b)=> a+b) / numberRatings).toFixed(2)
        pool.query(`UPDATE recipe SET rating = ${recipeData["avgRating"]}, reviews = ${numberRatings} WHERE id =${recipeId} returning id`, (err,result)=>{
          if(err){
            console.log('error', err)
          }
          console.log('done')
          console.log(result.rows, 'final')   
             
          res.render('recipe', recipeData) 
          
        })
        }   
      
      })
      }
  })
})

app.delete('/recipes/:id', (req,res)=>{
  const recipeId = req.params.id
  pool.query(`DELETE FROM recipe WHERE id = ${recipeId}`, (err, result)=>{
    if(err){
      console.log('error',err.stack)
    }
    console.log('recipe deleted')
    res.send('recipe deleted')
  })
})

app.post('/recipes/:id', (req,res)=>{
  const recipeId = req.params.id
  const userId = req.cookies.user
  const date = moment().format("YYYY-MM-DD")
  // console.log(date)
  const commentsData = [recipeId, userId, req.body.comment, req.body.rating, date]
  pool.query(`INSERT INTO comments (recipe_id, user_id, review, rating, date_given) VALUES ($1, $2, $3, $4, $5)`, commentsData, (err,result)=>{
    if(err){
      console.log('error', err)
    }
    res.redirect(`/recipes/${recipeId}`)
  })

})

app.get('/recipes/:id/edit', (req,res)=>{
  const recipeId = req.params.id
  const recipeData = {}
  pool.query(`SELECT recipe.user_id, recipe.id, recipe.name, recipe.instructions, ingredients.ingredient_name, ingredients.ingredient_type, ingredients.ingredient_flavor, ingredients.measurement_name, ingredients.abv, recipe_ingredients.amount, recipe_category.* FROM recipe_category INNER JOIN recipe ON recipe_category.recipe_id = recipe.id RIGHT JOIN recipe_ingredients ON recipe.id = recipe_ingredients.recipe_id INNER JOIN ingredients ON ingredients.ingredient_name = recipe_ingredients.ingredient_name AND ingredients.ingredient_type = recipe_ingredients.ingredient_type AND ingredients.ingredient_flavor = recipe_ingredients.ingredient_flavor WHERE recipe.id = ${recipeId}`, (err, result)=>{
    if(err){
      console.log('error',err.stack)
    }
    recipeData["data"] = result.rows
    console.log(recipeData.data[0].name)
    res.render('edit', recipeData)
  })
})

app.post('/recipes/:id/edit', (req,res)=>{
  console.log('req body', req.body)
  const recipeId = req.params.id
  const recipeData = [req.body.recipe_name, new Date(),  req.body.instructions, recipeId]
  
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

  
  console.log('strength',calcStrength(ingData.amount, abvArr))   
  let ctgData = flavorList(ingData.amount, ingData.ingredient_flavor)
  ctgData["overall_abv"] = calcStrength(ingData.amount, abvArr)
  console.log(ctgData, 'ctgData')
  let ctgInputData = Object.values(ctgData)
  console.log(ctgInputData, 'ctgInputData')
  
  
  
  const updateRecipeName = 'UPDATE recipe SET name = $1, date_modified = $2, instructions =$3 WHERE id = $4 returning id'  
  const updateRecipeCategory = `UPDATE recipe_category SET sweet=$1, sour=$2, bitter=$3, savory=$4, spicy=$5, fruity=$6, overall_abv=$7 WHERE recipe_id=${recipeId} RETURNING recipe_id `
  const deleteQuery = `DELETE FROM recipe_ingredients WHERE recipe_id = ${recipeId} RETURNING recipe_id `

  let count=0;
  Promise.all([
    pool.query(deleteQuery, (err,result)=>{
      console.log(result,'result delete')
      ingData.ingredient_name.map((ingredient, index) => {
    
      const ingInputArr = [ingredient,
      ingData.ingredient_type[index], 
      ingData.ingredient_flavor[index], ingData.measurement_name[index], ingData.abv[index], ]

      const recIngInputArr = [recipeId, ingredient,ingData.ingredient_type[index],ingData.ingredient_flavor[index], ingData.amount[index]]

      console.log('ingInputArr', ingInputArr)
      console.log('recIngInputArr', recIngInputArr)

      return Promise.all([
        pool.query('INSERT INTO ingredients (ingredient_name, ingredient_type,ingredient_flavor, measurement_name, abv) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING', ingInputArr
        , (result)=>{
          count+=1
          console.log('inserted into ingredients', count)
          if(count === ingData.ingredient_name.length*2){
            console.log('redirect now')
            res.redirect(`/recipes/${recipeId}`)
             }
          }),
        pool.query('INSERT INTO recipe_ingredients (recipe_id, ingredient_name, ingredient_type, ingredient_flavor, amount) VALUES ($1, $2, $3, $4,$5) returning ingredient_name ', recIngInputArr, (result)=>{
          count +=1
          console.log('inserted into rec_ingredients', count)
          if(count === ingData.ingredient_name.length*2){
            console.log('redirect now')
            res.redirect(`/recipes/${recipeId}`)
             }
          })
        ])  
      })
    }),
    pool.query(updateRecipeName, recipeData, ()=>console.log('update done')),
    pool.query(updateRecipeCategory,ctgInputData, ()=>console.log('updateCat done'))])
    .then((result)=>console.log('redirect', result))
    .catch((error) => console.log(error.stack))
    
  console.log('redirecting1')
  
  console.log(ingData.ingredient_name.length)
  

  
  // res.redirect(`/recipes/${recipeId}`)  
  
})




app.get('/submit', (req,res)=>{
  if(checkHash(req.cookies.user) === req.cookies.loggedIn){
    res.render('submit')
  } else {
    res.send('please log in')
  }
})


app.post('/submit', (req,res)=>{
  console.log('req body', req.body)
  const userId = req.cookies.user
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
  console.log('strength',calcStrength(ingData.amount, abvArr))   
  let ctgData = flavorList(ingData.amount, ingData.ingredient_flavor)
  ctgData["overall_abv"] = calcStrength(ingData.amount, abvArr)
  console.log(ctgData, 'ctgData')
  let ctgInputData = Object.values(ctgData)
  console.log(ctgInputData, 'ctgInputData')
      
  
  pool.query('INSERT INTO recipe (name, date_created, instructions, user_id) VALUES ($1, $2, $3, $4) RETURNING id', recipeData)
  .then((result)=>{
    console.log(result.rows[0].id, 'resultrows')
    recipe_id = result.rows[0].id

    return Promise.all([ingData.ingredient_name.map((ingredient, index) => {
    
    const ingInputArr = [ingredient,
    ingData.ingredient_type[index], 
    ingData.ingredient_flavor[index], ingData.measurement_name[index], ingData.abv[index], ]

    const recIngInputArr = [recipe_id, ingredient,ingData.ingredient_type[index],ingData.ingredient_flavor[index], ingData.amount[index]]

    console.log('ingInputArr', ingInputArr)
    console.log('recIngInputArr', recIngInputArr)

      return Promise.all([
        pool.query('INSERT INTO ingredients (ingredient_name, ingredient_type,ingredient_flavor, measurement_name, abv) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING', ingInputArr),
        pool.query('INSERT INTO recipe_ingredients (recipe_id, ingredient_name, ingredient_type, ingredient_flavor, amount) VALUES ($1, $2, $3, $4,$5) returning ingredient_name ', recIngInputArr)
      ])
    }),
    pool.query(`INSERT INTO recipe_category VALUES (${recipe_id}, $1, $2, $3, $4, $5, $6, $7)`, ctgInputData) ])
    .then(()=>{
    pool.query(`SELECT recipe.id, recipe.name, ingredients.ingredient_name, ingredients.ingredient_type, ingredients.ingredient_flavor, ingredients.measurement_name, ingredients.abv, recipe_ingredients.amount FROM recipe RIGHT JOIN recipe_ingredients ON recipe.id = recipe_ingredients.recipe_id INNER JOIN ingredients ON ingredients.ingredient_name = recipe_ingredients.ingredient_name AND ingredients.ingredient_type = recipe_ingredients.ingredient_type AND ingredients.ingredient_flavor = recipe_ingredients.ingredient_flavor WHERE recipe.id = ${recipe_id}`)
    
    res.redirect('/recipes')
    })
      
  }).catch((error) => console.log(error.stack))  
})

app.get('/users/:id', (req,res)=>{
  const userId = req.params.id
  const outputData = {}
  const sortBy = req.query.sort
  pool.query(`SELECT recipe.*, users.username FROM recipe INNER JOIN users ON recipe.user_id = users.id WHERE users.id = ${userId}`, (err, result)=>{
   if(err){
      console.log('error', err)
    }
    console.log(result.rows)
    if(result.rows.length === 0 ) {
      console.log('error')
      outputData["userError"] = true
      
    } else {
      outputData["userError"] = false
    switch (sortBy){
      case 'ascrating':
        console.log('ascrating')
        outputData["data"] = result.rows.sort((a,b) =>{
          return a.rating - b.rating})
        break
      case 'descrating':
        console.log('descrating')
        outputData["data"] = result.rows.sort((a,b) =>{
          return b.rating - a.rating})
        break
      case 'ascreviews':
        console.log('ascreviews')
        outputData["data"] = result.rows.sort((a,b) =>{
          return a.reviews - b.reviews})
        break
      case 'descreviews':
        console.log('descreviews')
        outputData["data"] = result.rows.sort((a,b) =>{
          return b.reviews - a.reviews})
        break
      case 'ascdate':
        console.log('ascdate')
        outputData["data"] = result.rows.sort((a,b) =>{
          return a.date_created - b.date_created})
        break
      case 'descdate':
        console.log('descdate')
        outputData["data"] = result.rows.sort((a,b) =>{
          return b.date_created - a.date_created})
        break
      default:
      outputData["data"] = result.rows.sort((a,b) =>{
        return b.rating - a.rating})
    }
  }
    console.log(outputData)
    res.render('user-index', outputData)
  })
})


app.get('/search', (req,res)=>{
  res.render('search')
})

app.post('/search', (req,res)=>{
  console.log(req.body)
  const results = {recipes:[], searchkey: [], searchvalue:[]}
  // let search = []
  // const resultsQuery = 
  
    if(req.body.search === "ingredient"){
      pool.query(`SELECT DISTINCT recipe_id FROM recipe_ingredients WHERE ingredient_name = $1`,[req.body.ingredient], (err,result)=>{
        if(err){
          console.log('error', err)
        }
        console.log(result.rows, 'results')
        const search = result.rows.map(row=>row.recipe_id)
        console.log('search', search)
        pool.query('SELECT * FROM recipe WHERE id = ANY ($1)', [search], (err, result2)=>{
           if(err){
          console.log('error', err)
        }
        results.recipes = result2.rows
        results.searchkey = 'ingredient'
        results.searchvalue = req.body.ingredient
        console.log(results)
        res.render('results', results)
        })
        
      })
    } else if(req.body.search === "flavor"){
      pool.query(`SELECT DISTINCT recipe_id FROM recipe_category WHERE ${req.body.flavor} != 0`, (err,result)=>{
        if(err){
          console.log('error', err)
        }
        console.log(result.rows, 'results')
        const search = result.rows.map(row=>row.recipe_id)
        console.log('search', search)
        pool.query('SELECT * FROM recipe WHERE id = ANY ($1)', [search], (err, result2)=>{
           if(err){
          console.log('error', err)
        }
        results.recipes = result2.rows
        results.searchkey = 'flavor'
        results.searchvalue = req.body.flavor
        console.log(results)
        res.render('results', results)
        })
      })
    } else if (req.body.search === "abv"){
      pool.query(`SELECT DISTINCT recipe_id FROM recipe_category WHERE overall_abv <= $1`, [req.body.abv], (err,result)=>{
        if(err){
          console.log('error', err)
        }
        console.log(result.rows, 'results')
        const search = result.rows.map(row=>row.recipe_id)
        console.log('search', search)
        pool.query('SELECT * FROM recipe WHERE id = ANY ($1)', [search], (err, result2)=>{
           if(err){
          console.log('error', err)
        }
        results.recipes = result2.rows
        results.searchkey = 'overall_abv'
        results.searchvalue = req.body.abv
        console.log(results)
        res.render('results', results)
        })
      })
    }
 
  

})
  
app.listen(3004)