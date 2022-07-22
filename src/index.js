
//引入编解析器和观察者
import Observer from "./observer.js";
import Compiler from "./compiler.js";


//新建Vue类
export default class Vue {
    //options是用new Vue()创建实例时传入的参数
  constructor(options) {
    // 获取dom对象
    this.$el = document.querySelector(options.el);

    // 转存数据
    this.$data = options.data || {};

    // 数据代理 为了让程序员直接获取属性和方法，比如：vm.data.msg => vm.msg
    this._proxyData(this.$data);
    this._proxyMethods(options.methods);

    // 数据劫持
    new Observer(this.$data);

    // 模板编译
    new Compiler(this);
  }

  /**
   * 数据的代理
   * @param {*} data 
   */
  _proxyData(data) {
    //使用Object.defineProperty()方法直接在对象上定义一个新属性，或者修改对象的现有属性，并返回此对象
    //使得外界可以直接访问data内的数据，而不用再麻烦的使用如data.massage进行获取
    Object.keys(data).forEach(key => {
      //实现数据代理
      Object.defineProperty(this, key, {
        set(newValue) {
          data[key] = newValue;
        },
        get() {
          return data[key];
        }
      })
    });
  }

  /**
  * 函数的代理
  * @param {*} methods 
  */
  _proxyMethods(methods) {
    if (methods && typeof methods === 'object') {
      Object.keys(methods).forEach(key => {
        this[key] = methods[key];
      });
    }
  }
}
//将Vue挂载在window上
window.Vue = Vue;