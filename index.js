module.exports = {
  routes: [],

  route: {
    url: '',
    args: [],
    component: null
  },

  init(routes) {
    this.routes = routes.map(route => {
      route.url = typeof route.url === 'string' ? new RegExp(`^${route.url}$`) : route.url;
      return route;
    });

    this.parse(location.hash);
  },

  redirect(url) {
    history.replaceState({}, '', `#${url}`);
    this.parse(url);
  },

  parse(url, routes = this.routes) {
    const path = url.replace(/^[^#]*#/, '');
    const route = routes.find(route => route.url.test(path));

    if (route) {
      const newRoute = {
        url: path,
        args: route.url
          .exec(path)
          .slice(1)
          .filter(arg => arg),
        component: route.component
      };

      if (route.redirect) {
        if (typeof route.redirect === 'function') {
          route.redirect(newRoute)
            .then(url => this.redirect(url))
            .catch(() => history.back());
        } else {
          this.redirect(route.redirect);
        }
      } else if (route.before) {
        route.before(newRoute)
          .then(() => this.setRoute(newRoute, route.after))
          .catch(() => this.parse(url, routes.slice(routes.indexOf(route) + 1)));
      } else {
        this.setRoute(newRoute, route.after);
      }
    } else {
      this.setRoute({
        url: path,
        args: [],
        component: null
      });
    }
  },

  setRoute(route, after) {
    const oldRoute = this.route;
    this.route = route;
    if (typeof after === 'function') {
      after(oldRoute, route);
    }
  },

  install(Vue) {
    Object.defineProperty(Vue.prototype, '$router', {get: () => this});
    Object.defineProperty(Vue.prototype, '$route', {get: () => this.route});

    Vue.util.defineReactive(this, 'route', this.route);

    window.addEventListener('hashchange', e => this.parse(e.newURL));
  }
};
