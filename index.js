module.exports = {
  routes: [],

  route: {
    url: '',
    args: [],
    component: {}
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
    this.parse(location.hash);
  },

  parse(url, routes = this.routes) {
    const path = url.replace(/^[^#]*#/, '');
    const route = routes.find(route => route.url.test(path));

    if (route) {
      const newRoute = {
        url: path,
        args: [...route.url.exec(path).slice(1)],
        component: route.component
      };

      if (route.redirect) {
        if (typeof route.redirect === 'function') {
          if (route.redirect instanceof Promise) {
            route.redirect(newRoute)
              .then(url => this.redirect(url))
              .catch(e => {
                console.error(e);
                history.back();
              });
          } else {
            this.redirect(route.redirect(newRoute));
          }
        } else {
          this.redirect(route.redirect);
        }
      } else if (route.before) {
        route.before(newRoute)
          .then(() => this.setRoute(newRoute, route))
          .catch(() => this.parse(url, routes.slice(routes.indexOf(route) + 1)));
      } else {
        this.setRoute(newRoute, route);
      }
    } else {
      this.setRoute({
        url: path,
        args: [],
        component: {}
      });
    }
  },

  setRoute(route, _route) {
    const oldRoute = this.route;
    this.app._route = this.route = route;
    if (_route && typeof _route.after === 'function') {
      _route.after(oldRoute, route);
    }
  },

  install(Vue) {
    const start = app => {
      this.app = app;
      window.addEventListener('hashchange', e => this.parse(e.newURL));
    };

    Object.defineProperty(Vue.prototype, '$router', {
      get() {
        return this.$root._router;
      }
    });
    Object.defineProperty(Vue.prototype, '$route', {
      get() {
        return this.$root._route;
      }
    });

    Vue.mixin({
      beforeCreate() {
        if (this.$options.router) {
          this._router = this.$options.router;
          Vue.util.defineReactive(this, '_route', this._router.route);
          start(this);
        }
      }
    });
  }
};
