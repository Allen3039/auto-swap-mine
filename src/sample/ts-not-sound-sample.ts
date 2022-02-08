interface A {
  x: number;
}

let a: A = {x: 3}
let b: {x: number | string} = a;
b.x = "unsound";
let x: number = a.x; // 不健全

a.x.toFixed(0); // 这啥？


// sound的意思是:代码永远不会在编译或运行阶段出现与预期类型不匹配的错误