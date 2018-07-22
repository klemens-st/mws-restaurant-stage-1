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
      url: DBHelper.urlForRestaurant(restaurant),
      keyboard: false
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
      scrollWheelZoom: false,
      keyboard: false
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
    image.alt = `An image of ${restaurant.name}`;

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
    image.alt = `An image of ${restaurant.name}`;
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
    navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRiaGVscGVyLmpzIiwiZGV0YWlscy5qcyIsImZpbHRlci5qcyIsImluZGV4LmpzIiwibWFpbi5qcyIsIm1hcC5qcyIsInJlc3RhdXJhbnQuanMiLCJyZXN0YXVyYW50cy5qcyIsInJvdXRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzlLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvbW1vbiBkYXRhYmFzZSBoZWxwZXIgZnVuY3Rpb25zLlxuICovXG5jbGFzcyBEQkhlbHBlciB7XG5cbiAgLyoqXG4gICAqIERhdGFiYXNlIFVSTC5cbiAgICogQ2hhbmdlIHRoaXMgdG8gcmVzdGF1cmFudHMuanNvbiBmaWxlIGxvY2F0aW9uIG9uIHlvdXIgc2VydmVyLlxuICAgKi9cbiAgc3RhdGljIGdldCBEQVRBQkFTRV9VUkwoKSB7XG4gICAgY29uc3QgcG9ydCA9IDgwMDA7IC8vIENoYW5nZSB0aGlzIHRvIHlvdXIgc2VydmVyIHBvcnRcbiAgICByZXR1cm4gYGh0dHA6Ly9sb2NhbGhvc3Q6JHtwb3J0fS9kYXRhL3Jlc3RhdXJhbnRzLmpzb25gO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIGFsbCByZXN0YXVyYW50cy5cbiAgICovXG4gIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRzKCkge1xuICAgIC8vIFNpbmNlIHdlIGFsd2F5cyBmZXRjaCB0aGUgZW50aXJlIGpzb24gdGhhdCBuZXZlciBjaGFuZ2VzLFxuICAgIC8vIGxldCdzIHJlcXVlc3QgaXQgb25seSBvbmNlIGFuZCBzdG9yZSBpbiBhIHN0YXRpYyBwcm9wZXJ0eS5cbiAgICAvLyBEQkhlbHBlci5qc29uIGlzIGEgcHJvbWlzZSByZXR1cm5lZCBieSBSZXNwb25zZS5qc29uKCk7XG4gICAgaWYgKCFEQkhlbHBlci5qc29uKSB7XG4gICAgICBEQkhlbHBlci5qc29uID0gZmV0Y2goREJIZWxwZXIuREFUQUJBU0VfVVJMKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYgKDIwMCA9PT0gcmVzcG9uc2Uuc3RhdHVzKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBgUmVxdWVzdCBmYWlsZWQuIFJldHVybmVkIHN0YXR1cyBvZiAke3Jlc3BvbnNlLnN0YXR1c31gO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKG1zZyA9PiBjb25zb2xlLmVycm9yKG1zZykpO1xuICAgIH1cbiAgICByZXR1cm4gREJIZWxwZXIuanNvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCBhIHJlc3RhdXJhbnQgYnkgaXRzIElELlxuICAgKi9cbiAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5SWQoaWQpIHtcbiAgICAvLyBmZXRjaCBhbGwgcmVzdGF1cmFudHMgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKS50aGVuKHJlc3RhdXJhbnRzID0+IHtcbiAgICAgICAgY29uc3QgcmVzdGF1cmFudCA9IHJlc3RhdXJhbnRzLnJlc3RhdXJhbnRzLmZpbmQociA9PiByLmlkID09IGlkKTtcbiAgICAgICAgaWYgKHJlc3RhdXJhbnQpIHsgLy8gR290IHRoZSByZXN0YXVyYW50XG4gICAgICAgICAgcmVzb2x2ZShyZXN0YXVyYW50KTtcbiAgICAgICAgfSBlbHNlIHsgLy8gUmVzdGF1cmFudCBkb2VzIG5vdCBleGlzdCBpbiB0aGUgZGF0YWJhc2VcbiAgICAgICAgICByZWplY3QoJ1Jlc3RhdXJhbnQgZG9lcyBub3QgZXhpc3QnKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggcmVzdGF1cmFudHMgYnkgYSBjdWlzaW5lIHR5cGUgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXG4gICAqL1xuICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50QnlDdWlzaW5lKGN1aXNpbmUpIHtcbiAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHMgIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKCkudGhlbihyZXN0YXVyYW50cyA9PiB7XG4gICAgICAgIC8vIEZpbHRlciByZXN0YXVyYW50cyB0byBoYXZlIG9ubHkgZ2l2ZW4gY3Vpc2luZSB0eXBlXG4gICAgICAgIGNvbnN0IHJlc3VsdHMgPSByZXN0YXVyYW50cy5yZXN0YXVyYW50cy5maWx0ZXIociA9PiByLmN1aXNpbmVfdHlwZSA9PSBjdWlzaW5lKTtcbiAgICAgICAgcmVzb2x2ZShyZXN1bHRzKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIHJlc3RhdXJhbnRzIGJ5IGEgbmVpZ2hib3Job29kIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxuICAgKi9cbiAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5TmVpZ2hib3Job29kKG5laWdoYm9yaG9vZCkge1xuICAgIC8vIEZldGNoIGFsbCByZXN0YXVyYW50c1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygpLnRoZW4ocmVzdGF1cmFudHMgPT4ge1xuICAgICAgICAvLyBGaWx0ZXIgcmVzdGF1cmFudHMgdG8gaGF2ZSBvbmx5IGdpdmVuIG5laWdoYm9yaG9vZFxuICAgICAgICBjb25zdCByZXN1bHRzID0gcmVzdGF1cmFudHMucmVzdGF1cmFudHMuZmlsdGVyKHIgPT4gci5uZWlnaGJvcmhvb2QgPT0gbmVpZ2hib3Job29kKTtcbiAgICAgICAgcmVzb2x2ZShyZXN1bHRzKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIHJlc3RhdXJhbnRzIGJ5IGEgY3Vpc2luZSBhbmQgYSBuZWlnaGJvcmhvb2Qgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXG4gICAqL1xuICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50QnlDdWlzaW5lQW5kTmVpZ2hib3Job29kKGN1aXNpbmUsIG5laWdoYm9yaG9vZCkge1xuICAgIC8vIEZldGNoIGFsbCByZXN0YXVyYW50c1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygpLnRoZW4ocmVzdGF1cmFudHMgPT4ge1xuICAgICAgICBsZXQgcmVzdWx0cyA9IHJlc3RhdXJhbnRzLnJlc3RhdXJhbnRzO1xuICAgICAgICBpZiAoY3Vpc2luZSAhPSAnYWxsJykgeyAvLyBmaWx0ZXIgYnkgY3Vpc2luZVxuICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLmZpbHRlcihyID0+IHIuY3Vpc2luZV90eXBlID09IGN1aXNpbmUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChuZWlnaGJvcmhvb2QgIT0gJ2FsbCcpIHsgLy8gZmlsdGVyIGJ5IG5laWdoYm9yaG9vZFxuICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLmZpbHRlcihyID0+IHIubmVpZ2hib3Job29kID09IG5laWdoYm9yaG9vZCk7XG4gICAgICAgIH1cbiAgICAgICAgcmVzb2x2ZShyZXN1bHRzKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIGFsbCBuZWlnaGJvcmhvb2RzIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxuICAgKi9cbiAgc3RhdGljIGZldGNoTmVpZ2hib3Job29kcygpIHtcbiAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHNcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKS50aGVuKHJlc3RhdXJhbnRzID0+IHtcbiAgICAgICAgLy8gR2V0IGFsbCBuZWlnaGJvcmhvb2RzIGZyb20gYWxsIHJlc3RhdXJhbnRzXG4gICAgICAgIHJlc3RhdXJhbnRzID0gcmVzdGF1cmFudHMucmVzdGF1cmFudHM7XG4gICAgICAgIGNvbnN0IG5laWdoYm9yaG9vZHMgPSByZXN0YXVyYW50cy5tYXAoKHYsIGkpID0+IHJlc3RhdXJhbnRzW2ldLm5laWdoYm9yaG9vZCk7XG4gICAgICAgIC8vIFJlbW92ZSBkdXBsaWNhdGVzIGZyb20gbmVpZ2hib3Job29kc1xuICAgICAgICBjb25zdCB1bmlxdWVOZWlnaGJvcmhvb2RzID0gbmVpZ2hib3Job29kcy5maWx0ZXIoKHYsIGkpID0+IG5laWdoYm9yaG9vZHMuaW5kZXhPZih2KSA9PSBpKTtcbiAgICAgICAgcmVzb2x2ZSh1bmlxdWVOZWlnaGJvcmhvb2RzKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIGFsbCBjdWlzaW5lcyB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cbiAgICovXG4gIHN0YXRpYyBmZXRjaEN1aXNpbmVzKCkge1xuICAgIC8vIEZldGNoIGFsbCByZXN0YXVyYW50c1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygpLnRoZW4ocmVzdGF1cmFudHMgPT4ge1xuICAgICAgICByZXN0YXVyYW50cyA9IHJlc3RhdXJhbnRzLnJlc3RhdXJhbnRzO1xuICAgICAgICAvLyBHZXQgYWxsIGN1aXNpbmVzIGZyb20gYWxsIHJlc3RhdXJhbnRzXG4gICAgICAgIGNvbnN0IGN1aXNpbmVzID0gcmVzdGF1cmFudHMubWFwKCh2LCBpKSA9PiByZXN0YXVyYW50c1tpXS5jdWlzaW5lX3R5cGUpO1xuICAgICAgICAvLyBSZW1vdmUgZHVwbGljYXRlcyBmcm9tIGN1aXNpbmVzXG4gICAgICAgIGNvbnN0IHVuaXF1ZUN1aXNpbmVzID0gY3Vpc2luZXMuZmlsdGVyKCh2LCBpKSA9PiBjdWlzaW5lcy5pbmRleE9mKHYpID09IGkpO1xuICAgICAgICByZXNvbHZlKHVuaXF1ZUN1aXNpbmVzKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc3RhdXJhbnQgcGFnZSBVUkwuXG4gICAqL1xuICBzdGF0aWMgdXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KSB7XG4gICAgcmV0dXJuIChgLi9yZXN0YXVyYW50Lz9pZD0ke3Jlc3RhdXJhbnQuaWR9YCk7XG4gIH1cblxuICAvKipcbiAgICogUmVzdGF1cmFudCBpbWFnZSBVUkwuXG4gICAqL1xuICBzdGF0aWMgaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpIHtcbiAgICByZXR1cm4gKGAvaW1nLyR7cmVzdGF1cmFudC5waG90b2dyYXBofWApO1xuICB9XG5cbiAgLyoqXG4gICAqIE1hcCBtYXJrZXIgZm9yIGEgcmVzdGF1cmFudC5cbiAgICovXG4gIHN0YXRpYyBtYXBNYXJrZXJGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpIHtcbiAgICAvLyBodHRwczovL2xlYWZsZXRqcy5jb20vcmVmZXJlbmNlLTEuMy4wLmh0bWwjbWFya2VyXG4gICAgY29uc3QgbWFya2VyID0gbmV3IEwubWFya2VyKFtyZXN0YXVyYW50LmxhdGxuZy5sYXQsIHJlc3RhdXJhbnQubGF0bG5nLmxuZ10sXG4gICAgICB7dGl0bGU6IHJlc3RhdXJhbnQubmFtZSxcbiAgICAgIGFsdDogcmVzdGF1cmFudC5uYW1lLFxuICAgICAgdXJsOiBEQkhlbHBlci51cmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpLFxuICAgICAga2V5Ym9hcmQ6IGZhbHNlXG4gICAgICB9XG4gICAgKTtcbiAgICAgIG1hcmtlci5hZGRUbyhtYXBNb2RlbC5uZXdNYXApO1xuICAgIHJldHVybiBtYXJrZXI7XG4gIH1cbiAgLyogc3RhdGljIG1hcE1hcmtlckZvclJlc3RhdXJhbnQocmVzdGF1cmFudCwgbWFwKSB7XG4gICAgY29uc3QgbWFya2VyID0gbmV3IGdvb2dsZS5tYXBzLk1hcmtlcih7XG4gICAgICBwb3NpdGlvbjogcmVzdGF1cmFudC5sYXRsbmcsXG4gICAgICB0aXRsZTogcmVzdGF1cmFudC5uYW1lLFxuICAgICAgdXJsOiBEQkhlbHBlci51cmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpLFxuICAgICAgbWFwOiBtYXAsXG4gICAgICBhbmltYXRpb246IGdvb2dsZS5tYXBzLkFuaW1hdGlvbi5EUk9QfVxuICAgICk7XG4gICAgcmV0dXJuIG1hcmtlcjtcbiAgfSAqL1xuXG59XG4iLCIvKlxyXG4gKiBEZXRhaWxzIHBhZ2UgY29udHJvbGxlclxyXG4gKi9cclxuXHJcbmNvbnN0IGRldGFpbHNDb250cm9sbGVyID0ge1xyXG4gIGluaXQoKSB7XHJcbiAgICByZXN0YXVyYW50TW9kZWwuaW5pdCgpLnRoZW4ocmVzdGF1cmFudCA9PiB7XHJcbiAgICAgIGJyZWFkY3J1bWJWaWV3LnJlbmRlcihyZXN0YXVyYW50KTtcclxuICAgICAgcmVzdGF1cmFudFZpZXcucmVuZGVyKHJlc3RhdXJhbnQpO1xyXG4gICAgICBtYXBNb2RlbC5pbml0KFtyZXN0YXVyYW50LmxhdGxuZy5sYXQsIHJlc3RhdXJhbnQubGF0bG5nLmxuZ10sIDE2KTtcclxuICAgICAgbWFwTW9kZWwuYWRkTWFya2VyKHJlc3RhdXJhbnQpO1xyXG4gICAgICB3aW5kb3cuc2Nyb2xsVG8oMCwgMCk7XHJcbiAgICB9KTtcclxuICB9XHJcbn07IiwiLypcclxuICogRmlsdGVyIFNlbGVjdGlvblxyXG4gKi9cclxuXHJcbmNvbnN0IGZpbHRlck1vZGVsID0ge1xyXG4gIC8vIFN0b3JlcyB1c2VyIHNlbGVjdGlvbi4gSW5pdGlhbGl6ZXMgd2l0aCBkZWZhdWx0IGRhdGEuXHJcbiAgc2VsZWN0aW9uOiB7XHJcbiAgICBjdWlzaW5lOiAnYWxsJyxcclxuICAgIG5laWdoYm9yaG9vZDogJ2FsbCdcclxuICB9LFxyXG5cclxuICBpbml0KCkge1xyXG4gICAgLy8gUmV0dXJuIGEgcHJvbWlzZSB3aGVuIGFsbCBkYXRhIGlzIGZldGNoZWQgc3VjZXNzZnVsbHlcclxuICAgIHJldHVybiBQcm9taXNlLmFsbChbXHJcbiAgICAgIHRoaXMuZmV0Y2hOZWlnaGJvcmhvb2RzKCksXHJcbiAgICAgIHRoaXMuZmV0Y2hDdWlzaW5lcygpXHJcbiAgICBdKTtcclxuICB9LFxyXG5cclxuICBmZXRjaE5laWdoYm9yaG9vZHMoKSB7XHJcbiAgICAvLyBHZXQgZGF0YSBmcm9tIHRoZSBEQlxyXG4gICAgcmV0dXJuIERCSGVscGVyLmZldGNoTmVpZ2hib3Job29kcygpLnRoZW4obmVpZ2hib3Job29kcyA9PiB7XHJcbiAgICAgIHRoaXMubmVpZ2hib3Job29kcyA9IG5laWdoYm9yaG9vZHM7XHJcbiAgICB9KTtcclxuICB9LFxyXG5cclxuICBmZXRjaEN1aXNpbmVzKCkge1xyXG4gICAgLy8gR2V0IGRhdGEgZnJvbSB0aGUgREJcclxuICAgIHJldHVybiBEQkhlbHBlci5mZXRjaEN1aXNpbmVzKCkudGhlbihjdWlzaW5lcyA9PiB7XHJcbiAgICAgIHRoaXMuY3Vpc2luZXMgPSBjdWlzaW5lcztcclxuICAgIH0pO1xyXG4gIH0sXHJcblxyXG4gIC8vIEdldHRlciBtZXRob2QgZmV0Y2hlZCBkYXRhLlxyXG4gIGdldERhdGEoKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBuZWlnaGJvcmhvb2RzOiB0aGlzLm5laWdoYm9yaG9vZHMsXHJcbiAgICAgIGN1aXNpbmVzOiB0aGlzLmN1aXNpbmVzXHJcbiAgICB9O1xyXG4gIH0sXHJcblxyXG4gIHVwZGF0ZVNlbGVjdGlvbihzZWxlY3Rpb24pIHtcclxuICAgIHRoaXMuc2VsZWN0aW9uID0gc2VsZWN0aW9uO1xyXG4gIH0sXHJcblxyXG4gIGdldFNlbGVjdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLnNlbGVjdGlvbjtcclxuICB9XHJcbn07XHJcblxyXG5jb25zdCBmaWx0ZXJWaWV3ID0ge1xyXG4gIGluaXQoKSB7XHJcbiAgICAvLyBCaW5kIGVsZW1lbnRzXHJcbiAgICB0aGlzLm5laWdoYm9yaG9vZHNFbCA9ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25laWdoYm9yaG9vZHMtc2VsZWN0Jyk7XHJcbiAgICB0aGlzLmN1aXNpbmVzRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3Vpc2luZXMtc2VsZWN0Jyk7XHJcbiAgICAvLyBSZW5kZXIgd2l0aCB0aGUgZGF0YSBmcm9tIHRoZSBjb250cm9sbGVyXHJcbiAgICB0aGlzLnJlbmRlcihjb250cm9sbGVyLmdldEZpbHRlckRhdGEoKSk7XHJcblxyXG4gICAgLy8gTGlzdGVuIGZvciBjaGFuZ2VzIGluIGZpbHRlciBzZWxlY3Rpb25cclxuICAgIFt0aGlzLm5laWdoYm9yaG9vZHNFbCwgdGhpcy5jdWlzaW5lc0VsXS5mb3JFYWNoKChlbCkgPT4ge1xyXG4gICAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBjb250cm9sbGVyLnVwZGF0ZVJlc3RhdXJhbnRzKTtcclxuICAgIH0pO1xyXG4gIH0sXHJcblxyXG4gIHJlbmRlcihkYXRhKSB7XHJcbiAgICAvLyBSZW5kZXIgbmVpZ2hib3Job29kc1xyXG4gICAgZGF0YS5uZWlnaGJvcmhvb2RzLmZvckVhY2gobmVpZ2hib3Job29kID0+IHtcclxuICAgICAgY29uc3Qgb3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7XHJcbiAgICAgIG9wdGlvbi5pbm5lckhUTUwgPSBuZWlnaGJvcmhvb2Q7XHJcbiAgICAgIG9wdGlvbi52YWx1ZSA9IG5laWdoYm9yaG9vZDtcclxuICAgICAgdGhpcy5uZWlnaGJvcmhvb2RzRWwuYXBwZW5kKG9wdGlvbik7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBSZW5kZXIgY3Vpc2luZXNcclxuICAgIGRhdGEuY3Vpc2luZXMuZm9yRWFjaChjdWlzaW5lID0+IHtcclxuICAgICAgY29uc3Qgb3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7XHJcbiAgICAgIG9wdGlvbi5pbm5lckhUTUwgPSBjdWlzaW5lO1xyXG4gICAgICBvcHRpb24udmFsdWUgPSBjdWlzaW5lO1xyXG4gICAgICB0aGlzLmN1aXNpbmVzRWwuYXBwZW5kKG9wdGlvbik7XHJcbiAgICB9KTtcclxuICB9LFxyXG5cclxuICAvLyBSZXRyaWV2ZSBhbmQgcmV0dXJuIHVzZXIgc2VsZWN0aW9uXHJcbiAgZ2V0U2VsZWN0aW9uKCkge1xyXG4gICAgY29uc3QgY0luZGV4ID0gdGhpcy5jdWlzaW5lc0VsLnNlbGVjdGVkSW5kZXg7XHJcbiAgICBjb25zdCBuSW5kZXggPSB0aGlzLm5laWdoYm9yaG9vZHNFbC5zZWxlY3RlZEluZGV4O1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIGN1aXNpbmU6IHRoaXMuY3Vpc2luZXNFbFtjSW5kZXhdLnZhbHVlLFxyXG4gICAgICBuZWlnaGJvcmhvb2Q6IHRoaXMubmVpZ2hib3Job29kc0VsW25JbmRleF0udmFsdWVcclxuICAgIH07XHJcbiAgfVxyXG59O1xyXG4iLCIvKlxyXG4gKiBJbmRleCBwYWdlIGNvbnRyb2xsZXJcclxuICovXHJcblxyXG5jb25zdCBjb250cm9sbGVyID0ge1xyXG4gIC8vIFNldCBldmVyeXRoaW5nIHVwIGFuZCByZW5kZXIuXHJcbiAgaW5pdCgpIHtcclxuICAgIGZpbHRlck1vZGVsLmluaXQoKS50aGVuKCgpID0+IGZpbHRlclZpZXcuaW5pdCgpKTtcclxuICAgIHJlc3RhdXJhbnRzTW9kZWwuaW5pdCgpLnRoZW4oKCkgPT4gcmVzdGF1cmFudHNWaWV3LmluaXQoKSk7XHJcbiAgICBtYXBNb2RlbC5pbml0KFs0MC43MjIyMTYsIC03My45ODc1MDFdLCAxMSk7XHJcbiAgICBicmVhZGNydW1iVmlldy5yZXNldCgpO1xyXG4gICAgd2luZG93LnNjcm9sbFRvKDAsIDApO1xyXG4gIH0sXHJcblxyXG4gIC8vIEdldHRlciBtZXRob2RzXHJcbiAgZ2V0RmlsdGVyRGF0YSgpIHtcclxuICAgIHJldHVybiBmaWx0ZXJNb2RlbC5nZXREYXRhKCk7XHJcbiAgfSxcclxuXHJcbiAgZ2V0RmlsdGVyU2VsZWN0aW9uKCkge1xyXG4gICAgcmV0dXJuIGZpbHRlck1vZGVsLmdldFNlbGVjdGlvbigpO1xyXG4gIH0sXHJcblxyXG4gIGdldFJlc3RhdXJhbnRzKCkge1xyXG4gICAgcmV0dXJuIHJlc3RhdXJhbnRzTW9kZWwuZ2V0UmVzdGF1cmFudHMoKTtcclxuICB9LFxyXG5cclxuICAvLyBUaGlzIGlzIGNhbGxlZCBvbiB1c2VyIHNlbGVjdGlvbiBjaGFuZ2VcclxuICB1cGRhdGVSZXN0YXVyYW50cygpIHtcclxuICAgIGZpbHRlck1vZGVsLnVwZGF0ZVNlbGVjdGlvbihmaWx0ZXJWaWV3LmdldFNlbGVjdGlvbigpKTtcclxuICAgIGNvbnRyb2xsZXIucmVzZXRSZXN0YXVyYW50cygpO1xyXG4gIH0sXHJcblxyXG4gIHJlc2V0UmVzdGF1cmFudHMoKSB7XHJcbiAgICByZXN0YXVyYW50c01vZGVsLmluaXQoKS50aGVuKCgpID0+IHJlc3RhdXJhbnRzVmlldy5yZW5kZXIoXHJcbiAgICAgIGNvbnRyb2xsZXIuZ2V0UmVzdGF1cmFudHMoKSlcclxuICAgICk7XHJcbiAgfSxcclxuXHJcbiAgLy8gVHJpZ2dlcnMgbWFwIHJlc2V0cy5cclxuICBzZXRNYXJrZXJzKHJlc3RhdXJhbnRzKSB7XHJcbiAgICBtYXBNb2RlbC5hZGRNYXJrZXJzKHJlc3RhdXJhbnRzKTtcclxuICB9XHJcbn07IiwiLypcclxuICogPG1haW4+IGNvbnRyb2xsZXJcclxuICovXHJcblxyXG5jb25zdCBtYWluQ29udHJvbGxlciA9IHtcclxuICBzZXRTdGF0ZShzdGF0ZSkge1xyXG4gICAgdGhpcy5zdGF0ZSA9IHN0YXRlO1xyXG4gICAgbWFpblZpZXcucmVuZGVyKHN0YXRlKTtcclxuICB9LFxyXG5cclxuICBnZXRTdGF0ZSgpIHtcclxuICAgIHJldHVybiB0aGlzLnN0YXRlO1xyXG4gIH1cclxufTtcclxuXHJcbi8qXHJcbiAqIDxtYWluPiB2aWV3XHJcbiAqL1xyXG5cclxuY29uc3QgbWFpblZpZXcgPSB7XHJcbiAgLy8gPG1haW4+IGVsZW1lbnQgdG8gaG9vayBpbnRvXHJcbiAgZWw6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ21haW4nKSxcclxuICAvLyBBbGwgdGVtcGxhdGVzXHJcbiAgdGVtcGxhdGVzOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcudGVtcGxhdGUnKSxcclxuXHJcbiAgLy8gTWFwcyBzdGF0ZXMgdG8gdGVtcGxhdGVzXHJcbiAgLy8gUmV0dXJucyBhIHRleHQvdGVtcGxhdGUgZWxlbWVudFxyXG4gIGdldFRlbXBsYXRlKHN0YXRlKSB7XHJcbiAgICBsZXQgdGVtcGxhdGU7XHJcbiAgICB0aGlzLnRlbXBsYXRlcy5mb3JFYWNoKG4gPT4ge1xyXG4gICAgICBpZiAobi5pZCA9PT0gc3RhdGUpIHRlbXBsYXRlID0gbjtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHRlbXBsYXRlO1xyXG4gIH0sXHJcblxyXG4gIHJlbmRlcihzdGF0ZSkge1xyXG4gICAgLy8gQWRkICdpbnNpZGUnIGNsYXNzIHRvIGJvZHkgaWYgd2UgYXJlIG9uIGRldGFpbHMgcGFnZVxyXG4gICAgaWYgKCdkZXRhaWxzJyA9PT0gc3RhdGUpIHtcclxuICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKCdpbnNpZGUnKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnaW5zaWRlJyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSW5zZXJ0IHRlbXBsYXRlIGludG8gcGFnZVxyXG4gICAgdGhpcy5lbC5pbm5lckhUTUwgPSB0aGlzLmdldFRlbXBsYXRlKHN0YXRlKS5pbm5lckhUTUw7XHJcblxyXG4gICAgLy8gUHJvY2VlZCB3aXRoIHN1YnZpZXdzXHJcbiAgICBzd2l0Y2ggKHN0YXRlKSB7XHJcbiAgICBjYXNlICdpbmRleCc6XHJcbiAgICAgIGNvbnRyb2xsZXIuaW5pdCgpO1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgJ2RldGFpbHMnOlxyXG4gICAgICBkZXRhaWxzQ29udHJvbGxlci5pbml0KCk7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gIH1cclxufTtcclxuXHJcblxyXG5jb25zdCBicmVhZGNydW1iVmlldyA9IHtcclxuICBlbDogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JyZWFkY3J1bWInKSxcclxuXHJcbiAgcmVuZGVyKHJlc3RhdXJhbnQpIHtcclxuICAgIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcclxuICAgIGxpLmlubmVySFRNTCA9IHJlc3RhdXJhbnQubmFtZTtcclxuICAgIHRoaXMuZWwuYXBwZW5kQ2hpbGQobGkpO1xyXG4gIH0sXHJcblxyXG4gIHJlc2V0KCkge1xyXG4gICAgdGhpcy5lbC5pbm5lckhUTUwgPSAnPGxpPjxhIGhyZWY9XCIvXCI+SG9tZTwvYT48L2xpPic7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldCBhIHBhcmFtZXRlciBieSBuYW1lIGZyb20gcGFnZSBVUkwuXHJcbiAqL1xyXG5jb25zdCBnZXRQYXJhbWV0ZXJCeU5hbWUgPSAobmFtZSwgdXJsKSA9PiB7XHJcbiAgaWYgKCF1cmwpXHJcbiAgICB1cmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcclxuICB1cmwgPSBuZXcgVVJMKHVybCk7XHJcbiAgcmV0dXJuIG5ldyBVUkxTZWFyY2hQYXJhbXModXJsLnNlYXJjaCkuZ2V0KCdpZCcpO1xyXG59OyIsIi8qXHJcbiAqIE1hcFxyXG4gKi9cclxuXHJcbmNvbnN0IG1hcE1vZGVsID0ge1xyXG4gIG1hcmtlcnM6IFtdLFxyXG5cclxuICAvLyBNYXBib3ggaW5pdFxyXG4gIGluaXQoY2VudGVyLCB6b29tKSB7XHJcbiAgICB0aGlzLm5ld01hcCA9IEwubWFwKCdtYXAnLCB7XHJcbiAgICAgIGNlbnRlcjogY2VudGVyLFxyXG4gICAgICB6b29tOiB6b29tLFxyXG4gICAgICBzY3JvbGxXaGVlbFpvb206IGZhbHNlLFxyXG4gICAgICBrZXlib2FyZDogZmFsc2VcclxuICAgIH0pO1xyXG4gICAgTC50aWxlTGF5ZXIoJ2h0dHBzOi8vYXBpLnRpbGVzLm1hcGJveC5jb20vdjQve2lkfS97en0ve3h9L3t5fS5qcGc3MD9hY2Nlc3NfdG9rZW49e21hcGJveFRva2VufScsIHtcclxuICAgICAgbWFwYm94VG9rZW46ICdway5leUoxSWpvaWVubHRaWFJvSWl3aVlTSTZJbU5xYW5CMWN6QXlOekpyWW5VemNXMHdhVE41YVdGa2Eyb2lmUS5uUTdxT29MSnBuQXZYbm1SSTcwX2RRJyxcclxuICAgICAgbWF4Wm9vbTogMTgsXHJcbiAgICAgIGF0dHJpYnV0aW9uOiAnTWFwIGRhdGEgJmNvcHk7IDxhIGhyZWY9XCJodHRwczovL3d3dy5vcGVuc3RyZWV0bWFwLm9yZy9cIj5PcGVuU3RyZWV0TWFwPC9hPiBjb250cmlidXRvcnMsICcgK1xyXG4gICAgICAgICc8YSBocmVmPVwiaHR0cHM6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL2xpY2Vuc2VzL2J5LXNhLzIuMC9cIj5DQy1CWS1TQTwvYT4sICcgK1xyXG4gICAgICAgICdJbWFnZXJ5IMKpIDxhIGhyZWY9XCJodHRwczovL3d3dy5tYXBib3guY29tL1wiPk1hcGJveDwvYT4nLFxyXG4gICAgICBpZDogJ21hcGJveC5zdHJlZXRzJ1xyXG4gICAgfSkuYWRkVG8odGhpcy5uZXdNYXApO1xyXG4gIH0sXHJcblxyXG4gIC8vIFJlc2V0cyBtYXAgbWFya2Vyc1xyXG4gIGFkZE1hcmtlcnMocmVzdGF1cmFudHMpIHtcclxuICAgIHRoaXMucmVzZXRNYXJrZXJzKCk7XHJcblxyXG4gICAgcmVzdGF1cmFudHMuZm9yRWFjaChyZXN0YXVyYW50ID0+IHtcclxuICAgICAgLy8gQWRkIG1hcmtlciB0byB0aGUgbWFwXHJcbiAgICAgIGNvbnN0IG1hcmtlciA9IERCSGVscGVyLm1hcE1hcmtlckZvclJlc3RhdXJhbnQocmVzdGF1cmFudCwgdGhpcy5uZXdNYXApO1xyXG4gICAgICBtYXJrZXIub24oJ2NsaWNrJywgb25DbGljayk7XHJcbiAgICAgIGZ1bmN0aW9uIG9uQ2xpY2soKSB7XHJcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBtYXJrZXIub3B0aW9ucy51cmw7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5tYXJrZXJzLnB1c2gobWFya2VyKTtcclxuICAgIH0pO1xyXG4gIH0sXHJcblxyXG4gIC8vIEFkZCBzaW5nbGUgbWFya2VyXHJcbiAgYWRkTWFya2VyKHJlc3RhdXJhbnQpIHtcclxuICAgIERCSGVscGVyLm1hcE1hcmtlckZvclJlc3RhdXJhbnQocmVzdGF1cmFudCk7XHJcbiAgfSxcclxuXHJcbiAgcmVzZXRNYXJrZXJzKCkge1xyXG4gICAgaWYgKHRoaXMubWFya2Vycykge1xyXG4gICAgICB0aGlzLm1hcmtlcnMuZm9yRWFjaChtYXJrZXIgPT4gbWFya2VyLnJlbW92ZSgpKTtcclxuICAgIH1cclxuICAgIHRoaXMubWFya2VycyA9IFtdO1xyXG4gIH1cclxufTsiLCJjb25zdCByZXN0YXVyYW50TW9kZWwgPSB7XHJcbiAgaW5pdCgpIHtcclxuICAgIHJldHVybiB0aGlzLmZldGNoRnJvbVVSTCgpO1xyXG4gIH0sXHJcblxyXG4gIGZldGNoRnJvbVVSTCgpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIGNvbnN0IGlkID0gZ2V0UGFyYW1ldGVyQnlOYW1lKCdpZCcpO1xyXG4gICAgICBpZiAodGhpcy5yZXN0YXVyYW50ICYmIHRoaXMucmVzdGF1cmFudC5pZCA9PT0gaWQpIHsgLy8gcmVzdGF1cmFudCBhbHJlYWR5IGZldGNoZWQhXHJcbiAgICAgICAgcmVzb2x2ZSh0aGlzLnJlc3RhdXJhbnQpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICghaWQpIHsgLy8gbm8gaWQgZm91bmQgaW4gVVJMXHJcbiAgICAgICAgcmVqZWN0KCdObyByZXN0YXVyYW50IGlkIGluIFVSTCcpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudEJ5SWQoaWQpLnRoZW4ocmVzdGF1cmFudCA9PiB7XHJcbiAgICAgICAgICB0aGlzLnJlc3RhdXJhbnQgPSByZXN0YXVyYW50O1xyXG4gICAgICAgICAgaWYgKCFyZXN0YXVyYW50KSB7XHJcbiAgICAgICAgICAgIHJlamVjdChgTm8gcmVzdGF1cmFudCB3aXRoIGlkICR7aWR9IGZvdW5kLmApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLy8gZmlsbFJlc3RhdXJhbnRIVE1MKCk7XHJcbiAgICAgICAgICByZXNvbHZlKHJlc3RhdXJhbnQpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG5jb25zdCByZXN0YXVyYW50VmlldyA9IHtcclxuICByZW5kZXIocmVzdGF1cmFudCkge1xyXG4gICAgY29uc3QgbmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LW5hbWUnKTtcclxuICAgIG5hbWUuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5uYW1lO1xyXG5cclxuICAgIGNvbnN0IGFkZHJlc3MgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1hZGRyZXNzJyk7XHJcbiAgICBhZGRyZXNzLmlubmVySFRNTCA9IHJlc3RhdXJhbnQuYWRkcmVzcztcclxuXHJcbiAgICBjb25zdCBpbWFnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LWltZycpO1xyXG4gICAgaW1hZ2UuY2xhc3NOYW1lID0gJ3Jlc3RhdXJhbnQtaW1nJztcclxuICAgIGltYWdlLnNyYyA9IERCSGVscGVyLmltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KTtcclxuICAgIGltYWdlLmFsdCA9IGBBbiBpbWFnZSBvZiAke3Jlc3RhdXJhbnQubmFtZX1gO1xyXG5cclxuICAgIGNvbnN0IGN1aXNpbmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1jdWlzaW5lJyk7XHJcbiAgICBjdWlzaW5lLmlubmVySFRNTCA9IHJlc3RhdXJhbnQuY3Vpc2luZV90eXBlO1xyXG5cclxuICAgIC8vIGZpbGwgb3BlcmF0aW5nIGhvdXJzXHJcbiAgICBpZiAocmVzdGF1cmFudC5vcGVyYXRpbmdfaG91cnMpIHtcclxuICAgICAgdGhpcy5yZW5kZXJIb3VycyhyZXN0YXVyYW50Lm9wZXJhdGluZ19ob3Vycyk7XHJcbiAgICB9XHJcbiAgICAvLyBmaWxsIHJldmlld3NcclxuICAgIHRoaXMucmVuZGVyUmV2aWV3cyhyZXN0YXVyYW50LnJldmlld3MpO1xyXG4gIH0sXHJcblxyXG4gIHJlbmRlckhvdXJzKG9wZXJhdGluZ0hvdXJzKSB7XHJcbiAgICBjb25zdCBob3VycyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LWhvdXJzJyk7XHJcbiAgICBmb3IgKGxldCBrZXkgaW4gb3BlcmF0aW5nSG91cnMpIHtcclxuICAgICAgY29uc3Qgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndHInKTtcclxuXHJcbiAgICAgIGNvbnN0IGRheSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XHJcbiAgICAgIGRheS5pbm5lckhUTUwgPSBrZXk7XHJcbiAgICAgIHJvdy5hcHBlbmRDaGlsZChkYXkpO1xyXG5cclxuICAgICAgY29uc3QgdGltZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XHJcbiAgICAgIHRpbWUuaW5uZXJIVE1MID0gb3BlcmF0aW5nSG91cnNba2V5XTtcclxuICAgICAgcm93LmFwcGVuZENoaWxkKHRpbWUpO1xyXG5cclxuICAgICAgaG91cnMuYXBwZW5kQ2hpbGQocm93KTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICByZW5kZXJSZXZpZXdzKHJldmlld3MpIHtcclxuICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXZpZXdzLWNvbnRhaW5lcicpO1xyXG4gICAgY29uc3QgdGl0bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdoMicpO1xyXG4gICAgdGl0bGUuaW5uZXJIVE1MID0gJ1Jldmlld3MnO1xyXG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHRpdGxlKTtcclxuXHJcbiAgICBpZiAoIXJldmlld3MpIHtcclxuICAgICAgY29uc3Qgbm9SZXZpZXdzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xyXG4gICAgICBub1Jldmlld3MuaW5uZXJIVE1MID0gJ05vIHJldmlld3MgeWV0ISc7XHJcbiAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChub1Jldmlld3MpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBjb25zdCB1bCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXZpZXdzLWxpc3QnKTtcclxuICAgIHJldmlld3MuZm9yRWFjaChyZXZpZXcgPT4ge1xyXG4gICAgICB1bC5hcHBlbmRDaGlsZCh0aGlzLmNyZWF0ZVJldmlld0hUTUwocmV2aWV3KSk7XHJcbiAgICB9KTtcclxuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh1bCk7XHJcbiAgfSxcclxuXHJcbiAgY3JlYXRlUmV2aWV3SFRNTChyZXZpZXcpIHtcclxuICAgIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcclxuICAgIGNvbnN0IG5hbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XHJcbiAgICBuYW1lLmlubmVySFRNTCA9IHJldmlldy5uYW1lO1xyXG4gICAgbGkuYXBwZW5kQ2hpbGQobmFtZSk7XHJcblxyXG4gICAgY29uc3QgZGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcclxuICAgIGRhdGUuaW5uZXJIVE1MID0gcmV2aWV3LmRhdGU7XHJcbiAgICBsaS5hcHBlbmRDaGlsZChkYXRlKTtcclxuXHJcbiAgICBjb25zdCByYXRpbmcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XHJcbiAgICByYXRpbmcuaW5uZXJIVE1MID0gYFJhdGluZzogJHtyZXZpZXcucmF0aW5nfWA7XHJcbiAgICBsaS5hcHBlbmRDaGlsZChyYXRpbmcpO1xyXG5cclxuICAgIGNvbnN0IGNvbW1lbnRzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xyXG4gICAgY29tbWVudHMuaW5uZXJIVE1MID0gcmV2aWV3LmNvbW1lbnRzO1xyXG4gICAgbGkuYXBwZW5kQ2hpbGQoY29tbWVudHMpO1xyXG5cclxuICAgIHJldHVybiBsaTtcclxuICB9XHJcblxyXG59O1xyXG4iLCIvKlxyXG4gKiBSZXN0YXVyYW50cyBsaXN0XHJcbiAqL1xyXG5cclxuY29uc3QgcmVzdGF1cmFudHNNb2RlbCA9IHtcclxuICBpbml0KCkge1xyXG4gICAgY29uc3Qgc2VsID0gY29udHJvbGxlci5nZXRGaWx0ZXJTZWxlY3Rpb24oKTtcclxuICAgIHJldHVybiB0aGlzLmZldGNoUmVzdGF1cmFudHMoc2VsLmN1aXNpbmUsIHNlbC5uZWlnaGJvcmhvb2QpO1xyXG4gIH0sXHJcblxyXG4gIC8vIEdldCBkYXRhIGZyb20gdGhlIERCXHJcbiAgZmV0Y2hSZXN0YXVyYW50cyhjdWlzaW5lLCBuZWlnaGJvcmhvb2QpIHtcclxuICAgIHJldHVybiBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRCeUN1aXNpbmVBbmROZWlnaGJvcmhvb2QoY3Vpc2luZSwgbmVpZ2hib3Job29kKS50aGVuKHJlc3RhdXJhbnRzID0+IHtcclxuICAgICAgdGhpcy5yZXN0YXVyYW50cyA9IHJlc3RhdXJhbnRzO1xyXG4gICAgfSk7XHJcbiAgfSxcclxuXHJcbiAgLy8gR2V0dGVyIG1ldGhvZCBmb3JtIHRoaXMucmVzdGF1cmFudHNcclxuICBnZXRSZXN0YXVyYW50cygpIHtcclxuICAgIHJldHVybiB0aGlzLnJlc3RhdXJhbnRzO1xyXG4gIH1cclxufTtcclxuXHJcbmNvbnN0IHJlc3RhdXJhbnRzVmlldyA9IHtcclxuICBpbml0KCkge1xyXG4gICAgLy8gQmluZCBlbGVtZW50XHJcbiAgICB0aGlzLmVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnRzLWxpc3QnKTtcclxuXHJcbiAgICB0aGlzLnJlbmRlcihjb250cm9sbGVyLmdldFJlc3RhdXJhbnRzKCkpO1xyXG4gIH0sXHJcblxyXG4gIHJlbmRlcihyZXN0YXVyYW50cykge1xyXG4gICAgdGhpcy5lbC5pbm5lckhUTUwgPSAnJztcclxuXHJcbiAgICAvLyBNYXAgc2V0dXBcclxuICAgIGNvbnRyb2xsZXIuc2V0TWFya2VycyhyZXN0YXVyYW50cyk7XHJcblxyXG4gICAgcmVzdGF1cmFudHMuZm9yRWFjaChyZXN0YXVyYW50ID0+IHtcclxuICAgICAgdGhpcy5lbC5hcHBlbmQodGhpcy5jcmVhdGVIVE1MKHJlc3RhdXJhbnQpKTtcclxuICAgIH0pO1xyXG4gIH0sXHJcblxyXG4gIGNyZWF0ZUhUTUwocmVzdGF1cmFudCkge1xyXG4gICAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xyXG5cclxuICAgIGNvbnN0IGltYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XHJcbiAgICBpbWFnZS5jbGFzc05hbWUgPSAncmVzdGF1cmFudC1pbWcnO1xyXG4gICAgaW1hZ2Uuc3JjID0gREJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpO1xyXG4gICAgaW1hZ2UuYWx0ID0gYEFuIGltYWdlIG9mICR7cmVzdGF1cmFudC5uYW1lfWA7XHJcbiAgICBsaS5hcHBlbmQoaW1hZ2UpO1xyXG5cclxuICAgIC8vIFRpdGxlIGlzIGEgbGluayB0byBkZXRhaWxzIHBhZ2VcclxuICAgIC8vIFJlbW92ZWQgJ1ZpZXcgZGV0YWlscycgZm9yIGFjY2Vzc2liaWxpdHkgcmVhc29uc1xyXG4gICAgY29uc3QgbW9yZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcclxuICAgIG1vcmUuaHJlZiA9IERCSGVscGVyLnVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCk7XHJcbiAgICBtb3JlLmlubmVySFRNTCA9IHJlc3RhdXJhbnQubmFtZTtcclxuXHJcbiAgICBjb25zdCBuYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaDMnKTtcclxuICAgIG5hbWUuYXBwZW5kKG1vcmUpO1xyXG4gICAgbGkuYXBwZW5kKG5hbWUpO1xyXG5cclxuICAgIGNvbnN0IG5laWdoYm9yaG9vZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcclxuICAgIG5laWdoYm9yaG9vZC5pbm5lckhUTUwgPSByZXN0YXVyYW50Lm5laWdoYm9yaG9vZDtcclxuICAgIGxpLmFwcGVuZChuZWlnaGJvcmhvb2QpO1xyXG5cclxuICAgIGNvbnN0IGFkZHJlc3MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XHJcbiAgICBhZGRyZXNzLmlubmVySFRNTCA9IHJlc3RhdXJhbnQuYWRkcmVzcztcclxuICAgIGxpLmFwcGVuZChhZGRyZXNzKTtcclxuXHJcbiAgICByZXR1cm4gbGk7XHJcbiAgfSxcclxufTtcclxuIiwiLypcclxuICogTWFpbiByb3V0ZXIgb2JqZWN0XHJcbiAqL1xyXG5jb25zdCByb3V0ZXIgPSB7XHJcbiAgLy8gbWFwcyByb3V0ZXMgdG8gc3RhdGVzXHJcbiAgcm91dGVzOiB7XHJcbiAgICAnLyc6ICdpbmRleCcsXHJcbiAgICAnL3Jlc3RhdXJhbnQvJzogJ2RldGFpbHMnXHJcbiAgfSxcclxuXHJcbiAgaW5pdCgpIHtcclxuICAgIC8vIExvYWQgdGhlIHBhZ2VcclxuICAgIHRoaXMubmF2aWdhdGUobG9jYXRpb24uaHJlZik7XHJcblxyXG4gICAgLy8gTGlzdGVuIGZvciBjbGlja3Mgb24gbGlua3MuIEV4Y2x1ZGUgYm9va21hcmsgbGlua3NcclxuICAgIGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xyXG4gICAgICBpZiAoZS50YXJnZXQubm9kZU5hbWUgPT09ICdBJyAmJlxyXG4gICAgICAgICAgZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdocmVmJykuY2hhckF0KDApICE9PSAnIycpIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgdGhpcy5uYXZpZ2F0ZShlLnRhcmdldC5ocmVmKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICAvLyBNYW5hZ2UgYmFjayBhbmQgZm9yd2FyZCBidXR0b25zXHJcbiAgICB3aW5kb3cub25wb3BzdGF0ZSA9ICgpID0+IHtcclxuICAgICAgdGhpcy5uYXZpZ2F0ZShsb2NhdGlvbi5ocmVmKTtcclxuICAgIH07XHJcbiAgICAvLyBSZWdpc3RlciBTZXJ2aWNlIFdvcmtlclxyXG4gICAgaWYgKCFuYXZpZ2F0b3Iuc2VydmljZVdvcmtlcikgcmV0dXJuO1xyXG4gICAgbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIucmVnaXN0ZXIoJy9zdy5qcycsIHtcclxuICAgICAgc2NvcGU6ICcvJ1xyXG4gICAgfSk7XHJcbiAgfSxcclxuXHJcblxyXG5cclxuICAvLyBAcGFyYW0gdXJsIHN0cmluZ1xyXG4gIG5hdmlnYXRlKHVybCkge1xyXG4gICAgaWYgKG5ldyBVUkwodXJsKS5vcmlnaW4gPT09IGxvY2F0aW9uLm9yaWdpbikge1xyXG4gICAgICBpZiAodXJsICE9PSBsb2NhdGlvbi5ocmVmKSB7XHJcbiAgICAgICAgaGlzdG9yeS5wdXNoU3RhdGUobnVsbCwgbnVsbCwgdXJsKTtcclxuICAgICAgfVxyXG4gICAgICB0aGlzLmNoYW5nZVN0YXRlKHVybCk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgY2hhbmdlU3RhdGUodXJsKSB7XHJcbiAgICBtYWluQ29udHJvbGxlci5zZXRTdGF0ZShcclxuICAgICAgdGhpcy5yb3V0ZXNbbmV3IFVSTCh1cmwpLnBhdGhuYW1lXVxyXG4gICAgKTtcclxuICB9XHJcbn07XHJcblxyXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4gcm91dGVyLmluaXQoKSk7Il19
