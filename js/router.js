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

    // Listen for clicks on links
    document.body.addEventListener('click', (e) => {
      if (e.target.nodeName === 'A') {
        e.preventDefault();
        this.navigate(e.target.href);
      }
    });
  },



  // @param url string
  navigate(url) {
    if (new URL(url).origin === location.origin) {
      history.pushState(null, null, url);
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