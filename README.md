# vue-h-router

### Introduction

`vue-h-router` is the small router for [Vue.js](http://vuejs.org). It deeply integrates with Vue.js core to make building Single Page Applications with Vue.js a breeze. Features include:

- Modular, component-based router configuration
- Route params
- Hash mode navigation
- HTML5 history support
- Route hooks

### Setup

``` bash
npm install vue-h-router
```

### Example

``` javascript
import Vue from 'vue';
import router from 'vue-h-router';
import LoginView from './views/login';
import HomeView from './views/home';


Vue.use(router);


const user = {
  auth: false;
};
const checkAuth = () => {
  return user.auth ? Promise.resolve() : Promise.reject();
};
const checkNotAuth = () => {
  return !user.auth ? Promise.resolve() : Promise.reject();
};
const app = new Vue({
  template: `
    <div class="main">
      <component :is="$route.component"/>
    </div>
  `,
  router,
  el: '#app'
});

router.init([
  {
    url: '/login',
    component: LoginView,
    before: checkNotAuth
  },
  {
    url: '/home',
    component: HomeView,
    before: checkAuth
  },
  {
    url: '.*',
    redirect() {
      return user.auth ? `/home` : '/login';
    }
  }
]);
```



## License

[MIT](http://opensource.org/licenses/MIT)
