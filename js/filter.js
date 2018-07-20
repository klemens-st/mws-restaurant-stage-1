/*
 * Filter Selection
 */

const filterModel = {
  // Stores user selection. Initializes with default data.
  selection: {
    cuisine: 'all',
    neighborhood: 'all'
  },

  init() {
    // Return a promise when all data is fetched sucessfully
    return Promise.all([
      this.fetchNeighborhoods(),
      this.fetchCuisines()
    ]);
  },

  fetchNeighborhoods() {
    // Get data from the DB
    return DBHelper.fetchNeighborhoods().then(neighborhoods => {
      this.neighborhoods = neighborhoods;
    });
  },

  fetchCuisines() {
    // Get data from the DB
    return DBHelper.fetchCuisines().then(cuisines => {
      this.cuisines = cuisines;
    });
  },

  // Getter method fetched data.
  getData() {
    return {
      neighborhoods: this.neighborhoods,
      cuisines: this.cuisines
    };
  },

  updateSelection(selection) {
    this.selection = selection;
  },

  getSelection() {
    return this.selection;
  }
};

const filterView = {
  init() {
    // Bind elements
    this.neighborhoodsEl =document.getElementById('neighborhoods-select');
    this.cuisinesEl = document.getElementById('cuisines-select');
    // Render with the data from the controller
    this.render(controller.getFilterData());

    // Listen for changes in filter selection
    [this.neighborhoodsEl, this.cuisinesEl].forEach((el) => {
      el.addEventListener('change', controller.updateRestaurants);
    });
  },

  render(data) {
    // Render neighborhoods
    data.neighborhoods.forEach(neighborhood => {
      const option = document.createElement('option');
      option.innerHTML = neighborhood;
      option.value = neighborhood;
      this.neighborhoodsEl.append(option);
    });

    // Render cuisines
    data.cuisines.forEach(cuisine => {
      const option = document.createElement('option');
      option.innerHTML = cuisine;
      option.value = cuisine;
      this.cuisinesEl.append(option);
    });
  },

  // Retrieve and return user selection
  getSelection() {
    const cIndex = this.cuisinesEl.selectedIndex;
    const nIndex = this.neighborhoodsEl.selectedIndex;

    return {
      cuisine: this.cuisinesEl[cIndex].value,
      neighborhood: this.neighborhoodsEl[nIndex].value
    };
  }
};
