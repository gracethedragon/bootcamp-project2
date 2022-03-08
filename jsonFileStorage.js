//(Alcohol Content x Liquor Volume / Total Drink Volume) x 100 = % Alcohol by Volume
// const amount_arr = [2, .25, 1, .25]
// const abv_arr = [0.4, 0.2, 0, 0]

//function to calculate drink overall abv
export const calcStrength = (amount_arr, abv_arr) =>{
  const amount = amount_arr.map(amt_arr=> parseFloat(amt_arr))
  
  console.log(amount, abv_arr)
  let alcContent = 0
  amount.forEach((amt,index)=> {
    alcContent += amt * abv_arr[index]
    // console.log(amount,abv_arr[index], amount*abv_arr[index], alcContent)
  })
  const totalVol = amount.reduce((a,b)=> a+b)
  const drinkAbv = alcContent / totalVol * 100
  console.log(totalVol, alcContent, drinkAbv)
  return drinkAbv
}
// calcStrength(amount_arr, abv_arr)

// const amount_arr = [2, .25, 1, .25]
// const flavor_arr = ["alcohol", "fruity", "fruity", "sweet"]

//function to calculate drink overall flavour type
export const flavorList = (amount_arr, flavor_arr)=>{
  const amount = amount_arr.map(amt_arr=> parseFloat(amt_arr))
  const flavObj = {sweet: 0, sour: 0, bitter:0, savory:0, spicy:0, fruity:0, overall_abv:0}
  const totalVol = amount.reduce((a,b)=> a+b)
  const amount_arrPerc = amount.map(amt=>(amt/totalVol))
  // console.log(amount_arrPerc)
  flavor_arr.forEach((flavor, index)=>{
  if(flavor!=="alcohol"){
    if (Object.keys(flavObj).includes(flavor)){
        flavObj[flavor] += amount_arrPerc[index]
      } else {
        flavObj[flavor] = amount_arrPerc[index]
      }
    }
  })
    
  // console.log(flavObj)
  return flavObj
}

// flavorList(amount_arr, flavour_arr)