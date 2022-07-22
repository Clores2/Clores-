

import Dep from "./dep.js";

//Watcher观察者主要作用是接收自身Dep的通知后执行update()函数去更新视图
let $uid = 0;
export default class Watcher {
  constructor(exp, vm, callback) {
    this.exp = exp;// 记录传过来的表达式
    this.vm = vm;// 实例对象
    this.callback = callback;//当表达式所对应的数据发生改变的回调函数
    this.uid = $uid++;// 每次实例化Watcher的时候就使id+1
    this.update();
  }
  /**
   * 计算表达式
   */
  get() {
    Dep.target = this; //在watcher初始化的时候保存实例到Dep的target上
    let newValue = Watcher.computeExpression(this.exp, this.vm);//获取当前对应表达式的数据
    Dep.target = null;// 发布者记录了该订阅者之后，就清空Dep.target。不设置为null的话每次获取数据就会一直往对应的dep中加入watcher（这时的watcher看此时Dep的target的指向），数据更改后就会执行该dep中的所有watcher的update()
    return newValue;
  }

  /**
   * 完成回调函数的调用
   */
  update() {
    // 在data中获取修改后的值
    let newValue = this.get();
    // 回调，更新视图
    this.callback && this.callback(newValue);
  }

  /**
     * @description: 计算表达式
     * @param {*} exp
     * @param {*} vm
     * @return {*}
     */ 
  static computeExpression(exp, vm) {
    // 创建函数
    // 把vm当作作用域
    // 函数内部使用with来指定作用域，即函数体就是return vm.exp
    // 执行函数, 得到当前表达式的值
    let fn = new Function('vm', "with(vm){return " + exp + "}");
    return fn(vm);
  }
}

