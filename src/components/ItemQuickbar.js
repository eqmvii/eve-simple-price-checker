// Main Libraries
import React, { Component } from 'react';

/*
Expected props: 
  <ItemQuickbar
    items={this.state.quickbar}
    handleRemoveItem={this.handleRemoveItem}
  />
    items - an array of items with prices
    handleRemoveItem - a function to handle removing a single item from the quickbar
*/
class ItemQuickbar extends Component {    
      render() {
        // build an array of item names, prices, and delete buttons
        var tablerows = [];
        if (!this.props.items){
            return false;
        }
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

    export default ItemQuickbar;

