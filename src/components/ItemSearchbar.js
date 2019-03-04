// Main Libraries
import React, { Component } from 'react';

/*
Expected props:
  <ItemSearchbar
    handleSubmit={this.handleSubmit}
    handleTyping={this.handleTyping}
    searchInput={this.state.searchInput}
    disableRefresh={this.state.disableRefresh}
  />

  handleSubmit - app function for handling clicking 'submit' on a search
  handleTyping - state changes with each keystroke in the search bar
  searchInput - the current typed search input
  disableRefresh - a flag for whether or not a search is in progress and interactivity should be frozen as a result
*/

class ItemSearchbar extends Component {
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
        <h3> NOTE: Search by name currently broken, only typids work</h3>
        {search_form}
        <p>Examples: 2321, 16650, 32307, 40520, 44992, Polyaramids, PLEX, Spiced Wine</p>
      </div>)
    }
  }

export default ItemSearchbar;

