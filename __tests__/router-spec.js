import Vue from 'vue/dist/vue.min';
import router from '../index';


class Helper {
  constructor() {
    this._callback = () => {};
    window.addEventListener('hashchange', () => this._callback());
  }

  goTo(url) {
    return new Promise(resolve => {
      this._callback = resolve;
      location.hash = url;
    });
  }
}
const helper = new Helper();
const smallTimeout = 10;
const bigTimeout = 100;
const wait = timeout => new Promise(resolve => setTimeout(resolve, timeout));


describe('router', () => {
  it('defined', () => {
    expect(router.install).toBeDefined();
    expect(router.init).toBeDefined();
    expect(router.route).toBeDefined();

    Vue.use(router);

    const app = new Vue({
      template: '<div></div>'
    });

    expect(app.$router).toBeDefined();
    expect(app.$route).toBeDefined();

    expect(app.$route).toBe(router.route);

    expect(app.$route.url).toBeDefined();
    expect(app.$route.args).toBeDefined();
    expect(app.$route.component).toBeDefined();
  });

  it('init', done => {
    const routes = [
      {
        url: '/init/home',
        component: {
          template: '<div></div>'
        }
      },
      {
        url: '/init/about',
        component: {
          template: '<span></span>'
        }
      }
    ];

    helper.goTo('/init/about')
      .then(() => {
        expect(router.route.url).toEqual('/init/about');
        expect(router.route.component).toEqual(null);
        return helper.goTo('/init/home');
      })
      .then(() => {
        expect(router.route.url).toEqual('/init/home');
        expect(router.route.component).toEqual(null);
        router.init(routes);
        expect(router.route.component.template).toEqual(routes[0].component.template);

        return helper.goTo('/init/about');
      })
      .then(() => {
        expect(router.route.url).toEqual('/init/about');
        expect(router.route.component.template).toEqual(routes[1].component.template);
        router.init([]);
        expect(router.route.component).toEqual(null);
      })
      .then(done)
      .catch(done.fail);
  });

  describe('routes', () => {
    it('url', done => {
      const routes = [
        {
          url: '/routes/url/home',
          component: {
            template: '<div></div>'
          }
        },
        {
          url: /^\/routes\/url\/about$/,
          component: {
            template: '<span></span>'
          }
        }
      ];

      router.init(routes);

      helper.goTo('/routes/url/about')
        .then(() => {
          expect(router.route.url).toEqual('/routes/url/about');
          expect(router.route.component.template).toEqual(routes[1].component.template);
          return helper.goTo('/routes/url/home');
        })
        .then(() => {
          expect(router.route.url).toEqual('/routes/url/home');
          expect(router.route.component.template).toEqual(routes[0].component.template);
        })
        .then(done)
        .catch(done.fail);
    });

    it('args', done => {
      const routes = [
        {
          url: '/routes/args/user/(\\d+)',
          component: {
            template: '<div></div>'
          }
        },
        {
          url: /^\/routes\/args\/department\/(\d+)\?option=(\w+)$/,
          component: {
            template: '<span></span>'
          }
        }
      ];

      router.init(routes);

      helper.goTo('/routes/args/user/11')
        .then(() => {
          expect(router.route.args.length).toBe(1);
          expect(router.route.args[0]).toEqual('11');
          return helper.goTo('/routes/args/department/456?option=showAll');
        })
        .then(() => {
          expect(router.route.args.length).toBe(2);
          expect(router.route.args[0]).toEqual('456');
          expect(router.route.args[1]).toEqual('showAll');
        })
        .then(done)
        .catch(done.fail);
    });

    it('redirect', done => {
      const routes = [
        {
          url: '/routes/redirect/user',
          redirect: '/routes/redirect/person'
        },
        {
          url: '/routes/redirect/person',
          component: {}
        },
        {
          url: '/routes/redirect/department',
          redirect() {
            return Promise.resolve('/routes/redirect/it');
          }
        },
        {
          url: '/routes/redirect/it',
          component: {}
        },
        {
          url: '/routes/redirect/some',
          redirect() {
            return Promise.reject();
          }
        }
      ];

      router.init(routes);

      helper.goTo('/routes/redirect/user')
        .then(() => {
          expect(router.route.url).toEqual('/routes/redirect/person');
          return helper.goTo('/routes/redirect/department');
        })
        .then(() => wait(smallTimeout))
        .then(() => {
          expect(router.route.url).toEqual('/routes/redirect/it');
          return helper.goTo('/routes/redirect/some');
        })
        .then(() => wait(bigTimeout))
        .then(() => {
          expect(router.route.url).toEqual('/routes/redirect/it');
        })
        .then(done)
        .catch(done.fail);
    });

    it('before', done => {
      const routes = [
        {
          url: '/routes/before/user/.+',
          before() {
            return Promise.reject();
          }
        },
        {
          url: '/routes/before/user/12',
          component: {
            template: '<div>User 12</div>'
          }
        },
        {
          url: '/routes/before/user/(\\d+)',
          component: {
            template: '<div>User with timeout > 100</div>'
          },
          before(newRoute) {
            return Number(newRoute.args[0]) > bigTimeout ? Promise.resolve() : Promise.reject();
          }
        },
        {
          url: '/routes/before/.*',
          component: {
            template: '<div>Default route</div>'
          }
        }
      ];

      router.init(routes);

      helper.goTo('/routes/before/user/12')
        .then(() => wait(smallTimeout))
        .then(() => {
          expect(router.route.component.template).toEqual(routes[1].component.template);
          return helper.goTo('/routes/before/user/13');
        })
        .then(() => wait(smallTimeout))
        .then(() => {
          expect(router.route.component.template).toEqual(routes[3].component.template);
          return helper.goTo('/routes/before/user/123');
        })
        .then(() => wait(smallTimeout))
        .then(() => {
          expect(router.route.component.template).toEqual(routes[2].component.template);
        })
        .then(done)
        .catch(done.fail);
    });

    it('after', done => {
      const url1 = '/routes/after/home/123';
      const url2 = '/routes/after/user/smith';
      const routes = [
        {
          url: '/routes/after/home/(.*)',
          component: {
            template: '<div>Home</div>'
          }
        },
        {
          url: '/routes/after/user/(\\w+)',
          component: {
            template: '<div>User</div>'
          },
          after(oldRoute, newRoute) {
            expect(oldRoute.url).toEqual(url1);
            expect(oldRoute.args[0]).toEqual('123');
            expect(oldRoute.component.template).toEqual(routes[0].component.template);
            expect(newRoute).toBe(router.route);
            expect(newRoute.url).toEqual(url2);
            expect(newRoute.args[0]).toEqual('smith');
            expect(newRoute.component.template).toEqual(routes[1].component.template);
          }
        }
      ];

      router.init(routes);

      helper.goTo(url1)
        .then(() => helper.goTo(url2))
        .then(done)
        .catch(done.fail);
    });
  });
});
