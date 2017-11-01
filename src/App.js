import React, { Component } from 'react';
import './App.css';

// format currency values for display
const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
});


class App extends Component {
  constructor(props) {
    super(props); // required in the constructor of a React component

    this.fetchMineralPrices = this.fetchMineralPrices.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleTyping = this.handleTyping.bind(this);
    this.handleRemoveItem = this.handleRemoveItem.bind(this);
    this.clearQuickbar = this.clearQuickbar.bind(this);

    // Gigantic state object; initial test version of app with 
    // hard coded state for each mineral price remained in place
    // while more sane array/object storage was added later for individual items
    this.state = {
      serverStatus: "No response from the server yet...",
      tritanium: 0,
      pyerite: 0,
      isogen: 0,
      mexallon: 0,
      nocxium: 0,
      zydrine: 0,
      megacyte: 0,
      morphite: 0,
      tritaniumsell: 0,
      pyeritesell: 0,
      isogensell: 0,
      mexallonsell: 0,
      nocxiumsell: 0,
      zydrinesell: 0,
      megacytesell: 0,
      morphitesell: 0,
      tritaniumbuy: 0,
      pyeritebuy: 0,
      isogenbuy: 0,
      mexallonbuy: 0,
      nocxiumbuy: 0,
      zydrinebuy: 0,
      megacytebuy: 0,
      morphitebuy: 0,
      disableRefresh: false,
      quickbar: [],
      searchInput: '',
      saved_quickbar: [],
      error_message: false
    };

    // bind this for use in below callback
    // Not using an arrow function to preserve readability 
    // and compare with binding used elsewhere for learning
    var that = this;

    // test connection to the server by fetching data to display
    fetch('/test')
      .then(function (res) {
        if (res.ok) {
          return res.json();
        } else {
          throw Error(res.statusText);
        }
      })
      .then(function (res) {
        that.setState({ serverStatus: "Server connected, fetching data" });
      }).catch(err => {
        console.log("Error hitting test endpoint - server down?");
        console.log(err);
      });

  }

  nameSearch(name) {
    var name_url = "/typeidbyname/?name=" + name;
    fetch(name_url)
      .then(res => {
        if (res.ok) {
          return res.json();
        } else { throw Error(res.statusText) }
      })
      .then(res => {
        if (res.typeName !== 'bad item') {
          this.get_jita_price(res.typeID);
        }
        else {
          this.setState({ error_message: `Bad search term (${name}) or server error`, disableRefresh: false, serverStatus: 'Up to date' });
        }

      })
      .catch(err => {
        console.log("Error: name search failed");
        console.log(err);
      });

  }

  get_jita_price(type_id) {
    var input = parseInt(type_id, 10);
    if (input) {
      // old code for testing
      // console.log("Number/typeID entered")
    }
    else {
      this.nameSearch(type_id);
      return;
    }

    // assuming we have a type_id:
    var item_url = '/getjitaprice?typeid=';
    item_url += type_id;
    fetch(item_url)
      .then(res => {
        if (res.ok) {
          return res.json();
        } else { throw Error(res.statusText) }
      })
      .then(res => {
        if (res.error) {
          this.setState({ error_message: `Bad search term (${res.type_id}) or server error`, disableRefresh: false, serverStatus: 'Up to date' });
          return;
        }
        var old_quickbar = this.state.quickbar.slice();
        var new_item = {};
        new_item.name = res.name;
        new_item.type_id = res.type_id;
        new_item.max_buy = USD.format(res.max_buy);
        new_item.min_sell = USD.format(res.min_sell);
        var need_to_push = true;
        // check to see if we're updating or adding to the quickbar
        for (let i = 0; i < old_quickbar.length; i++) {
          if (old_quickbar[i].type_id === new_item.type_id) {
            old_quickbar[i].max_buy = new_item.max_buy;
            old_quickbar[i].min_sell = new_item.min_sell;
            need_to_push = false;
          }
        }
        if (need_to_push) {
          old_quickbar.push(new_item);
        }

        localStorage.quickbar = JSON.stringify(old_quickbar);
        this.setState({
          quickbar: old_quickbar,
          saved_quickbar: old_quickbar,
          error_message: false,
          serverStatus: "Up to date!",
          disableRefresh: false
        });
      })
      .catch(err => { 
        console.log("Error fetching single price:");
        console.log(err); 
      });

  }


  handleSubmit(event) {
    event.preventDefault();
    var search_term = this.state.searchInput;
    this.setState({ searchInput: '', serverStatus: 'Looking up price...', disableRefresh: true });
    this.get_jita_price(search_term);
  }

  handleTyping(event) {
    this.setState({ searchInput: event.target.value })
  }

  handleRemoveItem(event) {
    var quickbar_item_to_delete = parseInt(event.target.id, 10);
    var old_quickbar = this.state.quickbar.slice();
    old_quickbar.splice(quickbar_item_to_delete, 1);
    localStorage.quickbar = JSON.stringify(old_quickbar);
    this.setState({ quickbar: old_quickbar, saved_quickbar: old_quickbar });
  }

  clearQuickbar() {
    this.setState({
      quickbar: [],
      saved_quickbar: []
    });
    localStorage.quickbar = JSON.stringify([]);
  }

  componentDidMount() {
    // check session storage for quickbar
    if (typeof (Storage) !== "undefined") {
      if (localStorage.getItem("quickbar")) {
        var saved_quickbar = JSON.parse(localStorage.getItem("quickbar"));
        this.setState({ saved_quickbar: saved_quickbar });
      }
    } else {
      console.log("No webstorage support, no saved quickbar");
    }
    // Then get prices
    this.fetchMineralPrices();
  }

  fetchMineralPrices() {
    var empty_quickbar = this.state.quickbar.slice();
    for (let i = 0; i < empty_quickbar.length; i++) {
      empty_quickbar[i].max_buy = ". . .";
      empty_quickbar[i].min_sell = ". . .";
    }
    this.setState({ serverStatus: "Fetching price data...", disableRefresh: true, quickbar: empty_quickbar });

    // get universe price data
    fetch('/getmineralprices')
      .then(res => {
        if (res.ok) {
          return res.json();
        } else {
          throw Error(res.statusText)
        }
      })
      .then(res => {
        if (res.error) {
          console.log("HTTP Error:");
          console.log(res);
          this.setState({ serverStatus: res.error_message, error_message: res.error_message });
          setTimeout(this.fetchMineralPrices, 2000);
          return;
        }
        this.setState({
          tritanium: USD.format(parseFloat(res.tritanium, 10)),
          pyerite: USD.format(parseFloat(res.pyerite, 10)),
          isogen: USD.format(parseFloat(res.isogen, 10)),
          mexallon: USD.format(parseFloat(res.mexallon, 10)),
          megacyte: USD.format(parseFloat(res.megacyte, 10)),
          nocxium: USD.format(parseFloat(res.nocxium, 10)),
          zydrine: USD.format(parseFloat(res.zydrine, 10)),
          morphite: USD.format(parseFloat(res.morphite, 10)),
          serverStatus: "Universe prices fetched... fetching jita buy/sell prices"
        });
        // get Jita buy and sell data
        fetch('/getjitamineralsell')
          .then(res => {
            if (res.ok) {
              return res.json();
            } else {
              throw Error(res.statusText)
            }
          })
          .then(res => {
            if (res.error) {
              console.log("error fetching mineral prices");
              console.log(res);
              this.setState({ error_message: "Error fetching prices. Trying again...", serverStatus: "Prices server error." });
              setTimeout(this.fetchMineralPrices, 2000);
              return;
            }
            this.setState({
              tritaniumsell: USD.format(parseFloat(res.tritanium.lowest_sell, 10)),
              pyeritesell: USD.format(parseFloat(res.pyerite.lowest_sell, 10)),
              isogensell: USD.format(parseFloat(res.isogen.lowest_sell, 10)),
              mexallonsell: USD.format(parseFloat(res.mexallon.lowest_sell, 10)),
              megacytesell: USD.format(parseFloat(res.megacyte.lowest_sell, 10)),
              nocxiumsell: USD.format(parseFloat(res.nocxium.lowest_sell, 10)),
              zydrinesell: USD.format(parseFloat(res.zydrine.lowest_sell, 10)),
              morphitesell: USD.format(parseFloat(res.morphite.lowest_sell, 10)),
              tritaniumbuy: USD.format(parseFloat(res.tritanium.highest_buy, 10)),
              pyeritebuy: USD.format(parseFloat(res.pyerite.highest_buy, 10)),
              isogenbuy: USD.format(parseFloat(res.isogen.highest_buy, 10)),
              mexallonbuy: USD.format(parseFloat(res.mexallon.highest_buy, 10)),
              megacytebuy: USD.format(parseFloat(res.megacyte.highest_buy, 10)),
              nocxiumbuy: USD.format(parseFloat(res.nocxium.highest_buy, 10)),
              zydrinebuy: USD.format(parseFloat(res.zydrine.highest_buy, 10)),
              morphitebuy: USD.format(parseFloat(res.morphite.highest_buy, 10)),
              serverStatus: 'Mineral buy/sell prices fetched, fetching quickbar!',
              disableRefresh: false,
              error_message: false
            });
            // update the quickbar, if it exists
            var saved_quickbar_copy = this.state.saved_quickbar.slice();
            if (saved_quickbar_copy.length > 0) {
              for (let i = 0; i < saved_quickbar_copy.length; i++) {
                this.get_jita_price(saved_quickbar_copy[i].type_id);
              }
            }
            this.setState({ serverStatus: "Prices updated!" });

          }).catch(err => {
            console.log(err);
            this.setState({ serverStatus: "Error pulling prices. Trying again..." });
            setTimeout(this.fetchMineralPrices, 2000);
          });
      }).catch(err => {
        console.log(err);
        this.setState({ serverStatus: "Error pulling prices. Trying again..." });
        setTimeout(this.fetchMineralPrices, 2000);
      });
  }

  render() {
    var error_alert = false;
    if (this.state.error_message) {
      error_alert = (<div className="alert alert-warning text-center col-sm-6 col-sm-offset-3"><strong>Error: </strong>{this.state.error_message}</div>)
    }
    var status_icon;
    var refresh_button;
    if (this.state.disableRefresh) {
      status_icon = (<i className="fa fa-spinner fa-spin" style={{ fontSize: "20px" }}></i>);
      refresh_button = (<button className="btn btn-success btn-lg disabled">Refresh Prices</button>);
    } else {
      refresh_button = (<button className="btn btn-success btn-lg" onClick={this.fetchMineralPrices}>Refresh Prices</button>)
      status_icon = (<span className="glyphicon glyphicon-ok" style={{ color: "green", fontSize: "20px" }} aria-hidden="true"></span>);
    }
    return (
      <div className="container">
        <div className="text-center">
          <h1>EVE Online Market Prices</h1>
          <h4>Market prices at a glance from the Eve ESI API</h4>
        </div>
        <div className="row">
          <h3 className="text-center"><strong>Data Status</strong></h3>
          <p className="text-center">{status_icon}</p>
          <p className="text-center">{this.state.serverStatus} </p>
          <br />
          <table className="table table-condensed">
            <tbody>
              <tr>
                <td className="col-md-1"></td>
                <td className="col-md-1"><strong>Tritanium</strong></td>
                <td className="col-md-1"><strong>Pyerite</strong></td>
                <td className="col-md-1"><strong>Isogen</strong></td>
                <td className="col-md-1"><strong>Mexallon</strong></td>
                <td className="col-md-1"><strong>Nocxium</strong></td>
                <td className="col-md-1"><strong>Zydrine</strong></td>
                <td className="col-md-1"><strong>Megacyte</strong></td>
                <td className="col-md-1"><strong>Morphite</strong></td>
              </tr>
              <tr>
                <td className="col-md-1"><strong>Jita Buy</strong></td>
                <td className="col-md-1">{this.state.tritaniumbuy}</td>
                <td className="col-md-1">{this.state.pyeritebuy}</td>
                <td className="col-md-1">{this.state.isogenbuy}</td>
                <td className="col-md-1">{this.state.mexallonbuy}</td>
                <td className="col-md-1">{this.state.nocxiumbuy}</td>
                <td className="col-md-1">{this.state.zydrinebuy}</td>
                <td className="col-md-1">{this.state.megacytebuy}</td>
                <td className="col-md-1">{this.state.morphitebuy}</td>
              </tr>
              <tr>
                <td className="col-md-1"><strong>Jita Sell</strong></td>
                <td className="col-md-1">{this.state.tritaniumsell}</td>
                <td className="col-md-1">{this.state.pyeritesell}</td>
                <td className="col-md-1">{this.state.isogensell}</td>
                <td className="col-md-1">{this.state.mexallonsell}</td>
                <td className="col-md-1">{this.state.nocxiumsell}</td>
                <td className="col-md-1">{this.state.zydrinesell}</td>
                <td className="col-md-1">{this.state.megacytesell}</td>
                <td className="col-md-1">{this.state.morphitesell}</td>
              </tr>
              <tr>
                <td className="col-md-1"><strong>Universe Price</strong></td>
                <td className="col-md-1">{this.state.tritanium}</td>
                <td className="col-md-1">{this.state.pyerite}</td>
                <td className="col-md-1">{this.state.isogen}</td>
                <td className="col-md-1">{this.state.mexallon}</td>
                <td className="col-md-1">{this.state.nocxium}</td>
                <td className="col-md-1">{this.state.zydrine}</td>
                <td className="col-md-1">{this.state.megacyte}</td>
                <td className="col-md-1">{this.state.morphite}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="row">
          {error_alert}
        </div>
        <div className="row">
          <ItemSearchBar
            handleSubmit={this.handleSubmit}
            handleTyping={this.handleTyping}
            searchInput={this.state.searchInput}
            disableRefresh={this.state.disableRefresh}
          />
        </div>
        <div className="row">
          <ItemQuickBar
            items={this.state.quickbar}
            handleRemoveItem={this.handleRemoveItem}
          />
          <br />
        </div>
        <div className="row">
          <br />
          <div className="col-sm-6 col-md-offset-3">
            <br />
            <div className="text-center">
              {refresh_button} <button className="btn btn-lg btn-danger" onClick={this.clearQuickbar}>Delete Quickbar</button>
            </div>
          </div>
          <br />
        </div>
        <div className="row">
          <br />
          <div className="col-sm-6 col-md-offset-3">
            <p className="text-center">- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - </p>
            <p>Data pulled from the <a href="https://esi.tech.ccp.is/latest/">ESI API</a>. <strong>Universe Price</strong> is the price returned by the generic price API. <strong>Jita Buy</strong> is the highest buy order located in Jita 4-4, regardless of volume. <strong>Jita Sell</strong> is the lowest sell order located in Jita 4-4, regardless of volume. Prices will not reflect regional buy/sell orders, even if they can be filled in Jita 4-4.</p>
            <p>Name search works with help of the API from <a href="https://www.fuzzwork.co.uk/tools/api-typename-to-typeid/">https://www.fuzzwork.co.uk/tools/api-typename-to-typeid/</a> - thanks!</p>
          </div>
        </div>
      </div>
    );
  }
}

class ItemSearchBar extends Component {
  render() {
    var search_form;
    if (this.props.disableRefresh) {
      search_form = (
        <form>
          <div className="form-group">
            <input
              maxLength="100"
              type="text"
              placeholder="Enter search term"
              value='' /> <button
                type="submit"
                className="disabled btn btn-primary"
              >Submit</button>
          </div>
        </form>
      );
    }
    else {
      search_form = (
        <form onSubmit={this.props.handleSubmit}>
          <div className="form-group">
            <input
              maxLength="100"
              type="text"
              placeholder="Enter search term"
              value={this.props.searchInput}
              onChange={this.props.handleTyping} /> <button
                type="submit"
                className="btn btn-primary"
                onClick={this.props.handleSubmit}
              >Submit</button>
          </div>
        </form>
      )
    }
    return (<div className="text-center">
      <h3>Search for items to add to quickbar</h3>
      {search_form}
      <p>Examples: 2321, 16650, 32307, 40520, 44992, Polyaramids, PLEX, Spiced Wine</p>
    </div>)
  }
}

class ItemQuickBar extends Component {

  render() {
    var tablerows = [];
    for (let i = 0; i < this.props.items.length; i++) {
      tablerows.push(<tr key={this.props.items[i].type_id}>
        <td>{this.props.items[i].name}</td>
        <td>{this.props.items[i].type_id}</td>
        <td className="text-center">{this.props.items[i].max_buy}</td>
        <td className="text-center">{this.props.items[i].min_sell}</td>
        <td className="text-center"><button className="btn btn-danger btn-sm" id={i} onClick={this.props.handleRemoveItem}>X</button></td>
      </tr>);
    }

    return (<div className="col-sm-6 col-sm-offset-3">
      <table className="table">
        <thead>
          <tr>
            <th><strong>Name</strong></th>
            <th><strong>TypeID</strong></th>
            <th className="text-center"><strong>Jita Buy</strong></th>
            <th className="text-center"><strong>Jita Sell</strong></th>
            <th className="text-center"><strong>Remove</strong></th>
          </tr>
        </thead>
        <tbody>
          {tablerows}
        </tbody>
      </table>
    </div>)
  }
}

export default App;
