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
