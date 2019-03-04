const express = require('express')
const app = express()
var fetch = require('node-fetch')

// Port 3001 by default or else whatever Heroku tells it to be
const port = process.env.PORT || 3001;

// express looks up files relative to the static directory,
// so it doesn't become part of the url
app.use(express.static('build'));

// Get mineral prices from the Eve: Online ESI API
// All mineral price data fetching/responding is an old version of the app
// created just for learning. The get individual price functions/routes
// are cleaner and more current
app.get('/getmineralprices', function (req, httpRes) {
    // object to hold price data for response
    var prices = {
        error: false
    };

    // https://esi.evetech.net/latest/markets/prices/?datasource=tranquility
    // New route: https://esi.evetech.net/latest/markets/prices/?datasource=tranquility
    fetch("https://esi.evetech.net/latest/markets/prices/?datasource=tranquility")
        .then(res => {
            if (res.ok) {
                return res.json();
            }
            else { throw Error(res.statusText) }
        })
        .then(res => {
            for (let i = 0; i < res.length; i++) {
                if (res[i].type_id == 34) {
                    prices.tritanium = res[i].average_price;
                }
                else if (res[i].type_id == 35) {
                    prices.pyerite = res[i].average_price;
                }
                else if (res[i].type_id == 36) {
                    prices.mexallon = res[i].average_price;
                }
                else if (res[i].type_id == 37) {
                    prices.isogen = res[i].average_price;
                }
                else if (res[i].type_id == 38) {
                    prices.nocxium = res[i].average_price;
                }
                else if (res[i].type_id == 39) {
                    prices.zydrine = res[i].average_price;
                }
                else if (res[i].type_id == 40) {
                    prices.megacyte = res[i].average_price;
                }
                else if (res[i].type_id == 11399) {
                    prices.morphite = res[i].average_price;
                }
            }
            httpRes.json(prices);
        })
        .catch(err => {
            console.log(err);
            prices.error = true;
            prices.error_message = "Prices HTTP request failed";
            httpRes.json(prices);
        }
        );

});

// all market data from the forge
// This is a truly massive array, will generally have 200,000+ objects
// TODO: Implement a PostgreSQL database instead
var giant_array = [];

// abusing the fact that arrays are objects
// giving my array a timestamp property
// shhh don't tell anyone
giant_array.stamp = false;

var jita_prices;
reset_jita_prices();

// reset the object holding price responses to default state
function reset_jita_prices() {
    jita_prices = {
        error: false,
        tritanium: {
            name: "tritanium",
            lowest_sell: Infinity,
            highest_buy: 0
        },
        pyerite: {
            name: "pyerite",
            lowest_sell: Infinity,
            highest_buy: 0
        },
        mexallon: {
            name: "mexallon",
            lowest_sell: Infinity,
            highest_buy: 0
        },
        isogen: {
            name: "isogen",
            lowest_sell: Infinity,
            highest_buy: 0
        },
        nocxium: {
            name: "nocxium",
            lowest_sell: Infinity,
            highest_buy: 0
        },
        zydrine: {
            name: "zydrine",
            lowest_sell: Infinity,
            highest_buy: 0
        },
        megacyte: {
            name: "megacyte",
            lowest_sell: Infinity,
            highest_buy: 0
        },
        morphite: {
            name: "morphite",
            lowest_sell: Infinity,
            highest_buy: 0
        }
    };

}

const CACHE_TIME = 10;

// (1) request all price data
// (2) fill jita prices with high buy / low sell for 8 minerals
// (3) fill giant array with all jita orders to be used as necessary
function fetch_all_prices(callback) {
    var status_object = {
        error: false
    };

    var no_HTTP_errors = true;

    var time_right_now = new Date();
    if (giant_array.stamp) {
        time_elapsed = (time_right_now.getTime() - giant_array.stamp.getTime()) / 1000;
        // don't get new data if old data is 10 minutes old or less
        if (time_elapsed < (60 * CACHE_TIME)) {
            status_object.message = "Cached data returned";
            callback(status_object);
            return;
        }
    }
    else {
        console.log("Saved data has no timestamp, pulling for the first time");
        reset_jita_prices();
    }

    var prices = {};
    var orders_fetched = 0;

    // the forge region id: 10000002
    // jita structure id: 60003760

    // region orders URL
    var orders_url = "https://esi.evetech.net/latest/markets/10000002/orders/?datasource=tranquility&order_type=all&page="
    var pages_fetched = 0;
    var page_to_fetch = 1;
    var max_pages = false;

    // fetch the first page to find how many pages total to fetch
    fetch(orders_url + page_to_fetch)
        .then(res => {
            if (res.ok) {
                // console.log("Got a response for page " + page_to_fetch);
                if (max_pages == false) {
                    // console.log("Headers: ");
                    // console.log(res.headers.get("x-pages"));
                    max_pages = parseInt(res.headers.get("x-pages"), 10);
                }
                return res.json();
            } else { throw Error(res.statusText) }
        })
        .then(res => {
            orders_fetched += res.length;
            process_orders(res);
            pages_fetched += 1;
            page_to_fetch += 1;
            return res;
        })
        .then(() => {
            for (let i = page_to_fetch; i <= max_pages; i++) {
                fetch(orders_url + i)
                    .then(res => {
                        if (res.ok) {
                            return res.json();
                        } else { throw Error(res.statusText) }
                    })
                    .then(res => {
                        pages_fetched += 1;
                        orders_fetched += res.length;
                        console.log(orders_fetched + " (" + pages_fetched + "/" + max_pages + ")");
                        process_orders(res);
                        if (pages_fetched == max_pages && no_HTTP_errors === true) {
                            giant_array.stamp = new Date();
                            status_object.message = "All pages received!";
                            callback(status_object);
                            return;
                        }
                        else if (pages_fetched == max_pages && no_HTTP_errors === false){
                            status_object.message = "One or more pages failed";
                            callback(status_object);
                            return;
                        }
                    })
                    .catch(err => {
                        console.log(err);
                        console.log(`Error requesting page #${i} of ${max_pages}`);
                        pages_fetched += 1;
                        no_HTTP_errors = false;
                        jita_prices.error = true;
                        status_object.error = true;
                        if (pages_fetched == max_pages){
                            satus_object.message = "Final page HTTP request failed";
                            callback(status_object);
                        }

                    });
            }
        })
        .catch(err => {
            console.log("Error on initial market data request:");
            console.log(err);
            status_object.error = true;
            status_object.message = "The first data request failed";
            jita_prices.error = true;
            callback(status_object);
        });
}

function process_orders(data) {
    // array of the typids we are interested in
    var typeids = [34, 35, 36, 37, 38, 39, 40, 11399];

    for (let i = 0; i < data.length; i++) {
        // Only look for orders of our item type in our station (Jita 4-4)
        if (data[i].location_id == 60003760) {
            giant_array.push(data[i]);

            // Only do something if this is one of our type_ids
            if (typeids.indexOf(data[i].type_id) >= 0) {
                var order_type;
                if (data[i].is_buy_order) {
                    order_type = "buy";
                } else {
                    order_type = "sell";
                }
                switch (data[i].type_id) {
                    case 34:
                        if (order_type == "buy" && data[i].price > jita_prices.tritanium.highest_buy) {
                            jita_prices.tritanium.highest_buy = data[i].price;
                        }
                        else if (order_type == "sell" && data[i].price < jita_prices.tritanium.lowest_sell) {
                            jita_prices.tritanium.lowest_sell = data[i].price;
                        }
                        break;
                    case 35:
                        if (order_type == "buy" && data[i].price > jita_prices.pyerite.highest_buy) {
                            jita_prices.pyerite.highest_buy = data[i].price;
                        }
                        else if (order_type == "sell" && data[i].price < jita_prices.pyerite.lowest_sell) {
                            jita_prices.pyerite.lowest_sell = data[i].price;
                        }
                        break;
                    case 36:
                        if (order_type == "buy" && data[i].price > jita_prices.mexallon.highest_buy) {
                            jita_prices.mexallon.highest_buy = data[i].price;
                        }
                        else if (order_type == "sell" && data[i].price < jita_prices.mexallon.lowest_sell) {
                            jita_prices.mexallon.lowest_sell = data[i].price;
                        }
                        break;
                    case 37:
                        if (order_type == "buy" && data[i].price > jita_prices.isogen.highest_buy) {
                            jita_prices.isogen.highest_buy = data[i].price;
                        }
                        else if (order_type == "sell" && data[i].price < jita_prices.isogen.lowest_sell) {
                            jita_prices.isogen.lowest_sell = data[i].price;
                        }
                        break;
                    case 38:
                        if (order_type == "buy" && data[i].price > jita_prices.nocxium.highest_buy) {
                            jita_prices.nocxium.highest_buy = data[i].price;
                        }
                        else if (order_type == "sell" && data[i].price < jita_prices.nocxium.lowest_sell) {
                            jita_prices.nocxium.lowest_sell = data[i].price;
                        }
                        break;
                    case 39:
                        if (order_type == "buy" && data[i].price > jita_prices.zydrine.highest_buy) {
                            jita_prices.zydrine.highest_buy = data[i].price;
                        }
                        else if (order_type == "sell" && data[i].price < jita_prices.zydrine.lowest_sell) {
                            jita_prices.zydrine.lowest_sell = data[i].price;
                        }
                        break;
                    case 40:
                        if (order_type == "buy" && data[i].price > jita_prices.megacyte.highest_buy) {
                            jita_prices.megacyte.highest_buy = data[i].price;
                        }
                        else if (order_type == "sell" && data[i].price < jita_prices.megacyte.lowest_sell) {
                            jita_prices.megacyte.lowest_sell = data[i].price;
                        }
                        break;
                    case 11399:
                        if (order_type == "buy" && data[i].price > jita_prices.morphite.highest_buy) {
                            jita_prices.morphite.highest_buy = data[i].price;
                        }
                        else if (order_type == "sell" && data[i].price < jita_prices.morphite.lowest_sell) {
                            jita_prices.morphite.lowest_sell = data[i].price;
                        }
                        break;
                }
            }
        }
    }
    // end of for loop
}

// Get jita mineral sell prices from the Eve: Online ESI API
app.get('/getjitamineralsell', function (req, httpRes) {
    fetch_all_prices((status) => {
        if (status.error === true) {
            console.log("HTTP request error:");
            console.log(status.message);
        }
        httpRes.json(jita_prices);
    });
});

// DEPRECATED route - new route is /apinamesearch below
/*
app.get('/typeidbyname', function(req, httpRes){
    // API from fuzzysteve (https://twitter.com/Fuzzysteve), thanks!
    // Source: https://www.fuzzwork.co.uk/tools/api-typename-to-typeid/
    // TODO: Implement this with a PostgreSQL database and official APIs instead
    var api_url = "https://www.fuzzwork.co.uk/api/typeid.php?typename=";
    api_url += req.query.name;
    fetch(api_url)
        .then(res => {
            if (res.ok){
                return res.json();
            } else { throw Error(res.statusText)}
        })
        .then(res => {
            httpRes.json(res);
        })
        .catch(err=>{
            console.log("Error with FuzzWorks name API:");
            console.log(err);
        })
})
*/

// NEW ROUTE for doing the search by name
// TODO: Debug this, this route is throwing errors.
app.get('/apinamesearch', function(req, httpRes){
    var api_url ="https://esi.evetech.net/latest/search/?categories=inventorytype&datasource=tranquility&language=en-us&search=";
    api_url += req.query.name;
    // strict mode means only an exact match will be returned
    api_url += "&strict=true";
    fetch(api_url)
        .then(res => {
            if (res.ok){
                return res.json();
            } else { throw Error(res.statusText)}
        })
        .then(res => {
            httpRes.json(res);
        })
        .catch(err=>{
            console.log("Error with ESI name search API:");
            console.log(err);
        })
})

app.get('/getjitaprice', function (req, httpRes) {
    var item_prices = {
        name: "Error fetching price",
        type_id: req.query.typeid,
        max_buy: 0,
        min_sell: Infinity,
        error: false
    };

    fetch_all_prices((status) => {
        if(status.error === true){
            item_prices.error = true;
            httpRes.json(item_prices);
            console.log("Error object httpRes sent");
            console.log(status.message);
            return;
        }

        // Loop through giant arary and get max/min for our item
        for (let i = 0; i < giant_array.length; i++) {
            if (giant_array[i].type_id == item_prices.type_id) {
                var order_type;
                if (giant_array[i].is_buy_order) {
                    order_type = "buy";
                } else {
                    order_type = "sell";
                }

                if (order_type === "buy" && giant_array[i].price > item_prices.max_buy) {
                    item_prices.max_buy = giant_array[i].price;
                }
                else if (order_type === "sell" && giant_array[i].price < item_prices.min_sell) {
                    item_prices.min_sell = giant_array[i].price;
                }
            }
        }

        // use the type_id to get a name
        var name_url = "https://esi.evetech.net/latest/universe/types/";
        name_url += req.query.typeid;
        name_url += "/?datasource=tranquility&language=en-us";
        fetch(name_url)
            .then(res =>{
                if(res.ok){
                    return res.json();
                } else { throw Error(res.statusText)}
            })
            .then(res => {
                item_prices.name = res.name;
                httpRes.json(item_prices);
                console.log(`| Item Data | ${item_prices.name} | ${item_prices.type_id} | ${item_prices.max_buy} | ${item_prices.min_sell}`);
            })
            .catch(err =>{
                console.log(err);
                item_prices.error = true;
                httpRes.json(item_prices);
                console.log("Error object httpRes sent");
                return;
            })
    });
});

// API endpoint for testing server connectivity only
app.get('/test', function (req, res) {
    console.log("test endpoint hit");
    res.json("Success! This text delivered from the server.");
});

// Start up the server:
app.listen(port, function () {
    console.log('App spooled up and listening on port ' + port + '!')
})
