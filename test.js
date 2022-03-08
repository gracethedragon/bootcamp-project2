


const insertIng =(ingData, recipe_id)=>{
  console.log(ingData)
  console.log(ingData.ingredient_name)
    ingData.ingredient_name.map((ingredient,index)=>{
      const ingInputArr = [ingredient, ingData.ingredient_type[index], ingData.ingredient_flavor[index], ingData.measurement_name[index], ingData.abv[index] ]

      const recIngInputArr = [recipe_id, ingredient,ingData.ingredient_type[index],ingData.ingredient_flavor[index], ingData.amount[index]]
      
      console.log('ingInputArr', ingInputArr)
      console.log('recIngInputArr', recIngInputArr)

      return Promise.all([pool.query('INSERT INTO ingredients (ingredient_name, ingredient_type,ingredient_flavor, measurement_name, abv) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING', ingInputArr),
      pool.query('INSERT INTO recipe_ingredients (recipe_id, ingredient_name, ingredient_type, ingredient_flavor, amount) VALUES ($1, $2, $3, $4,$5) returning ingredient_name ', recIngInputArr)]).then((result)=> console.log('done'))
    })
  }


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

  pool
  .query('INSERT INTO recipe (name, date_created, instructions, user_id) VALUES ($1, $2, $3, $4) RETURNING id', recipeData)
  .then((result)=>{
    console.log(result.rows[0].id, 'resultrows')
    recipe_id = result.rows[0].id
    insertIng(ingData, recipe_id)
  }).then(()=>{
    pool.query(`SELECT recipe.id, recipe.name, ingredients.ingredient_name, ingredients.ingredient_type, ingredients.ingredient_flavor, ingredients.measurement_name, ingredients.abv, recipe_ingredients.amount FROM recipe RIGHT JOIN recipe_ingredients ON recipe.id = recipe_ingredients.recipe_id INNER JOIN ingredients ON ingredients.ingredient_name = recipe_ingredients.ingredient_name AND ingredients.ingredient_type = recipe_ingredients.ingredient_type AND ingredients.ingredient_flavor = recipe_ingredients.ingredient_flavor WHERE recipe.id = ${recipe_id}`)
  }).then((result)=>{
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
   
  }).catch((error) => console.log(error.stack))  
    res.send('done')
  })