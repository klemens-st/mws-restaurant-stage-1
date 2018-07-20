/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 8000; // Change this to your server port
    return `http://localhost:${port}/data/restaurants.json`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants() {
    // Since we always fetch the entire json that never changes,
    // let's request it only once and store in a static property.
    // DBHelper.json is a promise returned by Response.json();
    if (!DBHelper.json) {
      DBHelper.json = fetch(DBHelper.DATABASE_URL)
        .then(response => {
          if (200 === response.status) {
            return response.json();
          } else {
            throw `Request failed. Returned status of ${response.status}`;
          }
        })
        .catch(msg => console.error(msg));
    }
    return DBHelper.json;
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id) {
    // fetch all restaurants with proper error handling.
    return new Promise((resolve, reject) => {
      DBHelper.fetchRestaurants().then(restaurants => {
        const restaurant = restaurants.restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          resolve(restaurant);
        } else { // Restaurant does not exist in the database
          reject('Restaurant does not exist');
        }
      });
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine) {
    // Fetch all restaurants  with proper error handling
    return new Promise((resolve) => {
      DBHelper.fetchRestaurants().then(restaurants => {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.restaurants.filter(r => r.cuisine_type == cuisine);
        resolve(results);
      });
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood) {
    // Fetch all restaurants
    return new Promise((resolve) => {
      DBHelper.fetchRestaurants().then(restaurants => {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.restaurants.filter(r => r.neighborhood == neighborhood);
        resolve(results);
      });
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
    // Fetch all restaurants
    return new Promise((resolve) => {
      DBHelper.fetchRestaurants().then(restaurants => {
        let results = restaurants.restaurants;
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        resolve(results);
      });
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods() {
    // Fetch all restaurants
    return new Promise((resolve) => {
      DBHelper.fetchRestaurants().then(restaurants => {
        // Get all neighborhoods from all restaurants
        restaurants = restaurants.restaurants;
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
        resolve(uniqueNeighborhoods);
      });
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines() {
    // Fetch all restaurants
    return new Promise((resolve) => {
      DBHelper.fetchRestaurants().then(restaurants => {
        restaurants = restaurants.restaurants;
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
        resolve(uniqueCuisines);
      });
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant/?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      }
    );
      marker.addTo(mapModel.newMap);
    return marker;
  }
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

}

/*
 * Details page controller
 */

const detailsController = {
  init() {
    restaurantModel.init().then(restaurant => {
      breadcrumbView.render(restaurant);
      restaurantView.render(restaurant);
      mapModel.init([restaurant.latlng.lat, restaurant.latlng.lng], 16);
      mapModel.addMarker(restaurant);
      window.scrollTo(0, 0);
    });
  }
};
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
 * Index page controller
 */

const controller = {
  // Set everything up and render.
  init() {
    filterModel.init().then(() => filterView.init());
    restaurantsModel.init().then(() => restaurantsView.init());
    mapModel.init([40.722216, -73.987501], 11);
    breadcrumbView.reset();
    window.scrollTo(0, 0);
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

/*
 * <main> view
 */

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

  // Add single marker
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
    image.className = 'restaurant-img';
    image.src = DBHelper.imageUrlForRestaurant(restaurant);
    image.alt = restaurant.name;

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
    image.alt = restaurant.name;
    li.append(image);

    // Title is a link to details page
    // Removed 'View details' for accessibility reasons
    const more = document.createElement('a');
    more.href = DBHelper.urlForRestaurant(restaurant);
    more.innerHTML = restaurant.name;

    const name = document.createElement('h3');
    name.append(more);
    li.append(name);

    const neighborhood = document.createElement('p');
    neighborhood.innerHTML = restaurant.neighborhood;
    li.append(neighborhood);

    const address = document.createElement('p');
    address.innerHTML = restaurant.address;
    li.append(address);

    return li;
  },
};

/*
 * Main router object
 */
const router = {
  // maps routes to states
  routes: {
    '/': 'index',
    '/restaurant/': 'details'
  },

  init() {
    // Load the page
    this.navigate(location.href);

    // Listen for clicks on links. Exclude bookmark links
    document.body.addEventListener('click', (e) => {
      if (e.target.nodeName === 'A' &&
          e.target.getAttribute('href').charAt(0) !== '#') {
        e.preventDefault();
        this.navigate(e.target.href);
      }
    });
    // Manage back and forward buttons
    window.onpopstate = () => {
      this.navigate(location.href);
    };
    // Register Service Worker
    if (!navigator.serviceWorker) return;
    navigator.serviceWorker.register('/sw.js');
  },



  // @param url string
  navigate(url) {
    if (new URL(url).origin === location.origin) {
      if (url !== location.href) {
        history.pushState(null, null, url);
      }
      this.changeState(url);
    }
  },

  changeState(url) {
    mainController.setState(
      this.routes[new URL(url).pathname]
    );
  }
};

document.addEventListener('DOMContentLoaded', () => router.init());
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRiaGVscGVyLmpzIiwiZGV0YWlscy5qcyIsImZpbHRlci5qcyIsImluZGV4LmpzIiwibWFpbi5qcyIsIm1hcC5qcyIsInJlc3RhdXJhbnQuanMiLCJyZXN0YXVyYW50cy5qcyIsInJvdXRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb21tb24gZGF0YWJhc2UgaGVscGVyIGZ1bmN0aW9ucy5cbiAqL1xuY2xhc3MgREJIZWxwZXIge1xuXG4gIC8qKlxuICAgKiBEYXRhYmFzZSBVUkwuXG4gICAqIENoYW5nZSB0aGlzIHRvIHJlc3RhdXJhbnRzLmpzb24gZmlsZSBsb2NhdGlvbiBvbiB5b3VyIHNlcnZlci5cbiAgICovXG4gIHN0YXRpYyBnZXQgREFUQUJBU0VfVVJMKCkge1xuICAgIGNvbnN0IHBvcnQgPSA4MDAwOyAvLyBDaGFuZ2UgdGhpcyB0byB5b3VyIHNlcnZlciBwb3J0XG4gICAgcmV0dXJuIGBodHRwOi8vbG9jYWxob3N0OiR7cG9ydH0vZGF0YS9yZXN0YXVyYW50cy5qc29uYDtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCBhbGwgcmVzdGF1cmFudHMuXG4gICAqL1xuICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50cygpIHtcbiAgICAvLyBTaW5jZSB3ZSBhbHdheXMgZmV0Y2ggdGhlIGVudGlyZSBqc29uIHRoYXQgbmV2ZXIgY2hhbmdlcyxcbiAgICAvLyBsZXQncyByZXF1ZXN0IGl0IG9ubHkgb25jZSBhbmQgc3RvcmUgaW4gYSBzdGF0aWMgcHJvcGVydHkuXG4gICAgLy8gREJIZWxwZXIuanNvbiBpcyBhIHByb21pc2UgcmV0dXJuZWQgYnkgUmVzcG9uc2UuanNvbigpO1xuICAgIGlmICghREJIZWxwZXIuanNvbikge1xuICAgICAgREJIZWxwZXIuanNvbiA9IGZldGNoKERCSGVscGVyLkRBVEFCQVNFX1VSTClcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmICgyMDAgPT09IHJlc3BvbnNlLnN0YXR1cykge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgYFJlcXVlc3QgZmFpbGVkLiBSZXR1cm5lZCBzdGF0dXMgb2YgJHtyZXNwb25zZS5zdGF0dXN9YDtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChtc2cgPT4gY29uc29sZS5lcnJvcihtc2cpKTtcbiAgICB9XG4gICAgcmV0dXJuIERCSGVscGVyLmpzb247XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggYSByZXN0YXVyYW50IGJ5IGl0cyBJRC5cbiAgICovXG4gIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRCeUlkKGlkKSB7XG4gICAgLy8gZmV0Y2ggYWxsIHJlc3RhdXJhbnRzIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKCkudGhlbihyZXN0YXVyYW50cyA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3RhdXJhbnQgPSByZXN0YXVyYW50cy5yZXN0YXVyYW50cy5maW5kKHIgPT4gci5pZCA9PSBpZCk7XG4gICAgICAgIGlmIChyZXN0YXVyYW50KSB7IC8vIEdvdCB0aGUgcmVzdGF1cmFudFxuICAgICAgICAgIHJlc29sdmUocmVzdGF1cmFudCk7XG4gICAgICAgIH0gZWxzZSB7IC8vIFJlc3RhdXJhbnQgZG9lcyBub3QgZXhpc3QgaW4gdGhlIGRhdGFiYXNlXG4gICAgICAgICAgcmVqZWN0KCdSZXN0YXVyYW50IGRvZXMgbm90IGV4aXN0Jyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIHJlc3RhdXJhbnRzIGJ5IGEgY3Vpc2luZSB0eXBlIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxuICAgKi9cbiAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5Q3Vpc2luZShjdWlzaW5lKSB7XG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzICB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZ1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygpLnRoZW4ocmVzdGF1cmFudHMgPT4ge1xuICAgICAgICAvLyBGaWx0ZXIgcmVzdGF1cmFudHMgdG8gaGF2ZSBvbmx5IGdpdmVuIGN1aXNpbmUgdHlwZVxuICAgICAgICBjb25zdCByZXN1bHRzID0gcmVzdGF1cmFudHMucmVzdGF1cmFudHMuZmlsdGVyKHIgPT4gci5jdWlzaW5lX3R5cGUgPT0gY3Vpc2luZSk7XG4gICAgICAgIHJlc29sdmUocmVzdWx0cyk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCByZXN0YXVyYW50cyBieSBhIG5laWdoYm9yaG9vZCB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cbiAgICovXG4gIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRCeU5laWdoYm9yaG9vZChuZWlnaGJvcmhvb2QpIHtcbiAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHNcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKS50aGVuKHJlc3RhdXJhbnRzID0+IHtcbiAgICAgICAgLy8gRmlsdGVyIHJlc3RhdXJhbnRzIHRvIGhhdmUgb25seSBnaXZlbiBuZWlnaGJvcmhvb2RcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IHJlc3RhdXJhbnRzLnJlc3RhdXJhbnRzLmZpbHRlcihyID0+IHIubmVpZ2hib3Job29kID09IG5laWdoYm9yaG9vZCk7XG4gICAgICAgIHJlc29sdmUocmVzdWx0cyk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCByZXN0YXVyYW50cyBieSBhIGN1aXNpbmUgYW5kIGEgbmVpZ2hib3Job29kIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxuICAgKi9cbiAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5Q3Vpc2luZUFuZE5laWdoYm9yaG9vZChjdWlzaW5lLCBuZWlnaGJvcmhvb2QpIHtcbiAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHNcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKS50aGVuKHJlc3RhdXJhbnRzID0+IHtcbiAgICAgICAgbGV0IHJlc3VsdHMgPSByZXN0YXVyYW50cy5yZXN0YXVyYW50cztcbiAgICAgICAgaWYgKGN1aXNpbmUgIT0gJ2FsbCcpIHsgLy8gZmlsdGVyIGJ5IGN1aXNpbmVcbiAgICAgICAgICByZXN1bHRzID0gcmVzdWx0cy5maWx0ZXIociA9PiByLmN1aXNpbmVfdHlwZSA9PSBjdWlzaW5lKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmVpZ2hib3Job29kICE9ICdhbGwnKSB7IC8vIGZpbHRlciBieSBuZWlnaGJvcmhvb2RcbiAgICAgICAgICByZXN1bHRzID0gcmVzdWx0cy5maWx0ZXIociA9PiByLm5laWdoYm9yaG9vZCA9PSBuZWlnaGJvcmhvb2QpO1xuICAgICAgICB9XG4gICAgICAgIHJlc29sdmUocmVzdWx0cyk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCBhbGwgbmVpZ2hib3Job29kcyB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cbiAgICovXG4gIHN0YXRpYyBmZXRjaE5laWdoYm9yaG9vZHMoKSB7XG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKCkudGhlbihyZXN0YXVyYW50cyA9PiB7XG4gICAgICAgIC8vIEdldCBhbGwgbmVpZ2hib3Job29kcyBmcm9tIGFsbCByZXN0YXVyYW50c1xuICAgICAgICByZXN0YXVyYW50cyA9IHJlc3RhdXJhbnRzLnJlc3RhdXJhbnRzO1xuICAgICAgICBjb25zdCBuZWlnaGJvcmhvb2RzID0gcmVzdGF1cmFudHMubWFwKCh2LCBpKSA9PiByZXN0YXVyYW50c1tpXS5uZWlnaGJvcmhvb2QpO1xuICAgICAgICAvLyBSZW1vdmUgZHVwbGljYXRlcyBmcm9tIG5laWdoYm9yaG9vZHNcbiAgICAgICAgY29uc3QgdW5pcXVlTmVpZ2hib3Job29kcyA9IG5laWdoYm9yaG9vZHMuZmlsdGVyKCh2LCBpKSA9PiBuZWlnaGJvcmhvb2RzLmluZGV4T2YodikgPT0gaSk7XG4gICAgICAgIHJlc29sdmUodW5pcXVlTmVpZ2hib3Job29kcyk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCBhbGwgY3Vpc2luZXMgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXG4gICAqL1xuICBzdGF0aWMgZmV0Y2hDdWlzaW5lcygpIHtcbiAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHNcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKS50aGVuKHJlc3RhdXJhbnRzID0+IHtcbiAgICAgICAgcmVzdGF1cmFudHMgPSByZXN0YXVyYW50cy5yZXN0YXVyYW50cztcbiAgICAgICAgLy8gR2V0IGFsbCBjdWlzaW5lcyBmcm9tIGFsbCByZXN0YXVyYW50c1xuICAgICAgICBjb25zdCBjdWlzaW5lcyA9IHJlc3RhdXJhbnRzLm1hcCgodiwgaSkgPT4gcmVzdGF1cmFudHNbaV0uY3Vpc2luZV90eXBlKTtcbiAgICAgICAgLy8gUmVtb3ZlIGR1cGxpY2F0ZXMgZnJvbSBjdWlzaW5lc1xuICAgICAgICBjb25zdCB1bmlxdWVDdWlzaW5lcyA9IGN1aXNpbmVzLmZpbHRlcigodiwgaSkgPT4gY3Vpc2luZXMuaW5kZXhPZih2KSA9PSBpKTtcbiAgICAgICAgcmVzb2x2ZSh1bmlxdWVDdWlzaW5lcyk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXN0YXVyYW50IHBhZ2UgVVJMLlxuICAgKi9cbiAgc3RhdGljIHVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCkge1xuICAgIHJldHVybiAoYC4vcmVzdGF1cmFudC8/aWQ9JHtyZXN0YXVyYW50LmlkfWApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc3RhdXJhbnQgaW1hZ2UgVVJMLlxuICAgKi9cbiAgc3RhdGljIGltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KSB7XG4gICAgcmV0dXJuIChgL2ltZy8ke3Jlc3RhdXJhbnQucGhvdG9ncmFwaH1gKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNYXAgbWFya2VyIGZvciBhIHJlc3RhdXJhbnQuXG4gICAqL1xuICBzdGF0aWMgbWFwTWFya2VyRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KSB7XG4gICAgLy8gaHR0cHM6Ly9sZWFmbGV0anMuY29tL3JlZmVyZW5jZS0xLjMuMC5odG1sI21hcmtlclxuICAgIGNvbnN0IG1hcmtlciA9IG5ldyBMLm1hcmtlcihbcmVzdGF1cmFudC5sYXRsbmcubGF0LCByZXN0YXVyYW50LmxhdGxuZy5sbmddLFxuICAgICAge3RpdGxlOiByZXN0YXVyYW50Lm5hbWUsXG4gICAgICBhbHQ6IHJlc3RhdXJhbnQubmFtZSxcbiAgICAgIHVybDogREJIZWxwZXIudXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KVxuICAgICAgfVxuICAgICk7XG4gICAgICBtYXJrZXIuYWRkVG8obWFwTW9kZWwubmV3TWFwKTtcbiAgICByZXR1cm4gbWFya2VyO1xuICB9XG4gIC8qIHN0YXRpYyBtYXBNYXJrZXJGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQsIG1hcCkge1xuICAgIGNvbnN0IG1hcmtlciA9IG5ldyBnb29nbGUubWFwcy5NYXJrZXIoe1xuICAgICAgcG9zaXRpb246IHJlc3RhdXJhbnQubGF0bG5nLFxuICAgICAgdGl0bGU6IHJlc3RhdXJhbnQubmFtZSxcbiAgICAgIHVybDogREJIZWxwZXIudXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KSxcbiAgICAgIG1hcDogbWFwLFxuICAgICAgYW5pbWF0aW9uOiBnb29nbGUubWFwcy5BbmltYXRpb24uRFJPUH1cbiAgICApO1xuICAgIHJldHVybiBtYXJrZXI7XG4gIH0gKi9cblxufVxuIiwiLypcclxuICogRGV0YWlscyBwYWdlIGNvbnRyb2xsZXJcclxuICovXHJcblxyXG5jb25zdCBkZXRhaWxzQ29udHJvbGxlciA9IHtcclxuICBpbml0KCkge1xyXG4gICAgcmVzdGF1cmFudE1vZGVsLmluaXQoKS50aGVuKHJlc3RhdXJhbnQgPT4ge1xyXG4gICAgICBicmVhZGNydW1iVmlldy5yZW5kZXIocmVzdGF1cmFudCk7XHJcbiAgICAgIHJlc3RhdXJhbnRWaWV3LnJlbmRlcihyZXN0YXVyYW50KTtcclxuICAgICAgbWFwTW9kZWwuaW5pdChbcmVzdGF1cmFudC5sYXRsbmcubGF0LCByZXN0YXVyYW50LmxhdGxuZy5sbmddLCAxNik7XHJcbiAgICAgIG1hcE1vZGVsLmFkZE1hcmtlcihyZXN0YXVyYW50KTtcclxuICAgICAgd2luZG93LnNjcm9sbFRvKDAsIDApO1xyXG4gICAgfSk7XHJcbiAgfVxyXG59OyIsIi8qXHJcbiAqIEZpbHRlciBTZWxlY3Rpb25cclxuICovXHJcblxyXG5jb25zdCBmaWx0ZXJNb2RlbCA9IHtcclxuICAvLyBTdG9yZXMgdXNlciBzZWxlY3Rpb24uIEluaXRpYWxpemVzIHdpdGggZGVmYXVsdCBkYXRhLlxyXG4gIHNlbGVjdGlvbjoge1xyXG4gICAgY3Vpc2luZTogJ2FsbCcsXHJcbiAgICBuZWlnaGJvcmhvb2Q6ICdhbGwnXHJcbiAgfSxcclxuXHJcbiAgaW5pdCgpIHtcclxuICAgIC8vIFJldHVybiBhIHByb21pc2Ugd2hlbiBhbGwgZGF0YSBpcyBmZXRjaGVkIHN1Y2Vzc2Z1bGx5XHJcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoW1xyXG4gICAgICB0aGlzLmZldGNoTmVpZ2hib3Job29kcygpLFxyXG4gICAgICB0aGlzLmZldGNoQ3Vpc2luZXMoKVxyXG4gICAgXSk7XHJcbiAgfSxcclxuXHJcbiAgZmV0Y2hOZWlnaGJvcmhvb2RzKCkge1xyXG4gICAgLy8gR2V0IGRhdGEgZnJvbSB0aGUgREJcclxuICAgIHJldHVybiBEQkhlbHBlci5mZXRjaE5laWdoYm9yaG9vZHMoKS50aGVuKG5laWdoYm9yaG9vZHMgPT4ge1xyXG4gICAgICB0aGlzLm5laWdoYm9yaG9vZHMgPSBuZWlnaGJvcmhvb2RzO1xyXG4gICAgfSk7XHJcbiAgfSxcclxuXHJcbiAgZmV0Y2hDdWlzaW5lcygpIHtcclxuICAgIC8vIEdldCBkYXRhIGZyb20gdGhlIERCXHJcbiAgICByZXR1cm4gREJIZWxwZXIuZmV0Y2hDdWlzaW5lcygpLnRoZW4oY3Vpc2luZXMgPT4ge1xyXG4gICAgICB0aGlzLmN1aXNpbmVzID0gY3Vpc2luZXM7XHJcbiAgICB9KTtcclxuICB9LFxyXG5cclxuICAvLyBHZXR0ZXIgbWV0aG9kIGZldGNoZWQgZGF0YS5cclxuICBnZXREYXRhKCkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgbmVpZ2hib3Job29kczogdGhpcy5uZWlnaGJvcmhvb2RzLFxyXG4gICAgICBjdWlzaW5lczogdGhpcy5jdWlzaW5lc1xyXG4gICAgfTtcclxuICB9LFxyXG5cclxuICB1cGRhdGVTZWxlY3Rpb24oc2VsZWN0aW9uKSB7XHJcbiAgICB0aGlzLnNlbGVjdGlvbiA9IHNlbGVjdGlvbjtcclxuICB9LFxyXG5cclxuICBnZXRTZWxlY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5zZWxlY3Rpb247XHJcbiAgfVxyXG59O1xyXG5cclxuY29uc3QgZmlsdGVyVmlldyA9IHtcclxuICBpbml0KCkge1xyXG4gICAgLy8gQmluZCBlbGVtZW50c1xyXG4gICAgdGhpcy5uZWlnaGJvcmhvb2RzRWwgPWRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduZWlnaGJvcmhvb2RzLXNlbGVjdCcpO1xyXG4gICAgdGhpcy5jdWlzaW5lc0VsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2N1aXNpbmVzLXNlbGVjdCcpO1xyXG4gICAgLy8gUmVuZGVyIHdpdGggdGhlIGRhdGEgZnJvbSB0aGUgY29udHJvbGxlclxyXG4gICAgdGhpcy5yZW5kZXIoY29udHJvbGxlci5nZXRGaWx0ZXJEYXRhKCkpO1xyXG5cclxuICAgIC8vIExpc3RlbiBmb3IgY2hhbmdlcyBpbiBmaWx0ZXIgc2VsZWN0aW9uXHJcbiAgICBbdGhpcy5uZWlnaGJvcmhvb2RzRWwsIHRoaXMuY3Vpc2luZXNFbF0uZm9yRWFjaCgoZWwpID0+IHtcclxuICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgY29udHJvbGxlci51cGRhdGVSZXN0YXVyYW50cyk7XHJcbiAgICB9KTtcclxuICB9LFxyXG5cclxuICByZW5kZXIoZGF0YSkge1xyXG4gICAgLy8gUmVuZGVyIG5laWdoYm9yaG9vZHNcclxuICAgIGRhdGEubmVpZ2hib3Job29kcy5mb3JFYWNoKG5laWdoYm9yaG9vZCA9PiB7XHJcbiAgICAgIGNvbnN0IG9wdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpO1xyXG4gICAgICBvcHRpb24uaW5uZXJIVE1MID0gbmVpZ2hib3Job29kO1xyXG4gICAgICBvcHRpb24udmFsdWUgPSBuZWlnaGJvcmhvb2Q7XHJcbiAgICAgIHRoaXMubmVpZ2hib3Job29kc0VsLmFwcGVuZChvcHRpb24pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gUmVuZGVyIGN1aXNpbmVzXHJcbiAgICBkYXRhLmN1aXNpbmVzLmZvckVhY2goY3Vpc2luZSA9PiB7XHJcbiAgICAgIGNvbnN0IG9wdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpO1xyXG4gICAgICBvcHRpb24uaW5uZXJIVE1MID0gY3Vpc2luZTtcclxuICAgICAgb3B0aW9uLnZhbHVlID0gY3Vpc2luZTtcclxuICAgICAgdGhpcy5jdWlzaW5lc0VsLmFwcGVuZChvcHRpb24pO1xyXG4gICAgfSk7XHJcbiAgfSxcclxuXHJcbiAgLy8gUmV0cmlldmUgYW5kIHJldHVybiB1c2VyIHNlbGVjdGlvblxyXG4gIGdldFNlbGVjdGlvbigpIHtcclxuICAgIGNvbnN0IGNJbmRleCA9IHRoaXMuY3Vpc2luZXNFbC5zZWxlY3RlZEluZGV4O1xyXG4gICAgY29uc3QgbkluZGV4ID0gdGhpcy5uZWlnaGJvcmhvb2RzRWwuc2VsZWN0ZWRJbmRleDtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBjdWlzaW5lOiB0aGlzLmN1aXNpbmVzRWxbY0luZGV4XS52YWx1ZSxcclxuICAgICAgbmVpZ2hib3Job29kOiB0aGlzLm5laWdoYm9yaG9vZHNFbFtuSW5kZXhdLnZhbHVlXHJcbiAgICB9O1xyXG4gIH1cclxufTtcclxuIiwiLypcclxuICogSW5kZXggcGFnZSBjb250cm9sbGVyXHJcbiAqL1xyXG5cclxuY29uc3QgY29udHJvbGxlciA9IHtcclxuICAvLyBTZXQgZXZlcnl0aGluZyB1cCBhbmQgcmVuZGVyLlxyXG4gIGluaXQoKSB7XHJcbiAgICBmaWx0ZXJNb2RlbC5pbml0KCkudGhlbigoKSA9PiBmaWx0ZXJWaWV3LmluaXQoKSk7XHJcbiAgICByZXN0YXVyYW50c01vZGVsLmluaXQoKS50aGVuKCgpID0+IHJlc3RhdXJhbnRzVmlldy5pbml0KCkpO1xyXG4gICAgbWFwTW9kZWwuaW5pdChbNDAuNzIyMjE2LCAtNzMuOTg3NTAxXSwgMTEpO1xyXG4gICAgYnJlYWRjcnVtYlZpZXcucmVzZXQoKTtcclxuICAgIHdpbmRvdy5zY3JvbGxUbygwLCAwKTtcclxuICB9LFxyXG5cclxuICAvLyBHZXR0ZXIgbWV0aG9kc1xyXG4gIGdldEZpbHRlckRhdGEoKSB7XHJcbiAgICByZXR1cm4gZmlsdGVyTW9kZWwuZ2V0RGF0YSgpO1xyXG4gIH0sXHJcblxyXG4gIGdldEZpbHRlclNlbGVjdGlvbigpIHtcclxuICAgIHJldHVybiBmaWx0ZXJNb2RlbC5nZXRTZWxlY3Rpb24oKTtcclxuICB9LFxyXG5cclxuICBnZXRSZXN0YXVyYW50cygpIHtcclxuICAgIHJldHVybiByZXN0YXVyYW50c01vZGVsLmdldFJlc3RhdXJhbnRzKCk7XHJcbiAgfSxcclxuXHJcbiAgLy8gVGhpcyBpcyBjYWxsZWQgb24gdXNlciBzZWxlY3Rpb24gY2hhbmdlXHJcbiAgdXBkYXRlUmVzdGF1cmFudHMoKSB7XHJcbiAgICBmaWx0ZXJNb2RlbC51cGRhdGVTZWxlY3Rpb24oZmlsdGVyVmlldy5nZXRTZWxlY3Rpb24oKSk7XHJcbiAgICBjb250cm9sbGVyLnJlc2V0UmVzdGF1cmFudHMoKTtcclxuICB9LFxyXG5cclxuICByZXNldFJlc3RhdXJhbnRzKCkge1xyXG4gICAgcmVzdGF1cmFudHNNb2RlbC5pbml0KCkudGhlbigoKSA9PiByZXN0YXVyYW50c1ZpZXcucmVuZGVyKFxyXG4gICAgICBjb250cm9sbGVyLmdldFJlc3RhdXJhbnRzKCkpXHJcbiAgICApO1xyXG4gIH0sXHJcblxyXG4gIC8vIFRyaWdnZXJzIG1hcCByZXNldHMuXHJcbiAgc2V0TWFya2VycyhyZXN0YXVyYW50cykge1xyXG4gICAgbWFwTW9kZWwuYWRkTWFya2VycyhyZXN0YXVyYW50cyk7XHJcbiAgfVxyXG59OyIsIi8qXHJcbiAqIDxtYWluPiBjb250cm9sbGVyXHJcbiAqL1xyXG5cclxuY29uc3QgbWFpbkNvbnRyb2xsZXIgPSB7XHJcbiAgc2V0U3RhdGUoc3RhdGUpIHtcclxuICAgIHRoaXMuc3RhdGUgPSBzdGF0ZTtcclxuICAgIG1haW5WaWV3LnJlbmRlcihzdGF0ZSk7XHJcbiAgfSxcclxuXHJcbiAgZ2V0U3RhdGUoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5zdGF0ZTtcclxuICB9XHJcbn07XHJcblxyXG4vKlxyXG4gKiA8bWFpbj4gdmlld1xyXG4gKi9cclxuXHJcbmNvbnN0IG1haW5WaWV3ID0ge1xyXG4gIC8vIDxtYWluPiBlbGVtZW50IHRvIGhvb2sgaW50b1xyXG4gIGVsOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdtYWluJyksXHJcbiAgLy8gQWxsIHRlbXBsYXRlc1xyXG4gIHRlbXBsYXRlczogZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnRlbXBsYXRlJyksXHJcblxyXG4gIC8vIE1hcHMgc3RhdGVzIHRvIHRlbXBsYXRlc1xyXG4gIC8vIFJldHVybnMgYSB0ZXh0L3RlbXBsYXRlIGVsZW1lbnRcclxuICBnZXRUZW1wbGF0ZShzdGF0ZSkge1xyXG4gICAgbGV0IHRlbXBsYXRlO1xyXG4gICAgdGhpcy50ZW1wbGF0ZXMuZm9yRWFjaChuID0+IHtcclxuICAgICAgaWYgKG4uaWQgPT09IHN0YXRlKSB0ZW1wbGF0ZSA9IG47XHJcbiAgICB9KTtcclxuICAgIHJldHVybiB0ZW1wbGF0ZTtcclxuICB9LFxyXG5cclxuICByZW5kZXIoc3RhdGUpIHtcclxuICAgIC8vIEFkZCAnaW5zaWRlJyBjbGFzcyB0byBib2R5IGlmIHdlIGFyZSBvbiBkZXRhaWxzIHBhZ2VcclxuICAgIGlmICgnZGV0YWlscycgPT09IHN0YXRlKSB7XHJcbiAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZCgnaW5zaWRlJyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoJ2luc2lkZScpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEluc2VydCB0ZW1wbGF0ZSBpbnRvIHBhZ2VcclxuICAgIHRoaXMuZWwuaW5uZXJIVE1MID0gdGhpcy5nZXRUZW1wbGF0ZShzdGF0ZSkuaW5uZXJIVE1MO1xyXG5cclxuICAgIC8vIFByb2NlZWQgd2l0aCBzdWJ2aWV3c1xyXG4gICAgc3dpdGNoIChzdGF0ZSkge1xyXG4gICAgY2FzZSAnaW5kZXgnOlxyXG4gICAgICBjb250cm9sbGVyLmluaXQoKTtcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlICdkZXRhaWxzJzpcclxuICAgICAgZGV0YWlsc0NvbnRyb2xsZXIuaW5pdCgpO1xyXG4gICAgICBicmVhaztcclxuICAgIH1cclxuICB9XHJcbn07XHJcblxyXG5cclxuY29uc3QgYnJlYWRjcnVtYlZpZXcgPSB7XHJcbiAgZWw6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdicmVhZGNydW1iJyksXHJcblxyXG4gIHJlbmRlcihyZXN0YXVyYW50KSB7XHJcbiAgICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XHJcbiAgICBsaS5pbm5lckhUTUwgPSByZXN0YXVyYW50Lm5hbWU7XHJcbiAgICB0aGlzLmVsLmFwcGVuZENoaWxkKGxpKTtcclxuICB9LFxyXG5cclxuICByZXNldCgpIHtcclxuICAgIHRoaXMuZWwuaW5uZXJIVE1MID0gJzxsaT48YSBocmVmPVwiL1wiPkhvbWU8L2E+PC9saT4nO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXQgYSBwYXJhbWV0ZXIgYnkgbmFtZSBmcm9tIHBhZ2UgVVJMLlxyXG4gKi9cclxuY29uc3QgZ2V0UGFyYW1ldGVyQnlOYW1lID0gKG5hbWUsIHVybCkgPT4ge1xyXG4gIGlmICghdXJsKVxyXG4gICAgdXJsID0gd2luZG93LmxvY2F0aW9uLmhyZWY7XHJcbiAgdXJsID0gbmV3IFVSTCh1cmwpO1xyXG4gIHJldHVybiBuZXcgVVJMU2VhcmNoUGFyYW1zKHVybC5zZWFyY2gpLmdldCgnaWQnKTtcclxufTsiLCIvKlxyXG4gKiBNYXBcclxuICovXHJcblxyXG5jb25zdCBtYXBNb2RlbCA9IHtcclxuICBtYXJrZXJzOiBbXSxcclxuXHJcbiAgLy8gTWFwYm94IGluaXRcclxuICBpbml0KGNlbnRlciwgem9vbSkge1xyXG4gICAgdGhpcy5uZXdNYXAgPSBMLm1hcCgnbWFwJywge1xyXG4gICAgICBjZW50ZXI6IGNlbnRlcixcclxuICAgICAgem9vbTogem9vbSxcclxuICAgICAgc2Nyb2xsV2hlZWxab29tOiBmYWxzZVxyXG4gICAgfSk7XHJcbiAgICBMLnRpbGVMYXllcignaHR0cHM6Ly9hcGkudGlsZXMubWFwYm94LmNvbS92NC97aWR9L3t6fS97eH0ve3l9LmpwZzcwP2FjY2Vzc190b2tlbj17bWFwYm94VG9rZW59Jywge1xyXG4gICAgICBtYXBib3hUb2tlbjogJ3BrLmV5SjFJam9pZW5sdFpYUm9JaXdpWVNJNkltTnFhbkIxY3pBeU56SnJZblV6Y1cwd2FUTjVhV0ZrYTJvaWZRLm5RN3FPb0xKcG5BdlhubVJJNzBfZFEnLFxyXG4gICAgICBtYXhab29tOiAxOCxcclxuICAgICAgYXR0cmlidXRpb246ICdNYXAgZGF0YSAmY29weTsgPGEgaHJlZj1cImh0dHBzOi8vd3d3Lm9wZW5zdHJlZXRtYXAub3JnL1wiPk9wZW5TdHJlZXRNYXA8L2E+IGNvbnRyaWJ1dG9ycywgJyArXHJcbiAgICAgICAgJzxhIGhyZWY9XCJodHRwczovL2NyZWF0aXZlY29tbW9ucy5vcmcvbGljZW5zZXMvYnktc2EvMi4wL1wiPkNDLUJZLVNBPC9hPiwgJyArXHJcbiAgICAgICAgJ0ltYWdlcnkgwqkgPGEgaHJlZj1cImh0dHBzOi8vd3d3Lm1hcGJveC5jb20vXCI+TWFwYm94PC9hPicsXHJcbiAgICAgIGlkOiAnbWFwYm94LnN0cmVldHMnXHJcbiAgICB9KS5hZGRUbyh0aGlzLm5ld01hcCk7XHJcbiAgfSxcclxuXHJcbiAgLy8gUmVzZXRzIG1hcCBtYXJrZXJzXHJcbiAgYWRkTWFya2VycyhyZXN0YXVyYW50cykge1xyXG4gICAgdGhpcy5yZXNldE1hcmtlcnMoKTtcclxuXHJcbiAgICByZXN0YXVyYW50cy5mb3JFYWNoKHJlc3RhdXJhbnQgPT4ge1xyXG4gICAgICAvLyBBZGQgbWFya2VyIHRvIHRoZSBtYXBcclxuICAgICAgY29uc3QgbWFya2VyID0gREJIZWxwZXIubWFwTWFya2VyRm9yUmVzdGF1cmFudChyZXN0YXVyYW50LCB0aGlzLm5ld01hcCk7XHJcbiAgICAgIG1hcmtlci5vbignY2xpY2snLCBvbkNsaWNrKTtcclxuICAgICAgZnVuY3Rpb24gb25DbGljaygpIHtcclxuICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IG1hcmtlci5vcHRpb25zLnVybDtcclxuICAgICAgfVxyXG4gICAgICB0aGlzLm1hcmtlcnMucHVzaChtYXJrZXIpO1xyXG4gICAgfSk7XHJcbiAgfSxcclxuXHJcbiAgLy8gQWRkIHNpbmdsZSBtYXJrZXJcclxuICBhZGRNYXJrZXIocmVzdGF1cmFudCkge1xyXG4gICAgREJIZWxwZXIubWFwTWFya2VyRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KTtcclxuICB9LFxyXG5cclxuICByZXNldE1hcmtlcnMoKSB7XHJcbiAgICBpZiAodGhpcy5tYXJrZXJzKSB7XHJcbiAgICAgIHRoaXMubWFya2Vycy5mb3JFYWNoKG1hcmtlciA9PiBtYXJrZXIucmVtb3ZlKCkpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5tYXJrZXJzID0gW107XHJcbiAgfVxyXG59OyIsImNvbnN0IHJlc3RhdXJhbnRNb2RlbCA9IHtcclxuICBpbml0KCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZmV0Y2hGcm9tVVJMKCk7XHJcbiAgfSxcclxuXHJcbiAgZmV0Y2hGcm9tVVJMKCkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgY29uc3QgaWQgPSBnZXRQYXJhbWV0ZXJCeU5hbWUoJ2lkJyk7XHJcbiAgICAgIGlmICh0aGlzLnJlc3RhdXJhbnQgJiYgdGhpcy5yZXN0YXVyYW50LmlkID09PSBpZCkgeyAvLyByZXN0YXVyYW50IGFscmVhZHkgZmV0Y2hlZCFcclxuICAgICAgICByZXNvbHZlKHRoaXMucmVzdGF1cmFudCk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCFpZCkgeyAvLyBubyBpZCBmb3VuZCBpbiBVUkxcclxuICAgICAgICByZWplY3QoJ05vIHJlc3RhdXJhbnQgaWQgaW4gVVJMJyk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50QnlJZChpZCkudGhlbihyZXN0YXVyYW50ID0+IHtcclxuICAgICAgICAgIHRoaXMucmVzdGF1cmFudCA9IHJlc3RhdXJhbnQ7XHJcbiAgICAgICAgICBpZiAoIXJlc3RhdXJhbnQpIHtcclxuICAgICAgICAgICAgcmVqZWN0KGBObyByZXN0YXVyYW50IHdpdGggaWQgJHtpZH0gZm91bmQuYCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAvLyBmaWxsUmVzdGF1cmFudEhUTUwoKTtcclxuICAgICAgICAgIHJlc29sdmUocmVzdGF1cmFudCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbmNvbnN0IHJlc3RhdXJhbnRWaWV3ID0ge1xyXG4gIHJlbmRlcihyZXN0YXVyYW50KSB7XHJcbiAgICBjb25zdCBuYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtbmFtZScpO1xyXG4gICAgbmFtZS5pbm5lckhUTUwgPSByZXN0YXVyYW50Lm5hbWU7XHJcblxyXG4gICAgY29uc3QgYWRkcmVzcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LWFkZHJlc3MnKTtcclxuICAgIGFkZHJlc3MuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5hZGRyZXNzO1xyXG5cclxuICAgIGNvbnN0IGltYWdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtaW1nJyk7XHJcbiAgICBpbWFnZS5jbGFzc05hbWUgPSAncmVzdGF1cmFudC1pbWcnO1xyXG4gICAgaW1hZ2Uuc3JjID0gREJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpO1xyXG4gICAgaW1hZ2UuYWx0ID0gcmVzdGF1cmFudC5uYW1lO1xyXG5cclxuICAgIGNvbnN0IGN1aXNpbmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1jdWlzaW5lJyk7XHJcbiAgICBjdWlzaW5lLmlubmVySFRNTCA9IHJlc3RhdXJhbnQuY3Vpc2luZV90eXBlO1xyXG5cclxuICAgIC8vIGZpbGwgb3BlcmF0aW5nIGhvdXJzXHJcbiAgICBpZiAocmVzdGF1cmFudC5vcGVyYXRpbmdfaG91cnMpIHtcclxuICAgICAgdGhpcy5yZW5kZXJIb3VycyhyZXN0YXVyYW50Lm9wZXJhdGluZ19ob3Vycyk7XHJcbiAgICB9XHJcbiAgICAvLyBmaWxsIHJldmlld3NcclxuICAgIHRoaXMucmVuZGVyUmV2aWV3cyhyZXN0YXVyYW50LnJldmlld3MpO1xyXG4gIH0sXHJcblxyXG4gIHJlbmRlckhvdXJzKG9wZXJhdGluZ0hvdXJzKSB7XHJcbiAgICBjb25zdCBob3VycyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LWhvdXJzJyk7XHJcbiAgICBmb3IgKGxldCBrZXkgaW4gb3BlcmF0aW5nSG91cnMpIHtcclxuICAgICAgY29uc3Qgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndHInKTtcclxuXHJcbiAgICAgIGNvbnN0IGRheSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XHJcbiAgICAgIGRheS5pbm5lckhUTUwgPSBrZXk7XHJcbiAgICAgIHJvdy5hcHBlbmRDaGlsZChkYXkpO1xyXG5cclxuICAgICAgY29uc3QgdGltZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XHJcbiAgICAgIHRpbWUuaW5uZXJIVE1MID0gb3BlcmF0aW5nSG91cnNba2V5XTtcclxuICAgICAgcm93LmFwcGVuZENoaWxkKHRpbWUpO1xyXG5cclxuICAgICAgaG91cnMuYXBwZW5kQ2hpbGQocm93KTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICByZW5kZXJSZXZpZXdzKHJldmlld3MpIHtcclxuICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXZpZXdzLWNvbnRhaW5lcicpO1xyXG4gICAgY29uc3QgdGl0bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdoMicpO1xyXG4gICAgdGl0bGUuaW5uZXJIVE1MID0gJ1Jldmlld3MnO1xyXG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHRpdGxlKTtcclxuXHJcbiAgICBpZiAoIXJldmlld3MpIHtcclxuICAgICAgY29uc3Qgbm9SZXZpZXdzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xyXG4gICAgICBub1Jldmlld3MuaW5uZXJIVE1MID0gJ05vIHJldmlld3MgeWV0ISc7XHJcbiAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChub1Jldmlld3MpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBjb25zdCB1bCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXZpZXdzLWxpc3QnKTtcclxuICAgIHJldmlld3MuZm9yRWFjaChyZXZpZXcgPT4ge1xyXG4gICAgICB1bC5hcHBlbmRDaGlsZCh0aGlzLmNyZWF0ZVJldmlld0hUTUwocmV2aWV3KSk7XHJcbiAgICB9KTtcclxuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh1bCk7XHJcbiAgfSxcclxuXHJcbiAgY3JlYXRlUmV2aWV3SFRNTChyZXZpZXcpIHtcclxuICAgIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcclxuICAgIGNvbnN0IG5hbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XHJcbiAgICBuYW1lLmlubmVySFRNTCA9IHJldmlldy5uYW1lO1xyXG4gICAgbGkuYXBwZW5kQ2hpbGQobmFtZSk7XHJcblxyXG4gICAgY29uc3QgZGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcclxuICAgIGRhdGUuaW5uZXJIVE1MID0gcmV2aWV3LmRhdGU7XHJcbiAgICBsaS5hcHBlbmRDaGlsZChkYXRlKTtcclxuXHJcbiAgICBjb25zdCByYXRpbmcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XHJcbiAgICByYXRpbmcuaW5uZXJIVE1MID0gYFJhdGluZzogJHtyZXZpZXcucmF0aW5nfWA7XHJcbiAgICBsaS5hcHBlbmRDaGlsZChyYXRpbmcpO1xyXG5cclxuICAgIGNvbnN0IGNvbW1lbnRzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xyXG4gICAgY29tbWVudHMuaW5uZXJIVE1MID0gcmV2aWV3LmNvbW1lbnRzO1xyXG4gICAgbGkuYXBwZW5kQ2hpbGQoY29tbWVudHMpO1xyXG5cclxuICAgIHJldHVybiBsaTtcclxuICB9XHJcblxyXG59O1xyXG4iLCIvKlxyXG4gKiBSZXN0YXVyYW50cyBsaXN0XHJcbiAqL1xyXG5cclxuY29uc3QgcmVzdGF1cmFudHNNb2RlbCA9IHtcclxuICBpbml0KCkge1xyXG4gICAgY29uc3Qgc2VsID0gY29udHJvbGxlci5nZXRGaWx0ZXJTZWxlY3Rpb24oKTtcclxuICAgIHJldHVybiB0aGlzLmZldGNoUmVzdGF1cmFudHMoc2VsLmN1aXNpbmUsIHNlbC5uZWlnaGJvcmhvb2QpO1xyXG4gIH0sXHJcblxyXG4gIC8vIEdldCBkYXRhIGZyb20gdGhlIERCXHJcbiAgZmV0Y2hSZXN0YXVyYW50cyhjdWlzaW5lLCBuZWlnaGJvcmhvb2QpIHtcclxuICAgIHJldHVybiBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRCeUN1aXNpbmVBbmROZWlnaGJvcmhvb2QoY3Vpc2luZSwgbmVpZ2hib3Job29kKS50aGVuKHJlc3RhdXJhbnRzID0+IHtcclxuICAgICAgdGhpcy5yZXN0YXVyYW50cyA9IHJlc3RhdXJhbnRzO1xyXG4gICAgfSk7XHJcbiAgfSxcclxuXHJcbiAgLy8gR2V0dGVyIG1ldGhvZCBmb3JtIHRoaXMucmVzdGF1cmFudHNcclxuICBnZXRSZXN0YXVyYW50cygpIHtcclxuICAgIHJldHVybiB0aGlzLnJlc3RhdXJhbnRzO1xyXG4gIH1cclxufTtcclxuXHJcbmNvbnN0IHJlc3RhdXJhbnRzVmlldyA9IHtcclxuICBpbml0KCkge1xyXG4gICAgLy8gQmluZCBlbGVtZW50XHJcbiAgICB0aGlzLmVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnRzLWxpc3QnKTtcclxuXHJcbiAgICB0aGlzLnJlbmRlcihjb250cm9sbGVyLmdldFJlc3RhdXJhbnRzKCkpO1xyXG4gIH0sXHJcblxyXG4gIHJlbmRlcihyZXN0YXVyYW50cykge1xyXG4gICAgdGhpcy5lbC5pbm5lckhUTUwgPSAnJztcclxuXHJcbiAgICAvLyBNYXAgc2V0dXBcclxuICAgIGNvbnRyb2xsZXIuc2V0TWFya2VycyhyZXN0YXVyYW50cyk7XHJcblxyXG4gICAgcmVzdGF1cmFudHMuZm9yRWFjaChyZXN0YXVyYW50ID0+IHtcclxuICAgICAgdGhpcy5lbC5hcHBlbmQodGhpcy5jcmVhdGVIVE1MKHJlc3RhdXJhbnQpKTtcclxuICAgIH0pO1xyXG4gIH0sXHJcblxyXG4gIGNyZWF0ZUhUTUwocmVzdGF1cmFudCkge1xyXG4gICAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xyXG5cclxuICAgIGNvbnN0IGltYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XHJcbiAgICBpbWFnZS5jbGFzc05hbWUgPSAncmVzdGF1cmFudC1pbWcnO1xyXG4gICAgaW1hZ2Uuc3JjID0gREJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpO1xyXG4gICAgaW1hZ2UuYWx0ID0gcmVzdGF1cmFudC5uYW1lO1xyXG4gICAgbGkuYXBwZW5kKGltYWdlKTtcclxuXHJcbiAgICAvLyBUaXRsZSBpcyBhIGxpbmsgdG8gZGV0YWlscyBwYWdlXHJcbiAgICAvLyBSZW1vdmVkICdWaWV3IGRldGFpbHMnIGZvciBhY2Nlc3NpYmlsaXR5IHJlYXNvbnNcclxuICAgIGNvbnN0IG1vcmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XHJcbiAgICBtb3JlLmhyZWYgPSBEQkhlbHBlci51cmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpO1xyXG4gICAgbW9yZS5pbm5lckhUTUwgPSByZXN0YXVyYW50Lm5hbWU7XHJcblxyXG4gICAgY29uc3QgbmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2gzJyk7XHJcbiAgICBuYW1lLmFwcGVuZChtb3JlKTtcclxuICAgIGxpLmFwcGVuZChuYW1lKTtcclxuXHJcbiAgICBjb25zdCBuZWlnaGJvcmhvb2QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XHJcbiAgICBuZWlnaGJvcmhvb2QuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5uZWlnaGJvcmhvb2Q7XHJcbiAgICBsaS5hcHBlbmQobmVpZ2hib3Job29kKTtcclxuXHJcbiAgICBjb25zdCBhZGRyZXNzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xyXG4gICAgYWRkcmVzcy5pbm5lckhUTUwgPSByZXN0YXVyYW50LmFkZHJlc3M7XHJcbiAgICBsaS5hcHBlbmQoYWRkcmVzcyk7XHJcblxyXG4gICAgcmV0dXJuIGxpO1xyXG4gIH0sXHJcbn07XHJcbiIsIi8qXHJcbiAqIE1haW4gcm91dGVyIG9iamVjdFxyXG4gKi9cclxuY29uc3Qgcm91dGVyID0ge1xyXG4gIC8vIG1hcHMgcm91dGVzIHRvIHN0YXRlc1xyXG4gIHJvdXRlczoge1xyXG4gICAgJy8nOiAnaW5kZXgnLFxyXG4gICAgJy9yZXN0YXVyYW50Lyc6ICdkZXRhaWxzJ1xyXG4gIH0sXHJcblxyXG4gIGluaXQoKSB7XHJcbiAgICAvLyBMb2FkIHRoZSBwYWdlXHJcbiAgICB0aGlzLm5hdmlnYXRlKGxvY2F0aW9uLmhyZWYpO1xyXG5cclxuICAgIC8vIExpc3RlbiBmb3IgY2xpY2tzIG9uIGxpbmtzLiBFeGNsdWRlIGJvb2ttYXJrIGxpbmtzXHJcbiAgICBkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcclxuICAgICAgaWYgKGUudGFyZ2V0Lm5vZGVOYW1lID09PSAnQScgJiZcclxuICAgICAgICAgIGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnaHJlZicpLmNoYXJBdCgwKSAhPT0gJyMnKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIHRoaXMubmF2aWdhdGUoZS50YXJnZXQuaHJlZik7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgLy8gTWFuYWdlIGJhY2sgYW5kIGZvcndhcmQgYnV0dG9uc1xyXG4gICAgd2luZG93Lm9ucG9wc3RhdGUgPSAoKSA9PiB7XHJcbiAgICAgIHRoaXMubmF2aWdhdGUobG9jYXRpb24uaHJlZik7XHJcbiAgICB9O1xyXG4gICAgLy8gUmVnaXN0ZXIgU2VydmljZSBXb3JrZXJcclxuICAgIGlmICghbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIpIHJldHVybjtcclxuICAgIG5hdmlnYXRvci5zZXJ2aWNlV29ya2VyLnJlZ2lzdGVyKCcvc3cuanMnKTtcclxuICB9LFxyXG5cclxuXHJcblxyXG4gIC8vIEBwYXJhbSB1cmwgc3RyaW5nXHJcbiAgbmF2aWdhdGUodXJsKSB7XHJcbiAgICBpZiAobmV3IFVSTCh1cmwpLm9yaWdpbiA9PT0gbG9jYXRpb24ub3JpZ2luKSB7XHJcbiAgICAgIGlmICh1cmwgIT09IGxvY2F0aW9uLmhyZWYpIHtcclxuICAgICAgICBoaXN0b3J5LnB1c2hTdGF0ZShudWxsLCBudWxsLCB1cmwpO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMuY2hhbmdlU3RhdGUodXJsKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBjaGFuZ2VTdGF0ZSh1cmwpIHtcclxuICAgIG1haW5Db250cm9sbGVyLnNldFN0YXRlKFxyXG4gICAgICB0aGlzLnJvdXRlc1tuZXcgVVJMKHVybCkucGF0aG5hbWVdXHJcbiAgICApO1xyXG4gIH1cclxufTtcclxuXHJcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoKSA9PiByb3V0ZXIuaW5pdCgpKTsiXX0=
