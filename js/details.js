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