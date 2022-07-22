import Dep from "./dep.js"

// 进行数据劫持，即能够对数据对象的所有属性进行监听，如有变动可拿到最新值并通知订阅者
export default class Observer {
  constructor(data) {
    //数据转存
    this.data = data;
    // 遍历对象完成所有数据的劫持
    this.walk(this.data);
  }

  /**
   * 遍历对象
   * @param {*} data 
   */
  walk(data){
    if(!data || typeof data !== 'object'){ // 递归结束条件
      return;
    }
    //进行数据劫持
    Object.keys(data).forEach(key => {
      this.defineReactive(data, key, data[key]);
    });
  }

  /**
   * 动态设置响应式数据。new Vue的时候，会把vue的data属性进行递归，用Object.defineProperty()方法把这些属性全部转成set、get方法。
   * 当data中的某个属性被访问时，则会调用get方法，当data中的属性被改变时，则会调用set方法。
   * @param {*} data 
   * @param {*} key 
   * @param {*} value 
   */
  defineReactive(data, key, value) {
    let dep = new Dep();// 对data中的每一个属性定义该属性自身的dep
    Object.defineProperty(data, key, {
      //可遍历
      enumerable: true,
      // 不可再配置
      configurable: false,
      // getter 当读取对象此属性值时自动调用, 将函数返回的值作为属性值
      get: () => {
        // 在get方法中添加watcher对象到该dep上
        // 如果是通过watcher触发的get方法就进行watcher存储到该dep上
        // 将当前数据的dep对象当作参数传过去
        Dep.target && dep.addSub(Dep.target);
        return value;
      },
      // setter 当修改了对象的当前属性值时自动调用, 监视当前属性值的变化, 修改相关的属性
      set: newValue => {
        if(newValue !== value){
          //页面操作对数据进行修改
          value = newValue;
          // 当数据变动时通知自身的dep，触发View页面的变化
          dep.notify();
        }
      }
    })
    this.walk(value)//为了完成递归遍历，监测更深层次的数据

  }
}