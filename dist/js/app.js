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
    this.el.innerHTML = '<li><a href="/" tabindex="0">Home</a></li>';
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
    more.tabIndex = 0;

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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRiaGVscGVyLmpzIiwiZGV0YWlscy5qcyIsImZpbHRlci5qcyIsImluZGV4LmpzIiwibWFpbi5qcyIsIm1hcC5qcyIsInJlc3RhdXJhbnQuanMiLCJyZXN0YXVyYW50cy5qcyIsInJvdXRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzlLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29tbW9uIGRhdGFiYXNlIGhlbHBlciBmdW5jdGlvbnMuXG4gKi9cbmNsYXNzIERCSGVscGVyIHtcblxuICAvKipcbiAgICogRGF0YWJhc2UgVVJMLlxuICAgKiBDaGFuZ2UgdGhpcyB0byByZXN0YXVyYW50cy5qc29uIGZpbGUgbG9jYXRpb24gb24geW91ciBzZXJ2ZXIuXG4gICAqL1xuICBzdGF0aWMgZ2V0IERBVEFCQVNFX1VSTCgpIHtcbiAgICBjb25zdCBwb3J0ID0gODAwMDsgLy8gQ2hhbmdlIHRoaXMgdG8geW91ciBzZXJ2ZXIgcG9ydFxuICAgIHJldHVybiBgaHR0cDovL2xvY2FsaG9zdDoke3BvcnR9L2RhdGEvcmVzdGF1cmFudHMuanNvbmA7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggYWxsIHJlc3RhdXJhbnRzLlxuICAgKi9cbiAgc3RhdGljIGZldGNoUmVzdGF1cmFudHMoKSB7XG4gICAgLy8gU2luY2Ugd2UgYWx3YXlzIGZldGNoIHRoZSBlbnRpcmUganNvbiB0aGF0IG5ldmVyIGNoYW5nZXMsXG4gICAgLy8gbGV0J3MgcmVxdWVzdCBpdCBvbmx5IG9uY2UgYW5kIHN0b3JlIGluIGEgc3RhdGljIHByb3BlcnR5LlxuICAgIC8vIERCSGVscGVyLmpzb24gaXMgYSBwcm9taXNlIHJldHVybmVkIGJ5IFJlc3BvbnNlLmpzb24oKTtcbiAgICBpZiAoIURCSGVscGVyLmpzb24pIHtcbiAgICAgIERCSGVscGVyLmpzb24gPSBmZXRjaChEQkhlbHBlci5EQVRBQkFTRV9VUkwpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBpZiAoMjAwID09PSByZXNwb25zZS5zdGF0dXMpIHtcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IGBSZXF1ZXN0IGZhaWxlZC4gUmV0dXJuZWQgc3RhdHVzIG9mICR7cmVzcG9uc2Uuc3RhdHVzfWA7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2gobXNnID0+IGNvbnNvbGUuZXJyb3IobXNnKSk7XG4gICAgfVxuICAgIHJldHVybiBEQkhlbHBlci5qc29uO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIGEgcmVzdGF1cmFudCBieSBpdHMgSUQuXG4gICAqL1xuICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50QnlJZChpZCkge1xuICAgIC8vIGZldGNoIGFsbCByZXN0YXVyYW50cyB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygpLnRoZW4ocmVzdGF1cmFudHMgPT4ge1xuICAgICAgICBjb25zdCByZXN0YXVyYW50ID0gcmVzdGF1cmFudHMucmVzdGF1cmFudHMuZmluZChyID0+IHIuaWQgPT0gaWQpO1xuICAgICAgICBpZiAocmVzdGF1cmFudCkgeyAvLyBHb3QgdGhlIHJlc3RhdXJhbnRcbiAgICAgICAgICByZXNvbHZlKHJlc3RhdXJhbnQpO1xuICAgICAgICB9IGVsc2UgeyAvLyBSZXN0YXVyYW50IGRvZXMgbm90IGV4aXN0IGluIHRoZSBkYXRhYmFzZVxuICAgICAgICAgIHJlamVjdCgnUmVzdGF1cmFudCBkb2VzIG5vdCBleGlzdCcpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCByZXN0YXVyYW50cyBieSBhIGN1aXNpbmUgdHlwZSB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cbiAgICovXG4gIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRCeUN1aXNpbmUoY3Vpc2luZSkge1xuICAgIC8vIEZldGNoIGFsbCByZXN0YXVyYW50cyAgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmdcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKS50aGVuKHJlc3RhdXJhbnRzID0+IHtcbiAgICAgICAgLy8gRmlsdGVyIHJlc3RhdXJhbnRzIHRvIGhhdmUgb25seSBnaXZlbiBjdWlzaW5lIHR5cGVcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IHJlc3RhdXJhbnRzLnJlc3RhdXJhbnRzLmZpbHRlcihyID0+IHIuY3Vpc2luZV90eXBlID09IGN1aXNpbmUpO1xuICAgICAgICByZXNvbHZlKHJlc3VsdHMpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggcmVzdGF1cmFudHMgYnkgYSBuZWlnaGJvcmhvb2Qgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXG4gICAqL1xuICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50QnlOZWlnaGJvcmhvb2QobmVpZ2hib3Job29kKSB7XG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKCkudGhlbihyZXN0YXVyYW50cyA9PiB7XG4gICAgICAgIC8vIEZpbHRlciByZXN0YXVyYW50cyB0byBoYXZlIG9ubHkgZ2l2ZW4gbmVpZ2hib3Job29kXG4gICAgICAgIGNvbnN0IHJlc3VsdHMgPSByZXN0YXVyYW50cy5yZXN0YXVyYW50cy5maWx0ZXIociA9PiByLm5laWdoYm9yaG9vZCA9PSBuZWlnaGJvcmhvb2QpO1xuICAgICAgICByZXNvbHZlKHJlc3VsdHMpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggcmVzdGF1cmFudHMgYnkgYSBjdWlzaW5lIGFuZCBhIG5laWdoYm9yaG9vZCB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cbiAgICovXG4gIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRCeUN1aXNpbmVBbmROZWlnaGJvcmhvb2QoY3Vpc2luZSwgbmVpZ2hib3Job29kKSB7XG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKCkudGhlbihyZXN0YXVyYW50cyA9PiB7XG4gICAgICAgIGxldCByZXN1bHRzID0gcmVzdGF1cmFudHMucmVzdGF1cmFudHM7XG4gICAgICAgIGlmIChjdWlzaW5lICE9ICdhbGwnKSB7IC8vIGZpbHRlciBieSBjdWlzaW5lXG4gICAgICAgICAgcmVzdWx0cyA9IHJlc3VsdHMuZmlsdGVyKHIgPT4gci5jdWlzaW5lX3R5cGUgPT0gY3Vpc2luZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5laWdoYm9yaG9vZCAhPSAnYWxsJykgeyAvLyBmaWx0ZXIgYnkgbmVpZ2hib3Job29kXG4gICAgICAgICAgcmVzdWx0cyA9IHJlc3VsdHMuZmlsdGVyKHIgPT4gci5uZWlnaGJvcmhvb2QgPT0gbmVpZ2hib3Job29kKTtcbiAgICAgICAgfVxuICAgICAgICByZXNvbHZlKHJlc3VsdHMpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggYWxsIG5laWdoYm9yaG9vZHMgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXG4gICAqL1xuICBzdGF0aWMgZmV0Y2hOZWlnaGJvcmhvb2RzKCkge1xuICAgIC8vIEZldGNoIGFsbCByZXN0YXVyYW50c1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygpLnRoZW4ocmVzdGF1cmFudHMgPT4ge1xuICAgICAgICAvLyBHZXQgYWxsIG5laWdoYm9yaG9vZHMgZnJvbSBhbGwgcmVzdGF1cmFudHNcbiAgICAgICAgcmVzdGF1cmFudHMgPSByZXN0YXVyYW50cy5yZXN0YXVyYW50cztcbiAgICAgICAgY29uc3QgbmVpZ2hib3Job29kcyA9IHJlc3RhdXJhbnRzLm1hcCgodiwgaSkgPT4gcmVzdGF1cmFudHNbaV0ubmVpZ2hib3Job29kKTtcbiAgICAgICAgLy8gUmVtb3ZlIGR1cGxpY2F0ZXMgZnJvbSBuZWlnaGJvcmhvb2RzXG4gICAgICAgIGNvbnN0IHVuaXF1ZU5laWdoYm9yaG9vZHMgPSBuZWlnaGJvcmhvb2RzLmZpbHRlcigodiwgaSkgPT4gbmVpZ2hib3Job29kcy5pbmRleE9mKHYpID09IGkpO1xuICAgICAgICByZXNvbHZlKHVuaXF1ZU5laWdoYm9yaG9vZHMpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggYWxsIGN1aXNpbmVzIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxuICAgKi9cbiAgc3RhdGljIGZldGNoQ3Vpc2luZXMoKSB7XG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKCkudGhlbihyZXN0YXVyYW50cyA9PiB7XG4gICAgICAgIHJlc3RhdXJhbnRzID0gcmVzdGF1cmFudHMucmVzdGF1cmFudHM7XG4gICAgICAgIC8vIEdldCBhbGwgY3Vpc2luZXMgZnJvbSBhbGwgcmVzdGF1cmFudHNcbiAgICAgICAgY29uc3QgY3Vpc2luZXMgPSByZXN0YXVyYW50cy5tYXAoKHYsIGkpID0+IHJlc3RhdXJhbnRzW2ldLmN1aXNpbmVfdHlwZSk7XG4gICAgICAgIC8vIFJlbW92ZSBkdXBsaWNhdGVzIGZyb20gY3Vpc2luZXNcbiAgICAgICAgY29uc3QgdW5pcXVlQ3Vpc2luZXMgPSBjdWlzaW5lcy5maWx0ZXIoKHYsIGkpID0+IGN1aXNpbmVzLmluZGV4T2YodikgPT0gaSk7XG4gICAgICAgIHJlc29sdmUodW5pcXVlQ3Vpc2luZXMpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVzdGF1cmFudCBwYWdlIFVSTC5cbiAgICovXG4gIHN0YXRpYyB1cmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpIHtcbiAgICByZXR1cm4gKGAuL3Jlc3RhdXJhbnQvP2lkPSR7cmVzdGF1cmFudC5pZH1gKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXN0YXVyYW50IGltYWdlIFVSTC5cbiAgICovXG4gIHN0YXRpYyBpbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCkge1xuICAgIHJldHVybiAoYC9pbWcvJHtyZXN0YXVyYW50LnBob3RvZ3JhcGh9YCk7XG4gIH1cblxuICAvKipcbiAgICogTWFwIG1hcmtlciBmb3IgYSByZXN0YXVyYW50LlxuICAgKi9cbiAgc3RhdGljIG1hcE1hcmtlckZvclJlc3RhdXJhbnQocmVzdGF1cmFudCkge1xuICAgIC8vIGh0dHBzOi8vbGVhZmxldGpzLmNvbS9yZWZlcmVuY2UtMS4zLjAuaHRtbCNtYXJrZXJcbiAgICBjb25zdCBtYXJrZXIgPSBuZXcgTC5tYXJrZXIoW3Jlc3RhdXJhbnQubGF0bG5nLmxhdCwgcmVzdGF1cmFudC5sYXRsbmcubG5nXSxcbiAgICAgIHt0aXRsZTogcmVzdGF1cmFudC5uYW1lLFxuICAgICAgYWx0OiByZXN0YXVyYW50Lm5hbWUsXG4gICAgICB1cmw6IERCSGVscGVyLnVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCksXG4gICAgICBrZXlib2FyZDogZmFsc2VcbiAgICAgIH1cbiAgICApO1xuICAgICAgbWFya2VyLmFkZFRvKG1hcE1vZGVsLm5ld01hcCk7XG4gICAgcmV0dXJuIG1hcmtlcjtcbiAgfVxuICAvKiBzdGF0aWMgbWFwTWFya2VyRm9yUmVzdGF1cmFudChyZXN0YXVyYW50LCBtYXApIHtcbiAgICBjb25zdCBtYXJrZXIgPSBuZXcgZ29vZ2xlLm1hcHMuTWFya2VyKHtcbiAgICAgIHBvc2l0aW9uOiByZXN0YXVyYW50LmxhdGxuZyxcbiAgICAgIHRpdGxlOiByZXN0YXVyYW50Lm5hbWUsXG4gICAgICB1cmw6IERCSGVscGVyLnVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCksXG4gICAgICBtYXA6IG1hcCxcbiAgICAgIGFuaW1hdGlvbjogZ29vZ2xlLm1hcHMuQW5pbWF0aW9uLkRST1B9XG4gICAgKTtcbiAgICByZXR1cm4gbWFya2VyO1xuICB9ICovXG5cbn1cbiIsIi8qXHJcbiAqIERldGFpbHMgcGFnZSBjb250cm9sbGVyXHJcbiAqL1xyXG5cclxuY29uc3QgZGV0YWlsc0NvbnRyb2xsZXIgPSB7XHJcbiAgaW5pdCgpIHtcclxuICAgIHJlc3RhdXJhbnRNb2RlbC5pbml0KCkudGhlbihyZXN0YXVyYW50ID0+IHtcclxuICAgICAgYnJlYWRjcnVtYlZpZXcucmVuZGVyKHJlc3RhdXJhbnQpO1xyXG4gICAgICByZXN0YXVyYW50Vmlldy5yZW5kZXIocmVzdGF1cmFudCk7XHJcbiAgICAgIG1hcE1vZGVsLmluaXQoW3Jlc3RhdXJhbnQubGF0bG5nLmxhdCwgcmVzdGF1cmFudC5sYXRsbmcubG5nXSwgMTYpO1xyXG4gICAgICBtYXBNb2RlbC5hZGRNYXJrZXIocmVzdGF1cmFudCk7XHJcbiAgICAgIHdpbmRvdy5zY3JvbGxUbygwLCAwKTtcclxuICAgIH0pO1xyXG4gIH1cclxufTsiLCIvKlxyXG4gKiBGaWx0ZXIgU2VsZWN0aW9uXHJcbiAqL1xyXG5cclxuY29uc3QgZmlsdGVyTW9kZWwgPSB7XHJcbiAgLy8gU3RvcmVzIHVzZXIgc2VsZWN0aW9uLiBJbml0aWFsaXplcyB3aXRoIGRlZmF1bHQgZGF0YS5cclxuICBzZWxlY3Rpb246IHtcclxuICAgIGN1aXNpbmU6ICdhbGwnLFxyXG4gICAgbmVpZ2hib3Job29kOiAnYWxsJ1xyXG4gIH0sXHJcblxyXG4gIGluaXQoKSB7XHJcbiAgICAvLyBSZXR1cm4gYSBwcm9taXNlIHdoZW4gYWxsIGRhdGEgaXMgZmV0Y2hlZCBzdWNlc3NmdWxseVxyXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKFtcclxuICAgICAgdGhpcy5mZXRjaE5laWdoYm9yaG9vZHMoKSxcclxuICAgICAgdGhpcy5mZXRjaEN1aXNpbmVzKClcclxuICAgIF0pO1xyXG4gIH0sXHJcblxyXG4gIGZldGNoTmVpZ2hib3Job29kcygpIHtcclxuICAgIC8vIEdldCBkYXRhIGZyb20gdGhlIERCXHJcbiAgICByZXR1cm4gREJIZWxwZXIuZmV0Y2hOZWlnaGJvcmhvb2RzKCkudGhlbihuZWlnaGJvcmhvb2RzID0+IHtcclxuICAgICAgdGhpcy5uZWlnaGJvcmhvb2RzID0gbmVpZ2hib3Job29kcztcclxuICAgIH0pO1xyXG4gIH0sXHJcblxyXG4gIGZldGNoQ3Vpc2luZXMoKSB7XHJcbiAgICAvLyBHZXQgZGF0YSBmcm9tIHRoZSBEQlxyXG4gICAgcmV0dXJuIERCSGVscGVyLmZldGNoQ3Vpc2luZXMoKS50aGVuKGN1aXNpbmVzID0+IHtcclxuICAgICAgdGhpcy5jdWlzaW5lcyA9IGN1aXNpbmVzO1xyXG4gICAgfSk7XHJcbiAgfSxcclxuXHJcbiAgLy8gR2V0dGVyIG1ldGhvZCBmZXRjaGVkIGRhdGEuXHJcbiAgZ2V0RGF0YSgpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIG5laWdoYm9yaG9vZHM6IHRoaXMubmVpZ2hib3Job29kcyxcclxuICAgICAgY3Vpc2luZXM6IHRoaXMuY3Vpc2luZXNcclxuICAgIH07XHJcbiAgfSxcclxuXHJcbiAgdXBkYXRlU2VsZWN0aW9uKHNlbGVjdGlvbikge1xyXG4gICAgdGhpcy5zZWxlY3Rpb24gPSBzZWxlY3Rpb247XHJcbiAgfSxcclxuXHJcbiAgZ2V0U2VsZWN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuc2VsZWN0aW9uO1xyXG4gIH1cclxufTtcclxuXHJcbmNvbnN0IGZpbHRlclZpZXcgPSB7XHJcbiAgaW5pdCgpIHtcclxuICAgIC8vIEJpbmQgZWxlbWVudHNcclxuICAgIHRoaXMubmVpZ2hib3Job29kc0VsID1kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmVpZ2hib3Job29kcy1zZWxlY3QnKTtcclxuICAgIHRoaXMuY3Vpc2luZXNFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjdWlzaW5lcy1zZWxlY3QnKTtcclxuICAgIC8vIFJlbmRlciB3aXRoIHRoZSBkYXRhIGZyb20gdGhlIGNvbnRyb2xsZXJcclxuICAgIHRoaXMucmVuZGVyKGNvbnRyb2xsZXIuZ2V0RmlsdGVyRGF0YSgpKTtcclxuXHJcbiAgICAvLyBMaXN0ZW4gZm9yIGNoYW5nZXMgaW4gZmlsdGVyIHNlbGVjdGlvblxyXG4gICAgW3RoaXMubmVpZ2hib3Job29kc0VsLCB0aGlzLmN1aXNpbmVzRWxdLmZvckVhY2goKGVsKSA9PiB7XHJcbiAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGNvbnRyb2xsZXIudXBkYXRlUmVzdGF1cmFudHMpO1xyXG4gICAgfSk7XHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyKGRhdGEpIHtcclxuICAgIC8vIFJlbmRlciBuZWlnaGJvcmhvb2RzXHJcbiAgICBkYXRhLm5laWdoYm9yaG9vZHMuZm9yRWFjaChuZWlnaGJvcmhvb2QgPT4ge1xyXG4gICAgICBjb25zdCBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcclxuICAgICAgb3B0aW9uLmlubmVySFRNTCA9IG5laWdoYm9yaG9vZDtcclxuICAgICAgb3B0aW9uLnZhbHVlID0gbmVpZ2hib3Job29kO1xyXG4gICAgICB0aGlzLm5laWdoYm9yaG9vZHNFbC5hcHBlbmQob3B0aW9uKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFJlbmRlciBjdWlzaW5lc1xyXG4gICAgZGF0YS5jdWlzaW5lcy5mb3JFYWNoKGN1aXNpbmUgPT4ge1xyXG4gICAgICBjb25zdCBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcclxuICAgICAgb3B0aW9uLmlubmVySFRNTCA9IGN1aXNpbmU7XHJcbiAgICAgIG9wdGlvbi52YWx1ZSA9IGN1aXNpbmU7XHJcbiAgICAgIHRoaXMuY3Vpc2luZXNFbC5hcHBlbmQob3B0aW9uKTtcclxuICAgIH0pO1xyXG4gIH0sXHJcblxyXG4gIC8vIFJldHJpZXZlIGFuZCByZXR1cm4gdXNlciBzZWxlY3Rpb25cclxuICBnZXRTZWxlY3Rpb24oKSB7XHJcbiAgICBjb25zdCBjSW5kZXggPSB0aGlzLmN1aXNpbmVzRWwuc2VsZWN0ZWRJbmRleDtcclxuICAgIGNvbnN0IG5JbmRleCA9IHRoaXMubmVpZ2hib3Job29kc0VsLnNlbGVjdGVkSW5kZXg7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgY3Vpc2luZTogdGhpcy5jdWlzaW5lc0VsW2NJbmRleF0udmFsdWUsXHJcbiAgICAgIG5laWdoYm9yaG9vZDogdGhpcy5uZWlnaGJvcmhvb2RzRWxbbkluZGV4XS52YWx1ZVxyXG4gICAgfTtcclxuICB9XHJcbn07XHJcbiIsIi8qXHJcbiAqIEluZGV4IHBhZ2UgY29udHJvbGxlclxyXG4gKi9cclxuXHJcbmNvbnN0IGNvbnRyb2xsZXIgPSB7XHJcbiAgLy8gU2V0IGV2ZXJ5dGhpbmcgdXAgYW5kIHJlbmRlci5cclxuICBpbml0KCkge1xyXG4gICAgZmlsdGVyTW9kZWwuaW5pdCgpLnRoZW4oKCkgPT4gZmlsdGVyVmlldy5pbml0KCkpO1xyXG4gICAgcmVzdGF1cmFudHNNb2RlbC5pbml0KCkudGhlbigoKSA9PiByZXN0YXVyYW50c1ZpZXcuaW5pdCgpKTtcclxuICAgIG1hcE1vZGVsLmluaXQoWzQwLjcyMjIxNiwgLTczLjk4NzUwMV0sIDExKTtcclxuICAgIGJyZWFkY3J1bWJWaWV3LnJlc2V0KCk7XHJcbiAgICB3aW5kb3cuc2Nyb2xsVG8oMCwgMCk7XHJcbiAgfSxcclxuXHJcbiAgLy8gR2V0dGVyIG1ldGhvZHNcclxuICBnZXRGaWx0ZXJEYXRhKCkge1xyXG4gICAgcmV0dXJuIGZpbHRlck1vZGVsLmdldERhdGEoKTtcclxuICB9LFxyXG5cclxuICBnZXRGaWx0ZXJTZWxlY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gZmlsdGVyTW9kZWwuZ2V0U2VsZWN0aW9uKCk7XHJcbiAgfSxcclxuXHJcbiAgZ2V0UmVzdGF1cmFudHMoKSB7XHJcbiAgICByZXR1cm4gcmVzdGF1cmFudHNNb2RlbC5nZXRSZXN0YXVyYW50cygpO1xyXG4gIH0sXHJcblxyXG4gIC8vIFRoaXMgaXMgY2FsbGVkIG9uIHVzZXIgc2VsZWN0aW9uIGNoYW5nZVxyXG4gIHVwZGF0ZVJlc3RhdXJhbnRzKCkge1xyXG4gICAgZmlsdGVyTW9kZWwudXBkYXRlU2VsZWN0aW9uKGZpbHRlclZpZXcuZ2V0U2VsZWN0aW9uKCkpO1xyXG4gICAgY29udHJvbGxlci5yZXNldFJlc3RhdXJhbnRzKCk7XHJcbiAgfSxcclxuXHJcbiAgcmVzZXRSZXN0YXVyYW50cygpIHtcclxuICAgIHJlc3RhdXJhbnRzTW9kZWwuaW5pdCgpLnRoZW4oKCkgPT4gcmVzdGF1cmFudHNWaWV3LnJlbmRlcihcclxuICAgICAgY29udHJvbGxlci5nZXRSZXN0YXVyYW50cygpKVxyXG4gICAgKTtcclxuICB9LFxyXG5cclxuICAvLyBUcmlnZ2VycyBtYXAgcmVzZXRzLlxyXG4gIHNldE1hcmtlcnMocmVzdGF1cmFudHMpIHtcclxuICAgIG1hcE1vZGVsLmFkZE1hcmtlcnMocmVzdGF1cmFudHMpO1xyXG4gIH1cclxufTsiLCIvKlxyXG4gKiA8bWFpbj4gY29udHJvbGxlclxyXG4gKi9cclxuXHJcbmNvbnN0IG1haW5Db250cm9sbGVyID0ge1xyXG4gIHNldFN0YXRlKHN0YXRlKSB7XHJcbiAgICB0aGlzLnN0YXRlID0gc3RhdGU7XHJcbiAgICBtYWluVmlldy5yZW5kZXIoc3RhdGUpO1xyXG4gIH0sXHJcblxyXG4gIGdldFN0YXRlKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuc3RhdGU7XHJcbiAgfVxyXG59O1xyXG5cclxuLypcclxuICogPG1haW4+IHZpZXdcclxuICovXHJcblxyXG5jb25zdCBtYWluVmlldyA9IHtcclxuICAvLyA8bWFpbj4gZWxlbWVudCB0byBob29rIGludG9cclxuICBlbDogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignbWFpbicpLFxyXG4gIC8vIEFsbCB0ZW1wbGF0ZXNcclxuICB0ZW1wbGF0ZXM6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy50ZW1wbGF0ZScpLFxyXG5cclxuICAvLyBNYXBzIHN0YXRlcyB0byB0ZW1wbGF0ZXNcclxuICAvLyBSZXR1cm5zIGEgdGV4dC90ZW1wbGF0ZSBlbGVtZW50XHJcbiAgZ2V0VGVtcGxhdGUoc3RhdGUpIHtcclxuICAgIGxldCB0ZW1wbGF0ZTtcclxuICAgIHRoaXMudGVtcGxhdGVzLmZvckVhY2gobiA9PiB7XHJcbiAgICAgIGlmIChuLmlkID09PSBzdGF0ZSkgdGVtcGxhdGUgPSBuO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gdGVtcGxhdGU7XHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyKHN0YXRlKSB7XHJcbiAgICAvLyBBZGQgJ2luc2lkZScgY2xhc3MgdG8gYm9keSBpZiB3ZSBhcmUgb24gZGV0YWlscyBwYWdlXHJcbiAgICBpZiAoJ2RldGFpbHMnID09PSBzdGF0ZSkge1xyXG4gICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ2luc2lkZScpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCdpbnNpZGUnKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBJbnNlcnQgdGVtcGxhdGUgaW50byBwYWdlXHJcbiAgICB0aGlzLmVsLmlubmVySFRNTCA9IHRoaXMuZ2V0VGVtcGxhdGUoc3RhdGUpLmlubmVySFRNTDtcclxuXHJcbiAgICAvLyBQcm9jZWVkIHdpdGggc3Vidmlld3NcclxuICAgIHN3aXRjaCAoc3RhdGUpIHtcclxuICAgIGNhc2UgJ2luZGV4JzpcclxuICAgICAgY29udHJvbGxlci5pbml0KCk7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSAnZGV0YWlscyc6XHJcbiAgICAgIGRldGFpbHNDb250cm9sbGVyLmluaXQoKTtcclxuICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgfVxyXG59O1xyXG5cclxuXHJcbmNvbnN0IGJyZWFkY3J1bWJWaWV3ID0ge1xyXG4gIGVsOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnJlYWRjcnVtYicpLFxyXG5cclxuICByZW5kZXIocmVzdGF1cmFudCkge1xyXG4gICAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xyXG4gICAgbGkuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5uYW1lO1xyXG4gICAgdGhpcy5lbC5hcHBlbmRDaGlsZChsaSk7XHJcbiAgfSxcclxuXHJcbiAgcmVzZXQoKSB7XHJcbiAgICB0aGlzLmVsLmlubmVySFRNTCA9ICc8bGk+PGEgaHJlZj1cIi9cIiB0YWJpbmRleD1cIjBcIj5Ib21lPC9hPjwvbGk+JztcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0IGEgcGFyYW1ldGVyIGJ5IG5hbWUgZnJvbSBwYWdlIFVSTC5cclxuICovXHJcbmNvbnN0IGdldFBhcmFtZXRlckJ5TmFtZSA9IChuYW1lLCB1cmwpID0+IHtcclxuICBpZiAoIXVybClcclxuICAgIHVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xyXG4gIHVybCA9IG5ldyBVUkwodXJsKTtcclxuICByZXR1cm4gbmV3IFVSTFNlYXJjaFBhcmFtcyh1cmwuc2VhcmNoKS5nZXQoJ2lkJyk7XHJcbn07IiwiLypcclxuICogTWFwXHJcbiAqL1xyXG5cclxuY29uc3QgbWFwTW9kZWwgPSB7XHJcbiAgbWFya2VyczogW10sXHJcblxyXG4gIC8vIE1hcGJveCBpbml0XHJcbiAgaW5pdChjZW50ZXIsIHpvb20pIHtcclxuICAgIHRoaXMubmV3TWFwID0gTC5tYXAoJ21hcCcsIHtcclxuICAgICAgY2VudGVyOiBjZW50ZXIsXHJcbiAgICAgIHpvb206IHpvb20sXHJcbiAgICAgIHNjcm9sbFdoZWVsWm9vbTogZmFsc2UsXHJcbiAgICAgIGtleWJvYXJkOiBmYWxzZVxyXG4gICAgfSk7XHJcbiAgICBMLnRpbGVMYXllcignaHR0cHM6Ly9hcGkudGlsZXMubWFwYm94LmNvbS92NC97aWR9L3t6fS97eH0ve3l9LmpwZzcwP2FjY2Vzc190b2tlbj17bWFwYm94VG9rZW59Jywge1xyXG4gICAgICBtYXBib3hUb2tlbjogJ3BrLmV5SjFJam9pZW5sdFpYUm9JaXdpWVNJNkltTnFhbkIxY3pBeU56SnJZblV6Y1cwd2FUTjVhV0ZrYTJvaWZRLm5RN3FPb0xKcG5BdlhubVJJNzBfZFEnLFxyXG4gICAgICBtYXhab29tOiAxOCxcclxuICAgICAgYXR0cmlidXRpb246ICdNYXAgZGF0YSAmY29weTsgPGEgaHJlZj1cImh0dHBzOi8vd3d3Lm9wZW5zdHJlZXRtYXAub3JnL1wiPk9wZW5TdHJlZXRNYXA8L2E+IGNvbnRyaWJ1dG9ycywgJyArXHJcbiAgICAgICAgJzxhIGhyZWY9XCJodHRwczovL2NyZWF0aXZlY29tbW9ucy5vcmcvbGljZW5zZXMvYnktc2EvMi4wL1wiPkNDLUJZLVNBPC9hPiwgJyArXHJcbiAgICAgICAgJ0ltYWdlcnkgwqkgPGEgaHJlZj1cImh0dHBzOi8vd3d3Lm1hcGJveC5jb20vXCI+TWFwYm94PC9hPicsXHJcbiAgICAgIGlkOiAnbWFwYm94LnN0cmVldHMnXHJcbiAgICB9KS5hZGRUbyh0aGlzLm5ld01hcCk7XHJcbiAgfSxcclxuXHJcbiAgLy8gUmVzZXRzIG1hcCBtYXJrZXJzXHJcbiAgYWRkTWFya2VycyhyZXN0YXVyYW50cykge1xyXG4gICAgdGhpcy5yZXNldE1hcmtlcnMoKTtcclxuXHJcbiAgICByZXN0YXVyYW50cy5mb3JFYWNoKHJlc3RhdXJhbnQgPT4ge1xyXG4gICAgICAvLyBBZGQgbWFya2VyIHRvIHRoZSBtYXBcclxuICAgICAgY29uc3QgbWFya2VyID0gREJIZWxwZXIubWFwTWFya2VyRm9yUmVzdGF1cmFudChyZXN0YXVyYW50LCB0aGlzLm5ld01hcCk7XHJcbiAgICAgIG1hcmtlci5vbignY2xpY2snLCBvbkNsaWNrKTtcclxuICAgICAgZnVuY3Rpb24gb25DbGljaygpIHtcclxuICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IG1hcmtlci5vcHRpb25zLnVybDtcclxuICAgICAgfVxyXG4gICAgICB0aGlzLm1hcmtlcnMucHVzaChtYXJrZXIpO1xyXG4gICAgfSk7XHJcbiAgfSxcclxuXHJcbiAgLy8gQWRkIHNpbmdsZSBtYXJrZXJcclxuICBhZGRNYXJrZXIocmVzdGF1cmFudCkge1xyXG4gICAgREJIZWxwZXIubWFwTWFya2VyRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KTtcclxuICB9LFxyXG5cclxuICByZXNldE1hcmtlcnMoKSB7XHJcbiAgICBpZiAodGhpcy5tYXJrZXJzKSB7XHJcbiAgICAgIHRoaXMubWFya2Vycy5mb3JFYWNoKG1hcmtlciA9PiBtYXJrZXIucmVtb3ZlKCkpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5tYXJrZXJzID0gW107XHJcbiAgfVxyXG59OyIsImNvbnN0IHJlc3RhdXJhbnRNb2RlbCA9IHtcclxuICBpbml0KCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZmV0Y2hGcm9tVVJMKCk7XHJcbiAgfSxcclxuXHJcbiAgZmV0Y2hGcm9tVVJMKCkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgY29uc3QgaWQgPSBnZXRQYXJhbWV0ZXJCeU5hbWUoJ2lkJyk7XHJcbiAgICAgIGlmICh0aGlzLnJlc3RhdXJhbnQgJiYgdGhpcy5yZXN0YXVyYW50LmlkID09PSBpZCkgeyAvLyByZXN0YXVyYW50IGFscmVhZHkgZmV0Y2hlZCFcclxuICAgICAgICByZXNvbHZlKHRoaXMucmVzdGF1cmFudCk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCFpZCkgeyAvLyBubyBpZCBmb3VuZCBpbiBVUkxcclxuICAgICAgICByZWplY3QoJ05vIHJlc3RhdXJhbnQgaWQgaW4gVVJMJyk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50QnlJZChpZCkudGhlbihyZXN0YXVyYW50ID0+IHtcclxuICAgICAgICAgIHRoaXMucmVzdGF1cmFudCA9IHJlc3RhdXJhbnQ7XHJcbiAgICAgICAgICBpZiAoIXJlc3RhdXJhbnQpIHtcclxuICAgICAgICAgICAgcmVqZWN0KGBObyByZXN0YXVyYW50IHdpdGggaWQgJHtpZH0gZm91bmQuYCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAvLyBmaWxsUmVzdGF1cmFudEhUTUwoKTtcclxuICAgICAgICAgIHJlc29sdmUocmVzdGF1cmFudCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbmNvbnN0IHJlc3RhdXJhbnRWaWV3ID0ge1xyXG4gIHJlbmRlcihyZXN0YXVyYW50KSB7XHJcbiAgICBjb25zdCBuYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtbmFtZScpO1xyXG4gICAgbmFtZS5pbm5lckhUTUwgPSByZXN0YXVyYW50Lm5hbWU7XHJcblxyXG4gICAgY29uc3QgYWRkcmVzcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LWFkZHJlc3MnKTtcclxuICAgIGFkZHJlc3MuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5hZGRyZXNzO1xyXG5cclxuICAgIGNvbnN0IGltYWdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtaW1nJyk7XHJcbiAgICBpbWFnZS5jbGFzc05hbWUgPSAncmVzdGF1cmFudC1pbWcnO1xyXG4gICAgaW1hZ2Uuc3JjID0gREJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpO1xyXG4gICAgaW1hZ2UuYWx0ID0gYEFuIGltYWdlIG9mICR7cmVzdGF1cmFudC5uYW1lfWA7XHJcblxyXG4gICAgY29uc3QgY3Vpc2luZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LWN1aXNpbmUnKTtcclxuICAgIGN1aXNpbmUuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5jdWlzaW5lX3R5cGU7XHJcblxyXG4gICAgLy8gZmlsbCBvcGVyYXRpbmcgaG91cnNcclxuICAgIGlmIChyZXN0YXVyYW50Lm9wZXJhdGluZ19ob3Vycykge1xyXG4gICAgICB0aGlzLnJlbmRlckhvdXJzKHJlc3RhdXJhbnQub3BlcmF0aW5nX2hvdXJzKTtcclxuICAgIH1cclxuICAgIC8vIGZpbGwgcmV2aWV3c1xyXG4gICAgdGhpcy5yZW5kZXJSZXZpZXdzKHJlc3RhdXJhbnQucmV2aWV3cyk7XHJcbiAgfSxcclxuXHJcbiAgcmVuZGVySG91cnMob3BlcmF0aW5nSG91cnMpIHtcclxuICAgIGNvbnN0IGhvdXJzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtaG91cnMnKTtcclxuICAgIGZvciAobGV0IGtleSBpbiBvcGVyYXRpbmdIb3Vycykge1xyXG4gICAgICBjb25zdCByb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0cicpO1xyXG5cclxuICAgICAgY29uc3QgZGF5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcclxuICAgICAgZGF5LmlubmVySFRNTCA9IGtleTtcclxuICAgICAgcm93LmFwcGVuZENoaWxkKGRheSk7XHJcblxyXG4gICAgICBjb25zdCB0aW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcclxuICAgICAgdGltZS5pbm5lckhUTUwgPSBvcGVyYXRpbmdIb3Vyc1trZXldO1xyXG4gICAgICByb3cuYXBwZW5kQ2hpbGQodGltZSk7XHJcblxyXG4gICAgICBob3Vycy5hcHBlbmRDaGlsZChyb3cpO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIHJlbmRlclJldmlld3MocmV2aWV3cykge1xyXG4gICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jldmlld3MtY29udGFpbmVyJyk7XHJcbiAgICBjb25zdCB0aXRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2gyJyk7XHJcbiAgICB0aXRsZS5pbm5lckhUTUwgPSAnUmV2aWV3cyc7XHJcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodGl0bGUpO1xyXG5cclxuICAgIGlmICghcmV2aWV3cykge1xyXG4gICAgICBjb25zdCBub1Jldmlld3MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XHJcbiAgICAgIG5vUmV2aWV3cy5pbm5lckhUTUwgPSAnTm8gcmV2aWV3cyB5ZXQhJztcclxuICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKG5vUmV2aWV3cyk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGNvbnN0IHVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jldmlld3MtbGlzdCcpO1xyXG4gICAgcmV2aWV3cy5mb3JFYWNoKHJldmlldyA9PiB7XHJcbiAgICAgIHVsLmFwcGVuZENoaWxkKHRoaXMuY3JlYXRlUmV2aWV3SFRNTChyZXZpZXcpKTtcclxuICAgIH0pO1xyXG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHVsKTtcclxuICB9LFxyXG5cclxuICBjcmVhdGVSZXZpZXdIVE1MKHJldmlldykge1xyXG4gICAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xyXG4gICAgY29uc3QgbmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcclxuICAgIG5hbWUuaW5uZXJIVE1MID0gcmV2aWV3Lm5hbWU7XHJcbiAgICBsaS5hcHBlbmRDaGlsZChuYW1lKTtcclxuXHJcbiAgICBjb25zdCBkYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xyXG4gICAgZGF0ZS5pbm5lckhUTUwgPSByZXZpZXcuZGF0ZTtcclxuICAgIGxpLmFwcGVuZENoaWxkKGRhdGUpO1xyXG5cclxuICAgIGNvbnN0IHJhdGluZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcclxuICAgIHJhdGluZy5pbm5lckhUTUwgPSBgUmF0aW5nOiAke3Jldmlldy5yYXRpbmd9YDtcclxuICAgIGxpLmFwcGVuZENoaWxkKHJhdGluZyk7XHJcblxyXG4gICAgY29uc3QgY29tbWVudHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XHJcbiAgICBjb21tZW50cy5pbm5lckhUTUwgPSByZXZpZXcuY29tbWVudHM7XHJcbiAgICBsaS5hcHBlbmRDaGlsZChjb21tZW50cyk7XHJcblxyXG4gICAgcmV0dXJuIGxpO1xyXG4gIH1cclxuXHJcbn07XHJcbiIsIi8qXHJcbiAqIFJlc3RhdXJhbnRzIGxpc3RcclxuICovXHJcblxyXG5jb25zdCByZXN0YXVyYW50c01vZGVsID0ge1xyXG4gIGluaXQoKSB7XHJcbiAgICBjb25zdCBzZWwgPSBjb250cm9sbGVyLmdldEZpbHRlclNlbGVjdGlvbigpO1xyXG4gICAgcmV0dXJuIHRoaXMuZmV0Y2hSZXN0YXVyYW50cyhzZWwuY3Vpc2luZSwgc2VsLm5laWdoYm9yaG9vZCk7XHJcbiAgfSxcclxuXHJcbiAgLy8gR2V0IGRhdGEgZnJvbSB0aGUgREJcclxuICBmZXRjaFJlc3RhdXJhbnRzKGN1aXNpbmUsIG5laWdoYm9yaG9vZCkge1xyXG4gICAgcmV0dXJuIERCSGVscGVyLmZldGNoUmVzdGF1cmFudEJ5Q3Vpc2luZUFuZE5laWdoYm9yaG9vZChjdWlzaW5lLCBuZWlnaGJvcmhvb2QpLnRoZW4ocmVzdGF1cmFudHMgPT4ge1xyXG4gICAgICB0aGlzLnJlc3RhdXJhbnRzID0gcmVzdGF1cmFudHM7XHJcbiAgICB9KTtcclxuICB9LFxyXG5cclxuICAvLyBHZXR0ZXIgbWV0aG9kIGZvcm0gdGhpcy5yZXN0YXVyYW50c1xyXG4gIGdldFJlc3RhdXJhbnRzKCkge1xyXG4gICAgcmV0dXJuIHRoaXMucmVzdGF1cmFudHM7XHJcbiAgfVxyXG59O1xyXG5cclxuY29uc3QgcmVzdGF1cmFudHNWaWV3ID0ge1xyXG4gIGluaXQoKSB7XHJcbiAgICAvLyBCaW5kIGVsZW1lbnRcclxuICAgIHRoaXMuZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudHMtbGlzdCcpO1xyXG5cclxuICAgIHRoaXMucmVuZGVyKGNvbnRyb2xsZXIuZ2V0UmVzdGF1cmFudHMoKSk7XHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyKHJlc3RhdXJhbnRzKSB7XHJcbiAgICB0aGlzLmVsLmlubmVySFRNTCA9ICcnO1xyXG5cclxuICAgIC8vIE1hcCBzZXR1cFxyXG4gICAgY29udHJvbGxlci5zZXRNYXJrZXJzKHJlc3RhdXJhbnRzKTtcclxuXHJcbiAgICByZXN0YXVyYW50cy5mb3JFYWNoKHJlc3RhdXJhbnQgPT4ge1xyXG4gICAgICB0aGlzLmVsLmFwcGVuZCh0aGlzLmNyZWF0ZUhUTUwocmVzdGF1cmFudCkpO1xyXG4gICAgfSk7XHJcbiAgfSxcclxuXHJcbiAgY3JlYXRlSFRNTChyZXN0YXVyYW50KSB7XHJcbiAgICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XHJcblxyXG4gICAgY29uc3QgaW1hZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcclxuICAgIGltYWdlLmNsYXNzTmFtZSA9ICdyZXN0YXVyYW50LWltZyc7XHJcbiAgICBpbWFnZS5zcmMgPSBEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCk7XHJcbiAgICBpbWFnZS5hbHQgPSBgQW4gaW1hZ2Ugb2YgJHtyZXN0YXVyYW50Lm5hbWV9YDtcclxuICAgIGxpLmFwcGVuZChpbWFnZSk7XHJcblxyXG4gICAgLy8gVGl0bGUgaXMgYSBsaW5rIHRvIGRldGFpbHMgcGFnZVxyXG4gICAgLy8gUmVtb3ZlZCAnVmlldyBkZXRhaWxzJyBmb3IgYWNjZXNzaWJpbGl0eSByZWFzb25zXHJcbiAgICBjb25zdCBtb3JlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xyXG4gICAgbW9yZS5ocmVmID0gREJIZWxwZXIudXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KTtcclxuICAgIG1vcmUuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5uYW1lO1xyXG4gICAgbW9yZS50YWJJbmRleCA9IDA7XHJcblxyXG4gICAgY29uc3QgbmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2gzJyk7XHJcbiAgICBuYW1lLmFwcGVuZChtb3JlKTtcclxuICAgIGxpLmFwcGVuZChuYW1lKTtcclxuXHJcbiAgICBjb25zdCBuZWlnaGJvcmhvb2QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XHJcbiAgICBuZWlnaGJvcmhvb2QuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5uZWlnaGJvcmhvb2Q7XHJcbiAgICBsaS5hcHBlbmQobmVpZ2hib3Job29kKTtcclxuXHJcbiAgICBjb25zdCBhZGRyZXNzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xyXG4gICAgYWRkcmVzcy5pbm5lckhUTUwgPSByZXN0YXVyYW50LmFkZHJlc3M7XHJcbiAgICBsaS5hcHBlbmQoYWRkcmVzcyk7XHJcblxyXG4gICAgcmV0dXJuIGxpO1xyXG4gIH0sXHJcbn07XHJcbiIsIi8qXHJcbiAqIE1haW4gcm91dGVyIG9iamVjdFxyXG4gKi9cclxuY29uc3Qgcm91dGVyID0ge1xyXG4gIC8vIG1hcHMgcm91dGVzIHRvIHN0YXRlc1xyXG4gIHJvdXRlczoge1xyXG4gICAgJy8nOiAnaW5kZXgnLFxyXG4gICAgJy9yZXN0YXVyYW50Lyc6ICdkZXRhaWxzJ1xyXG4gIH0sXHJcblxyXG4gIGluaXQoKSB7XHJcbiAgICAvLyBMb2FkIHRoZSBwYWdlXHJcbiAgICB0aGlzLm5hdmlnYXRlKGxvY2F0aW9uLmhyZWYpO1xyXG5cclxuICAgIC8vIExpc3RlbiBmb3IgY2xpY2tzIG9uIGxpbmtzLiBFeGNsdWRlIGJvb2ttYXJrIGxpbmtzXHJcbiAgICBkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcclxuICAgICAgaWYgKGUudGFyZ2V0Lm5vZGVOYW1lID09PSAnQScgJiZcclxuICAgICAgICAgIGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnaHJlZicpLmNoYXJBdCgwKSAhPT0gJyMnKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIHRoaXMubmF2aWdhdGUoZS50YXJnZXQuaHJlZik7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgLy8gTWFuYWdlIGJhY2sgYW5kIGZvcndhcmQgYnV0dG9uc1xyXG4gICAgd2luZG93Lm9ucG9wc3RhdGUgPSAoKSA9PiB7XHJcbiAgICAgIHRoaXMubmF2aWdhdGUobG9jYXRpb24uaHJlZik7XHJcbiAgICB9O1xyXG4gICAgLy8gUmVnaXN0ZXIgU2VydmljZSBXb3JrZXJcclxuICAgIGlmICghbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIpIHJldHVybjtcclxuICAgIG5hdmlnYXRvci5zZXJ2aWNlV29ya2VyLnJlZ2lzdGVyKCcvc3cuanMnLCB7XHJcbiAgICAgIHNjb3BlOiAnLydcclxuICAgIH0pO1xyXG4gIH0sXHJcblxyXG5cclxuXHJcbiAgLy8gQHBhcmFtIHVybCBzdHJpbmdcclxuICBuYXZpZ2F0ZSh1cmwpIHtcclxuICAgIGlmIChuZXcgVVJMKHVybCkub3JpZ2luID09PSBsb2NhdGlvbi5vcmlnaW4pIHtcclxuICAgICAgaWYgKHVybCAhPT0gbG9jYXRpb24uaHJlZikge1xyXG4gICAgICAgIGhpc3RvcnkucHVzaFN0YXRlKG51bGwsIG51bGwsIHVybCk7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5jaGFuZ2VTdGF0ZSh1cmwpO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGNoYW5nZVN0YXRlKHVybCkge1xyXG4gICAgbWFpbkNvbnRyb2xsZXIuc2V0U3RhdGUoXHJcbiAgICAgIHRoaXMucm91dGVzW25ldyBVUkwodXJsKS5wYXRobmFtZV1cclxuICAgICk7XHJcbiAgfVxyXG59O1xyXG5cclxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IHJvdXRlci5pbml0KCkpOyJdfQ==
