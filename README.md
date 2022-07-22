# **项目标题：MVVM 简易框架**

## **项目说明**

<br/>

&emsp;&emsp;这是一款仿照 Vue 写的简易版 MVVM 框架。使用了数据代理、数据劫持和发布-订阅模式来实现简单的单向绑定和双向绑定。

![项目结构图](https://flowus.cn/preview/082a53ec-dbd8-44a5-9403-0db99a82f528)

---
<br/>

### **数据代理**

<br/>

&emsp;&emsp;使用 Object.defineProperty()方法直接在 MVVM 实例对象上定义一个新属性，或者修改对象的现有属性，并返回此对象，使得外界可以直接访问 data 内的数据，如想要访问 data 对象的 massage 属性时，不用再麻烦的使用 data.massage 进行获取，而是直接使用 massage 获得。

<br/>

1.数据的代理：

<br/>

```JavaScript
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
```
<br/>
2.函数的代理：

</br>

```JavaScript
_proxyMethods(methods) {
    if (methods && typeof methods === 'object') {
      Object.keys(methods).forEach(key => {
        this[key] = methods[key];
      });
    }
  }
}
```

---
<br/>

### **数据劫持**
<br/>

#### **1.Observer**
<br/>

&emsp;&emsp;Observer 类实现数据劫持，即能够对数据对象的所有属性进行监听，如有变动可拿到最新值并通知订阅者。

&emsp;&emsp;Observer 在拿到代理后的数据后，对数据进行转存，而后对数据进行递归遍历，检测更深层的数据，并完成所有数据的劫持，直到数据为空或者数据不再是一个对象时，说明数据已经是最深层次了，递归结束。

```JavaScript
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
```

&emsp;&emsp;数据劫持通过自定义函数 defineReactive 实现。首先对于 data 中的每一个属性定义该属性自身的依赖收集器（dep），再使用 Object.defineProperty()方法把这些属性全部转成 set、get 方法。当 data 中的某个属性被访问时，则会调用 get 方法，当 data 中的属性被改变时，则会调用 set 方法。

&emsp;&emsp;当调用 get 方法时，如果是通过 watcher（订阅者）触发的 get 方法就进行 watcher 存储到该属性的 dep 上，将当前数据的 dep 对象当作参数传过去；当调用 set 方法时，如果属性的新值不同于旧值，说明数据发生了变动，修改相关属性的值并通知自身的 dep，触发 View 页面的变化

```JavaScript
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
```
<br/>

#### **2.Dep**
<br/>
&emsp;&emsp;Dep 是依赖收集器，它的的作用是收集订阅者以及当数据发生变动时通知订阅者去更新。

&emsp;&emsp;每一个属性都有自身的 dep，接着添加 watcher（watcher 指的是订阅者，dep 和 watcher 是多对多的关系，即一个 dep 可以有多个 watcher，而一个 watcher 也可以有多个 dep）。在每次数据变动时(即 set)，通知自身的 dep，dep 通知其中 watcher 去完成视图更新

&emsp;&emsp;在 Dep 类中设置 subs 属性存放所有 watcher，设置 addSub 方法收集订阅者，当通过 watcher 触发 Observer 的 get 方法时调用，在添加订阅者时，以添加的订阅者的 id 为 key，值为订阅者本身，每个订阅者具有唯一 id，避免重复添加。再设置 notify 方法，当数据发生改变时，调用该方法，通知每个订阅者去更新（调用 watcher 里的 update 方法）

```JavaScript
export default class Dep{
    constructor(){
        // 存放所有watcher
        this.subs = {};
    }

    // 收集订阅者
    addSub(target){
        //添加订阅者：以添加的订阅者的id为属性，值为订阅者本身，每个订阅者具有唯一id，避免重复添加
        this.subs[target.uid]=target;
    }

    // 通知每个订阅者去更新
    notify(){
        for(let uid in this.subs){
            // 通知更新
            this.subs[uid].update();
        }
    }
}
```
<br/>

#### **3.Watcher**
<br/>
&emsp;&emsp;Watcher 作为连接 Observer 和 Compiler（模板编译器）的桥梁，能够订阅并收到每个属性变动的通知，执行指令绑定的相应回调函数，从而更新视图。

&emsp;&emsp;Watcher 类接收由 Compiler 传过来的三个参数：表达式，实例对象和当表达式所对应的数据发生改变的回调函数，并且为每一个 watcher 实例定义一个唯一的 id。

```JavaScript
let $uid = 0;
export default class Watcher {
  constructor(exp, vm, callback) {
    this.exp = exp;// 记录传过来的表达式
    this.vm = vm;// 实例对象
    this.callback = callback;//当表达式所对应的数据发生改变的回调函数
    this.uid = $uid++;// 每次实例化Watcher的时候就使id+1
    this.update();
  }
```

&emsp;&emsp;当 Dep 接收到数据变化的通知后，watcher 就执行 update()函数去更新视图。update（）函数通过 get（）方法从 data 中获取修改的数据，然后调用回调函数，并将修改后的数据传参给回调函数，从而完成 View 视图的修改。

```JavaScript
/**
   * 完成回调函数的调用
   */
  update() {
    // 在data中获取修改后的值
    let newValue = this.get();
    // 回调，更新视图
    this.callback && this.callback(newValue);
  }

```

&emsp;&emsp;get（）方法在 watcher 初始化的时候将当前的 watcher 实例节点保存到 Dep 的 target 上，从而加入到 dep 的订阅者名单中，  在 dep 记录了该订阅者之后，就清空 Dep.target，将 Dep.target 设置为 null。不设置为 null 的话每次获取数据就会一直往对应的 dep 中加入 watcher（这时的 watcher 看此时 Dep 的 target 的指向），数据更改后就会执行该 dep 中的所有 watcher 的 update()。

&emsp;&emsp;同时通过 Watcher 类的静态函数 computeExpression（）获取当前对应表达式的数据。

```JavaScript
/**
   * 计算表达式
   */
  get() {
    Dep.target = this; //在watcher初始化的时候保存实例到Dep的target上
    let newValue = Watcher.computeExpression(this.exp, this.vm);//获取当前对应表达式的数据
    Dep.target = null;// 发布者记录了该订阅者之后，就清空Dep.target。不设置为null的话每次获取数据就会一直往对应的dep中加入watcher（这时的watcher看此时Dep的target的指向），数据更改后就会执行该dep中的所有watcher的update()
    return newValue;
  }
```

&emsp;&emsp;computeExpression（）创建了一个新的函数，新函数以实例 vm 为作用域，函数内部使用 with 来指定作用域，最终的函数体就是 return vm.exp，执行函数就能够得到当前表达式的值

```JavaScript
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
```

---
<br/>

### **模板编译（Compiler）**
<br/>
&emsp;&emsp;Compiler 是模板编译器，对每个元素节点的指令进行扫描和解析，根据指令模板替换数据，以及绑定相应的更新函数

&emsp;&emsp;把原始的 dom 转换成文档片段，通过文档片段来进行复杂的节点操作或创建时，可以避免大量的重绘回流，由此来提高整个页面的性能。

```JavaScript
export default class Compiler {
  constructor(vm) {
    this.$el = vm.$el;
    this.vm = vm;//保存实例对象
    if (this.$el) {
      // 把原始的dom转成文档片段
      this.$fragment = this.nodeToFragment(this.$el);

      // 编译模板
      this.compiler(this.$fragment);

      // 把文档片段添加到页面中
      this.$el.appendChild(this.$fragment);
    }
  }


  /**
   * 把所有元素转成文档片段，通过文档片段来进行复杂的节点操作或创建时，可以避免大量的重绘回流，由此来提高整个页面的性能
   * @param {*} node
   */
  nodeToFragment(node) {
    //创建fragment
    let fragment = document.createDocumentFragment();
    //判断是否存在子节点
    if (node.childNodes && node.childNodes.length) {
      node.childNodes.forEach(child => {
        // 判断是否是需要添加的节点
        // 如果是注释节点或者无用的换行则不添加
        if (!this.ignorable(child)) {
          fragment.appendChild(child);//添加为fragment子节点
        }
      });
    }
    return fragment;
  }

  /**
   * 忽略哪些节点不添加
   * @param {*} node
   */
  ignorable(node) {
    const reg = /^[\t\n\r]+/;
    return (
      // 当nodeType为8时，说明是注释，当nodeType为3时并且符合正则表达式，说明是空格或者换行符
      node.nodeType === 8 || (node.nodeType === 3 && reg.test(node.textContent))
    );
  }

```

&emsp;&emsp;将元素转换成文档片段之后对其进行编译。文档片段包含元素节点和文本节点，分别对其进行编译操作，并进行递归操作。

```JavaScript
/**
   * 模板编译
   * @param {*} node
   */
  compiler(node) {
    if (node.childNodes && node.childNodes.length) {
        node.childNodes.forEach(child => {
            if (child.nodeType === 1) {
                // 当nodeType为1时，说明是元素节点
                this.compilerElementNode(child);
             } else if (child.nodeType === 3) {
                // 当nodeType为3时，说明是文本节点
                this.compilerTextNode(child)
                }
        })
    }
  }
```
<br/>

#### **1.编译元素节点**
<br/>
&emsp;&emsp;对于元素节点来说，对 v-model，v-text 和 v-bind 和事件指令进行绑定。如果是 v-text，就将表达式的值当作该元素的文本节点的值展示；如果是 v-bind，就将表达式的值传入到其所在的位置，实现属性绑定；如果是 v-model，一方面将 input 的 value 赋值给 data 中相应的属性，实现 View→Model 的更改，另一方面，将刚刚更改的数据赋值给节点的 value，完成视图（View）的更新，从而实现双向绑定。如果是事件指令，则调用 compilerMethods（）函数对其进行编译。

```JavaScript
  /**
   * 编译元素节点
   * @param {*} node
   */
  compilerElementNode(node) {
    let that = this;
    let attrs = [...node.attributes];
    attrs.forEach(attr => {
      let { name: attrName, value: attrValue } = attr;
      //判断是否为一般指令
      if (attrName.indexOf('v-') === 0) {
        let dirName = attrName.slice(2);
        switch (true) {
          case dirName==='text':
            new Watcher(attrValue, this.vm, newValue => {
              node.textContent = newValue;
            })
            break;
          //设置v-model双向绑定
          case dirName==='model':
            new Watcher(attrValue, this.vm, newValue => {
              node.value = newValue;
            });
            node.addEventListener('input', e => {
              that.vm[attrValue] = e.target.value;
            });
            break;
          //设置v-bind属性绑定
          case /^bind.*/g.test(dirName):
            new Watcher(attrValue, this.vm, newValue => {
              node.setAttribute(attrName,newValue);

            });
            break;
        }
      }
      //判断是否为事件指令
      if(attrName.indexOf('@') === 0){
        this.compilerMethods(this.vm, node, attrName, attrValue);
      }
    })
    this.compiler(node);// 递归
  }
```

&emsp;&emsp;事件指令以特殊的@作为标识，当判断为是事件指令之后去掉@，获取事件类型，使用 addEventListener（）函数进行事件的绑定，通过 bind（）函数将事件的 this 指向当前节点。


```JavaScript
/**
   * 函数编译
   * @param {*} scope
   * @param {*} node
   * @param {*} attrName
   * @param {*} attrValue
   */
  compilerMethods(scope, node, attrName, attrValue){
     // 去掉@符，获取事件类型
    let type = attrName.slice(1);
    let fn = scope[attrValue];
    node.addEventListener(type, fn.bind(scope));
  }
```
<br/>

#### **2.编译文本节点**
<br/>
&emsp;&emsp;编译文本节点主要部分是对插值表达式进行计算。通过正则表达式匹配获取插值表达式中的值，并区分非插值表达式的文本，分别将它们以文本和表达式的方式保存在数组中，最后将其连接成为字符串即可得到文本节点的值。

```JavaScript
/**
   * 编译文本节点
   * @param {*} node
   */
  compilerTextNode(node) {
    //去掉文本两边的空格，获取文本节点中的文本
    let text = node.textContent.trim();
    if (text) {
      // 把text字符串，转换为表达式
      let exp = this.parseText(text);

      //添加订阅者，计算表达式的值
      // 当表达式依赖的值发生变化时
      // 1.重新计算表达式的值
      // 2.给node.textContent赋值最新的值
      // 即可完成Model => View 的响应式
      new Watcher(exp, this.vm, newValue => {
        node.textContent = newValue;
      })
    }
  }

  /**
   * 完成文本向表达式的转化
   * @param {*} text
   */
  parseText(text) {
    // 匹配插值表达式正则
    const regText = /\{\{(.+?)\}\}/g;
    // 分割插值表达式前后内容
    let pices = text.split(regText);
    // 匹配插值表达式
    let matches = text.match(regText);
    // 表达式数组
    let tokens = [];
    pices.forEach(item => {
      if (matches && matches.indexOf("{{" + item + "}}") > -1) {
        tokens.push("(" + item + ")");
      } else {
        tokens.push("'" + item + "'");
      }
    });
    return tokens.join('+');
  }
}
```
