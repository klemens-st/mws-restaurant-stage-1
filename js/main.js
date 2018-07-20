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
    return DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood).then(restaurants => {
      this.restaurants = restaurants;
    });
  },

  // Getter method form this.restaurants
  getRestaurants() {
    return this.restaurants;
  }
};

const restaurantsView = {
  init() {
    // Bind element
    this.el = document.getElementById('restaurants-list');

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
  init(center, zoom) {
    this.newMap = L.map('map', {
      center: center,
      zoom: zoom,
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

  addMarker(restaurant) {
    DBHelper.mapMarkerForRestaurant(restaurant);
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
    filterModel.init().then(() => filterView.init());
    restaurantsModel.init().then(() => restaurantsView.init());
    mapModel.init([40.722216, -73.987501], 12);
    breadcrumbView.reset();
  },

  // Getter methods
  getFilterData() {
    return filterModel.getData();
  },

  getFilterSelection() {
    return filterModel.getSelection();
  },

  getRestaurants() {
    return restaurantsModel.getRestaurants();
  },

  // This is called on user selection change
  updateRestaurants() {
    filterModel.updateSelection(filterView.getSelection());
    controller.resetRestaurants();
  },

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

/*
 * <main> controller
 */

const mainController = {
  setState(state) {
    this.state = state;
    mainView.render(state);
  },

  getState() {
    return this.state;
  }
};

const mainView = {
  // <main> element to hook into
  el: document.querySelector('main'),
  // All templates
  templates: document.querySelectorAll('.template'),

  // Maps states to templates
  // Returns a text/template element
  getTemplate(state) {
    let template;
    this.templates.forEach(n => {
      if (n.id === state) template = n;
    });
    return template;
  },

  render(state) {
    // Add 'inside' class to body if we are on details page
    if ('details' === state) {
      document.body.classList.add('inside');
    } else {
      document.body.classList.remove('inside');
    }

    // Insert template into page
    this.el.innerHTML = this.getTemplate(state).innerHTML;

    // Proceed with subviews
    switch (state) {
    case 'index':
      controller.init();
      break;
    case 'details':
      detailsController.init();
      break;
    }
  }
};

const restaurantModel = {
  init() {
    return this.fetchFromURL();
  },

  fetchFromURL() {
    return new Promise((resolve, reject) => {
      const id = getParameterByName('id');
      if (this.restaurant && this.restaurant.id === id) { // restaurant already fetched!
        resolve(this.restaurant);
      }
      if (!id) { // no id found in URL
        reject('No restaurant id in URL');
      } else {
        DBHelper.fetchRestaurantById(id).then(restaurant => {
          this.restaurant = restaurant;
          if (!restaurant) {
            reject(`No restaurant with id ${id} found.`);
          }
          // fillRestaurantHTML();
          resolve(restaurant);
        });
      }
    });
  }
};

const restaurantView = {
  render(restaurant) {
    const name = document.getElementById('restaurant-name');
    name.innerHTML = restaurant.name;

    const address = document.getElementById('restaurant-address');
    address.innerHTML = restaurant.address;

    const image = document.getElementById('restaurant-img');
    image.className = 'restaurant-img'
    image.src = DBHelper.imageUrlForRestaurant(restaurant);

    const cuisine = document.getElementById('restaurant-cuisine');
    cuisine.innerHTML = restaurant.cuisine_type;

    // fill operating hours
    if (restaurant.operating_hours) {
      this.renderHours(restaurant.operating_hours);
    }
    // fill reviews
    this.renderReviews(restaurant.reviews);
  },

  renderHours(operatingHours) {
    const hours = document.getElementById('restaurant-hours');
    for (let key in operatingHours) {
      const row = document.createElement('tr');

      const day = document.createElement('td');
      day.innerHTML = key;
      row.appendChild(day);

      const time = document.createElement('td');
      time.innerHTML = operatingHours[key];
      row.appendChild(time);

      hours.appendChild(row);
    }
  },

  renderReviews(reviews) {
    const container = document.getElementById('reviews-container');
    const title = document.createElement('h2');
    title.innerHTML = 'Reviews';
    container.appendChild(title);

    if (!reviews) {
      const noReviews = document.createElement('p');
      noReviews.innerHTML = 'No reviews yet!';
      container.appendChild(noReviews);
      return;
    }
    const ul = document.getElementById('reviews-list');
    reviews.forEach(review => {
      ul.appendChild(this.createReviewHTML(review));
    });
    container.appendChild(ul);
  },

  createReviewHTML(review) {
    const li = document.createElement('li');
    const name = document.createElement('p');
    name.innerHTML = review.name;
    li.appendChild(name);

    const date = document.createElement('p');
    date.innerHTML = review.date;
    li.appendChild(date);

    const rating = document.createElement('p');
    rating.innerHTML = `Rating: ${review.rating}`;
    li.appendChild(rating);

    const comments = document.createElement('p');
    comments.innerHTML = review.comments;
    li.appendChild(comments);

    return li;
  }

};

const detailsController = {
  init() {
    restaurantModel.init().then(restaurant => {
      breadcrumbView.render(restaurant);
      restaurantView.render(restaurant);
      mapModel.init([restaurant.latlng.lat, restaurant.latlng.lng], 16);
      mapModel.addMarker(restaurant);
    });
  }
};

const breadcrumbView = {
  el: document.getElementById('breadcrumb'),

  render(restaurant) {
    const li = document.createElement('li');
    li.innerHTML = restaurant.name;
    this.el.appendChild(li);
  },

  reset() {
    this.el.innerHTML = '<li><a href="/">Home</a></li>';
  }
};

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  url = new URL(url);
  return new URLSearchParams(url.search).get('id');
};