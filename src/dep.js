//Dep是依赖收集器，它的的作用是收集订阅者以及当数据发生变动时通知订阅者去更新
//每一个属性都有自身的dep，接着添加watcher，在每次数据变动时(即set)，通知自身的dep，dep通知其中watcher去完成视图更新
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