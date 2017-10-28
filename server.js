const express = require('express')
const app = express()
var fetch = require('node-fetch')

// Port 3001 by default or else whatever Heroku tells it to be 
const port = process.env.PORT || 3001;

// express looks up files relative to the static directory,
// so it doesn't become part of the url
app.use(express.static('build'));

// Get mineral prices from the Eve: Online ESI API
app.get('/getmineralprices', function (req, httpRes) {
    console.log("Mineral prices endpoint hit");
    var prices = {};

     // https://esi.tech.ccp.is/latest/markets/prices/?datasource=tranquility
     fetch("https://esi.tech.ccp.is/latest/markets/prices/?datasource=tranquility")
     .then(res => {
         if (res.ok){
             console.log("Got a response!");
             return res.json();
         }
         else { throw Error (res.statusText)}
     })
     .then(res => {
         console.log(res.length);
         for (let i = 0; i < res.length; i++){
             if (res[i].type_id == 34){
                 console.log("Trit: " + res[i].average_price);
                 prices.tritanium = res[i].average_price;
             } 
             else if (res[i].type_id == 35) {
                console.log("Pyer: " + res[i].average_price);
                prices.pyerite = res[i].average_price;
             }
             else if (res[i].type_id == 36) {
                console.log("Mex: " + res[i].average_price);
                prices.mexallon = res[i].average_price;
             }
             else if (res[i].type_id == 37) {
                console.log("Iso: " + res[i].average_price);
                prices.isogen = res[i].average_price;
             }
             else if (res[i].type_id == 38) {
                console.log("Mex: " + res[i].average_price);
                prices.nocxium = res[i].average_price;
             }
             else if (res[i].type_id == 39) {
                console.log("Mex: " + res[i].average_price);
                prices.zydrine = res[i].average_price;
             }
             else if (res[i].type_id == 40) {
                console.log("Mex: " + res[i].average_price);
                prices.megacyte = res[i].average_price;
             }
             else if (res[i].type_id == 11399) {
                console.log("Morph: " + res[i].average_price);
                prices.morphite = res[i].average_price;
             }             
         }
         httpRes.json(prices);
     })
     .catch(err => console.log(err));

    
  });

// API endpoint for testing
app.get('/test', function (req, res) {
    console.log("test endpoint hit");
   

    res.json("Success! This text delivered from the server.");
  });

// Start up the server:
app.listen(port, function () {
    console.log('App up and listening on port ' + port + '!')
})