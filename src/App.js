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
      serverStatus: "No request/response from the server yet...",
      tritanium: 0,
      pyerite: 0,
      isogen: 0,
      mexallon: 0,
      nocxium: 0,
      zydrine: 0,
      megacyte: 0,
      morphite: 0
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
        console.log(res);
        that.setState({ serverStatus: "Server connected!" });
      }).catch(err => console.log(err));

    this.fetchMineralPrices();

  }

  fetchMineralPrices() {

    // get price data
    fetch('/getmineralprices')
      .then(res => {
        if (res.ok) {
          return res.json();
        } else {
          throw Error(res.statusText)
        }
      })
      .then(res => {
        console.log(res);
        this.setState({
          tritanium: USD.format(parseFloat(res.tritanium, 10)),
          pyerite: USD.format(parseFloat(res.pyerite, 10)),
          isogen: USD.format(parseFloat(res.isogen, 10)),
          mexallon: USD.format(parseFloat(res.mexallon, 10)),
          megacyte: USD.format(parseFloat(res.megacyte, 10)),
          nocxium: USD.format(parseFloat(res.nocxium, 10)),
          zydrine: USD.format(parseFloat(res.zydrine, 10)),
          morphite: USD.format(parseFloat(res.morphite, 10)),
        });
      }).catch(err => console.log(err));

  }

  render() {
    return (
      <div className="container">
        <div className="row">
          <div className="jumbotron text-center">
            <h1>Eve: Online Price Check</h1>
            <h4>Market prices at a glance from the Eve: Online API</h4>
          </div>
        </div>
        <div className="row">
          <p className="text-center">Hello, Eve-world! React is rendering this JSX code.</p>
          <p className="text-center">Server response: {this.state.serverStatus} </p>
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
                <td className="col-md-1"><strong>Current Price</strong></td>
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
      </div>
    );
  }
}

export default App;
