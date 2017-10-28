import React, { Component } from 'react';
import './App.css';

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
});


class App extends Component {
  constructor(props) {
    super(props); // required in the constructor of a React component

    this.fetchMineralPrices = this.fetchMineralPrices.bind(this);

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
    };

    // bind this for use in below callback
    // Not using an arrow function to preserve readability 
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
        //console.log(res);
        that.setState({ serverStatus: "Server connected, fetching data" });
      }).catch(err => console.log(err));   

  }

  componentWillMount() {
    this.fetchMineralPrices();
  }

  fetchMineralPrices() {
    this.setState({serverStatus: "Fetching price data...", disableRefresh: true});

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
        // console.log(res);
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
            // console.log(res);
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
              serverStatus: 'Buy/sell prices fetched, table updated!',
              disableRefresh: false
            });
          }).catch(err => {
            console.log(err);
            this.setState({serverStatus: "Error pulling prices. Trying again..."});
            setTimeout(this.fetchMineralPrices, 2000);
          });
      }).catch(err => {
        console.log(err);
        this.setState({serverStatus: "Error pulling prices. Trying again..."});
        setTimeout(this.fetchMineralPrices, 2000);
      });
  }

  render() {
    var status_icon;
    var refresh_button;
    if (this.state.disableRefresh){
      status_icon = (<i className="fa fa-spinner fa-spin" style={{fontSize: "20px"}}></i>);
      refresh_button = (<button className="btn btn-primary btn-lg disabled">Refresh Prices</button>);
    } else {
      refresh_button = (<button className ="btn btn-primary btn-lg" onClick={this.fetchMineralPrices}>Refresh Prices</button>)
      status_icon = (<span className="glyphicon glyphicon-ok" style={{color:"green", fontSize: "20px"}}aria-hidden="true"></span>);
    }
    return (
      <div className="container">
        <div className="row">
          <div className="jumbotron text-center">
            <h1>Eve: Online Mineral Prices</h1>
            <h4>Market prices at a glance from the Eve ESI API</h4>            
          </div>
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
          <br />
          <div className="text-center">
          {refresh_button}
          </div>
          <br />
          <br />
          <p className="col-sm-6 col-md-offset-3">Data pulled from the <a href="https://esi.tech.ccp.is/latest/">ESI API</a>. <strong>Universe Price</strong> is the price returned by the generic price API. <strong>Jita Buy</strong> is the highest buy order located in Jita 4-4, regardless of volume. <strong>Jita Sell</strong> is the lowest sell order located in Jita 4-4, regardless of volume. Prices will not reflect regional buy/sell orders, even if they can be filled in Jita 4-4.</p>
          <br />

        </div>
      </div>
    );
  }
}

export default App;
