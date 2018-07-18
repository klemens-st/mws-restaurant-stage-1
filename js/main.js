/*
 * Filter Selection
 */

const filterModel = {
  init() {
    // Return a promise when all data is fetched sucessfully
    return Promise.all([
      this.fetchNeighborhoods(),
      this.fetchCuisines()
    ]);
  },

  fetchNeighborhoods() {
    // Get data from the DB
    return new Promise((resolve, reject) => {
      DBHelper.fetchNeighborhoods((error, neighborhoods) => {
        if (error) { // Got an error
          console.error(error);
          reject();
        } else {
          this.neighborhoods = neighborhoods;
          resolve();
        }
      });
    });
  },

  fetchCuisines() {
    // Get data from the DB
    return new Promise((resolve, reject) => {
      DBHelper.fetchCuisines((error, cuisines) => {
        if (error) { // Got an error!
          console.error(error);
          reject();
        } else {
          this.cuisines = cuisines;
          resolve();
        }
      });
    });
  },

  // Getter method fetched data.
  getData() {
    return {
      neighborhoods: this.neighborhoods,
      cuisines: this.cuisines
    };
  }
};

const filterView = {
  neighborhoodsEl: document.getElementById('neighborhoods-select'),
  cuisinesEl: document.getElementById('cuisines-select'),

  init() {
    // Render with the data from the controller
    this.render(controller.getFilterData());

    // Listen for changes in filter selection
    [this.neighborhoodsEl, this.cuisinesEl].forEach((el) => {
      el.addEventListener('change', controller.resetRestaurants);
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

/*
 * Restaurants list
 */

const restaurantsModel = {
  init() {
    const sel = controller.getFilterSelection();
    return this.fetchRestaurants(sel.cuisine, sel.neighborhood);
  },

  // Get data from the DB
  fetchRestaurants(cuisine, neighborhood) {
    return new Promise((resolve, reject) => {
      DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
        if (error) { // Got an error!
          console.error(error);
          reject();
        } else {
          this.restaurants = restaurants;
          resolve();
          // need to reset markers in the view
        }
      });
    });
  },

  // Getter method form this.restaurants
  getRestaurants() {
    return this.restaurants;
  }
};

const restaurantsView = {
  el: document.getElementById('restaurants-list'),

  init() {
    this.render(controller.getRestaurants());
  },

  render(restaurants) {
    this.el.innerHTML = '';

    // Map setup
    controller.setMarkers(restaurants);

    restaurants.forEach(restaurant => {
      this.el.append(this.createHTML(restaurant));
    });
  },

  createHTML(restaurant) {
    const li = document.createElement('li');

    const image = document.createElement('img');
    image.className = 'restaurant-img';
    image.src = DBHelper.imageUrlForRestaurant(restaurant);
    li.append(image);

    const name = document.createElement('h1');
    name.innerHTML = restaurant.name;
    li.append(name);

    const neighborhood = document.createElement('p');
    neighborhood.innerHTML = restaurant.neighborhood;
    li.append(neighborhood);

    const address = document.createElement('p');
    address.innerHTML = restaurant.address;
    li.append(address);

    const more = document.createElement('a');
    more.innerHTML = 'View Details';
    more.href = DBHelper.urlForRestaurant(restaurant);
    li.append(more);

    return li;
  },
};


/*
 * Map
 */

const mapModel = {
  markers: [],

  // Mapbox init
  init() {
    this.newMap = L.map('map', {
      center: [40.722216, -73.987501],
      zoom: 12,
      scrollWheelZoom: false
    });
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
      mapboxToken: 'pk.eyJ1IjoienltZXRoIiwiYSI6ImNqanB1czAyNzJrYnUzcW0waTN5aWFka2oifQ.nQ7qOoLJpnAvXnmRI70_dQ',
      maxZoom: 18,
      attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      id: 'mapbox.streets'
    }).addTo(this.newMap);
  },

  // Resets map markers
  addMarkers(restaurants) {
    this.resetMarkers();

    restaurants.forEach(restaurant => {
      // Add marker to the map
      const marker = DBHelper.mapMarkerForRestaurant(restaurant, this.newMap);
      marker.on('click', onClick);
      function onClick() {
        window.location.href = marker.options.url;
      }
      this.markers.push(marker);
    });
  },

  resetMarkers() {
    if (this.markers) {
      this.markers.forEach(marker => marker.remove());
    }
    this.markers = [];
  }
};

/*
 * Controller
 */

const controller = {
  // Set everything up and render.
  init() {
    document.addEventListener('DOMContentLoaded', () => {
      filterModel.init().then(() => filterView.init());
      restaurantsModel.init().then(() => restaurantsView.init());
      mapModel.init();
    });
  },

  // Getter methods
  getFilterData() {
    return filterModel.getData();
  },

  getFilterSelection() {
    return filterView.getSelection();
  },

  getRestaurants() {
    return restaurantsModel.getRestaurants();
  },

  // This is called on user selection change
  resetRestaurants() {
    restaurantsModel.init().then(() => restaurantsView.render(
      controller.getRestaurants())
    );
  },

  // Triggers map resets.
  setMarkers(restaurants) {
    mapModel.addMarkers(restaurants);
  }
};

controller.init();
