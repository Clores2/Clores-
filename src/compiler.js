import Watcher from "./watcher.js";

// 进行模板编译
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
      // 当nodeType为8时，说明是注释
      node.nodeType === 8 || (node.nodeType === 3 && reg.test(node.textContent))
    );
  }

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

  /**
   * 函数编译
   * @param {*} scope 
   * @param {*} node 
   * @param {*} attrName 属性名称
   * @param {*} attrValue 属性值
   */
  compilerMethods(scope, node, attrName, attrValue){
     // 去掉@符，获取事件类型
    let type = attrName.slice(1);
    let fn = scope[attrValue];
    node.addEventListener(type, fn.bind(scope));
  }

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