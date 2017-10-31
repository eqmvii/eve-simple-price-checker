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
            if (res.ok) {
                console.log("Got a response!");
                return res.json();
            }
            else { throw Error(res.statusText) }
        })
        .then(res => {
            console.log(res.length);
            for (let i = 0; i < res.length; i++) {
                if (res[i].type_id == 34) {
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
                    console.log("Nocx: " + res[i].average_price);
                    prices.nocxium = res[i].average_price;
                }
                else if (res[i].type_id == 39) {
                    console.log("Zyd: " + res[i].average_price);
                    prices.zydrine = res[i].average_price;
                }
                else if (res[i].type_id == 40) {
                    console.log("Meg: " + res[i].average_price);
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

var buy_prices = [];
var sell_prices = [];

// all market data from the forge
var giant_array = [];
// abusing the fact that arrays are objects shhh
giant_array.stamp = false;

var jita_prices = {
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

function reset_jita_prices() {
    jita_prices = {
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

// (1) request all price data
// (2) fill jita prices with high buy / low sell for 8 minerals
// (3) fill giant array with all jita orders to be used as necessary
function fetch_all_prices(callback) {
    var time_right_now = new Date();
    if (giant_array.stamp) {
        console.log("Giant array has a stamp!");
        time_elapsed = (time_right_now.getTime() - giant_array.stamp.getTime()) / 1000;
        console.log(`${time_elapsed} seconds have passed since last request`);
        // don't get new data if old data is 10 minutes old or less
        if (time_elapsed < (60 * 10)) {
            callback();
            return;
        }

    }
    else {
        console.log("Giant array does NOT have a stamp");
        // giant_array.stamp = new Date();
        reset_jita_prices();
    }

    var prices = {};
    var orders_fetched = 0;

    // the forge region id: 10000002
    // jita structure id: 60003760

    // region orders URL
    var orders_url = "https://esi.tech.ccp.is/latest/markets/10000002/orders/?datasource=tranquility&order_type=all&page="
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
            // console.log("Order response information:");
            // console.log("Page length: " + res.length);
            orders_fetched += res.length;
            // console.log("Headers:");
            // console.log(res.headers);
            process_orders(res);
            pages_fetched += 1;
            page_to_fetch += 1;
            // console.log("Fetched: " + pages_fetched + "/" + max_pages);
            return res;
        })
        .then(() => {
            for (let i = page_to_fetch; i <= max_pages; i++) {
                // fetchy fetchy 
                fetch(orders_url + i)
                    .then(res => {
                        if (res.ok) {
                            // console.log("Got a response!");
                            // pages_fetched += 1;
                            // console.log(pages_fetched);
                            // console.log(typeof res.json())
                            return res.json();
                        } else { throw Error(res.statusText) }
                    })
                    .then(res => {
                        pages_fetched += 1;
                        orders_fetched += res.length;
                        console.log(orders_fetched + " (" + pages_fetched + "/" + max_pages + ")");
                        process_orders(res);
                        if (pages_fetched == max_pages) {
                            giant_array.stamp = new Date();
                            // buy_prices.sort(function (a, b) { return a - b });
                            // sell_prices.sort(function (a, b) { return a - b });
                            // console.log("Highest buy: " + buy_prices[buy_prices.length - 1]);
                            // console.log("Lowest sell: " + sell_prices[0]);
                            console.log("Jita prices: ");
                            for (var item in jita_prices) {
                                console.log(item + ": " + jita_prices[item].highest_buy + " <-> " + jita_prices[item].lowest_sell);
                            }
                            // httpRes.json(jita_prices);
                            //return true;
                            callback();
                            return;
                        }

                        // console.log("Page " + pages_fetched + ". Orders fetched: " + orders_fetched);                
                    })
                    .catch(err => {
                        console.log(err);
                        console.log("Error at i equals " + i);
                        // TODO: Handle this better... 
                    });

            }

        })
        .catch(err => {
            console.log(err);
            console.log("Handle this better, error at initial request...");
            // TODO: Handle this better
        });


}

function process_orders(data) {

    //console.log(data.length);
    // giant_array = giant_array.concat(data);
    // console.log(`Giant array size is ${giant_array.length} right now`);

    // array of the typids we are interested in
    var typeids = [34, 35, 36, 37, 38, 39, 40, 11399];

    for (let i = 0; i < data.length; i++) {
        // Only look for orders of our item type in our station (Jita 4-4)
        if (data[i].location_id == 60003760) {
            giant_array.push(data[i]);

            // Only do something if this is one of our type_ids
            if (typeids.indexOf(data[i].type_id) >= 0) {
                // console.log("Found a matching order!");
                // console.log(data[i].type_id);
                var order_type;
                if (data[i].is_buy_order) {
                    order_type = "buy";
                    // buy_prices.push(data[i].price);
                } else {
                    order_type = "sell";
                    //sell_prices.push(data[i].price);
                }
                switch (data[i].type_id) {
                    case 34:
                        // console.log("Found a trit order!");
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
                // console.log("Order: " + order_type + " " + data[i].volume_remain + " at " + data[i].price);  
            }
        }
    }
    // end of for loop
    // console.log(`Size of giant array is ${giant_array.length} items`);
}

//getjitamineralsell
// Get jita mineral sell prices from the Eve: Online ESI API
app.get('/getjitamineralsell', function (req, httpRes) {
    console.log("##### Mineral SELL prices endpoint hit");

    fetch_all_prices(() => {
        console.log("##### I have a return value from fetch all");
        httpRes.json(jita_prices);
        console.log("httpRes sent");

    });

    console.log("This is after the fetch all");
});

app.get('/getjitaprice', function (req, httpRes) {
    console.log(`type_id: ${req.query.typeid}; name: ${req.query.name}`);

    if(req.query.typeid){
        console.log("type id given!");
    }
    if(req.query.name){
        console.log("Item name given!");
    }

    var item_prices = {
        name: "No naming API yet, sorry",
        type_id: req.query.typeid,
        max_buy: 0,
        min_sell: Infinity
    };

    fetch_all_prices(() => {
        console.log("##### I have a return value from fetch all");
        // httpRes.json(jita_prices);

        // Loop through giant arary and get max/min for our item
        for (let i = 0; i < giant_array.length; i++) {
            if (giant_array[i].type_id == item_prices.type_id) {
                var order_type;
                if (giant_array[i].is_buy_order) {
                    order_type = "buy";
                    // buy_prices.push(data[i].price);
                } else {
                    order_type = "sell";
                    //sell_prices.push(data[i].price);
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
        var name_url = "https://esi.tech.ccp.is/latest/universe/types/";
        name_url += req.query.typeid;
        name_url += "/?datasource=tranquility&language=en-us";
        fetch(name_url)
            .then(res =>{
                if(res.ok){
                    return res.json();
                } else { throw Error(res.statusText)}
            })
            .then(res => {
                console.log(res);
                console.log(res.name);
                item_prices.name = res.name;
                httpRes.json(item_prices);
                console.log("httpRes sent");
            })
            .catch(err =>{console.log(err)})

        
    });

    // httpRes.end();
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