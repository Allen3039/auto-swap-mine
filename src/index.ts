enum EnumableCellState {
  "BOMB" = -3,
  "UNKNOWN" = -2,
  "MINE",
  "NO-MINE",
}

type CellState = EnumableCellState & number;

type MineState = CellState[][];

enum BtnAction {
  "LeftClick",
  "RightClick",
}

type MineAction = {
  x: number;
  y: number;
  btnAction: BtnAction;
};

const sleep = (ms: number) => {
  return new Promise((res) => {
    setTimeout(res, ms);
  });
};
const  MineColumns = 16;
// 核心扫雷逻辑
class Core {
  // 当前的矩阵是怎么样的，当没有更多操作时，返回空数组
  next(state: MineState): MineAction[] {
    console.log("currentState", state);
    const length = state.length;
    const action: MineAction[] = [];
    let hasBomb = false;
    // 初始种子点击
    if (state[0][0] === EnumableCellState.UNKNOWN) {
      action.push({
        x: 0,
        y: 0,
        btnAction: BtnAction.LeftClick,
      });
      return action;
    }
    const actionXY: string[] = [];

    // 先使用两个基础扫雷法，如果使用完毕还么有新的action 那么就执行高级算法
    // 基础算法
    let aroundCoords: { x: number; y: number }[] = [];
    let aroundMineCounts = 0;
    let aroundUnknownCounts = 0;
    let aroundCell = null;

    for (let row = 0; row < length; row++) {
      for (let col = 0; col < length; col++) {
        const element = state[row][col];
        if (element === EnumableCellState.BOMB) {
          hasBomb = true;
        }
        if (element > 0) {
          aroundMineCounts = 0;
          aroundUnknownCounts = 0;
          aroundCell = null;
          // look around
          aroundCoords = this.getAroundCoords({
            x: col,
            y: row,
            maxX: length - 1,
            maxY: length - 1,
          });
          console.log(
            "🚀 ~ file: index.ts ~ line 56 ~ Core ~ next ~ aroundCoords",
            aroundCoords
          );
          aroundCoords.forEach(({ x, y }) => {
            aroundCell = state[y][x];
            if (aroundCell === EnumableCellState.MINE) {
              aroundMineCounts++;
            } else if (aroundCell === EnumableCellState.UNKNOWN) {
              aroundUnknownCounts++;
            }
          });
          // 基础1 周围的雷已经都标记了
          if (element === aroundMineCounts) {
            aroundCoords.forEach(({ x, y }) => {
              aroundCell = state[y][x];
              if (aroundCell === EnumableCellState.UNKNOWN) {
                if (actionXY.includes(`${x},${y}`)) {
                  return;
                }
                actionXY.push(`${x},${y}`);
                action.push({
                  x,
                  y,
                  btnAction: BtnAction.LeftClick,
                });
              }
            });
          }
          // 基础2

          if (element === aroundUnknownCounts + aroundMineCounts) {
            aroundCoords.forEach(({ x, y }) => {
              aroundCell = state[y][x];
              if (aroundCell === EnumableCellState.UNKNOWN) {
                if (actionXY.includes(`${x},${y}`)) {
                  return;
                }
                actionXY.push(`${x},${y}`);
                action.push({
                  x,
                  y,
                  btnAction: BtnAction.RightClick,
                });
              }
            });
          }
        }
      }
    }

    // TODO:高级算法 判断包含关系的数字标识

    // 如果有炸弹 就不玩了
    if (hasBomb) {
      console.log("不玩了");
      return [];
    }

    return action;
  }

  getAroundCoords({
    x,
    y,
    maxX,
    maxY,
  }: {
    x: number;
    y: number;
    maxX: number;
    maxY: number;
  }): { x: number; y: number }[] {
    const aroundCoords = [];
    const left = x - 1;
    const right = x + 1;
    const top = y - 1;
    const bottom = y + 1;
    for (const targetX of [left, x, right]) {
      if (targetX >= 0 && targetX <= maxX) {
        for (const targetY of [top, y, bottom]) {
          if (targetY >= 0 && targetY <= maxY) {
            if (y !== targetY || x !== targetX) {
              aroundCoords.push({
                x: targetX,
                y: targetY,
              });
            }
          }
        }
      }
    }
    return aroundCoords;
  }
}

class UIOperator {
  container: HTMLDivElement;
  mineColumns: number = 0;
  constructor() {
    this.container = document.getElementsByClassName(
      "sweep"
    )[0] as HTMLDivElement;
  }

  public see() {
    const mineColumns = MineColumns;
    this.mineColumns = mineColumns;
    const mineFlatMine: CellState[] = [...this.container.children].map(
      (child) => {
        const classList = child.classList;
        if (classList.contains("no-mine")) {
          if (child.innerHTML !== "") {
            return +child.innerHTML;
          }
          return EnumableCellState["NO-MINE"];
        }
        if (classList.contains("flag")) {
          return EnumableCellState.MINE;
        }
        if (classList.contains("bomb")) {
          return EnumableCellState.BOMB;
        }
        return EnumableCellState.UNKNOWN;
      }
    );
    let tmpCols = 0;
    const result = [];
    while (tmpCols < mineColumns) {
      result.push(
        mineFlatMine.slice(tmpCols * mineColumns, (tmpCols + 1) * mineColumns)
      );
      tmpCols += 1;
    }
    return result;
  }

  async do(actions: MineAction[]) {
    console.log("action", actions);
    for (const action of actions) {
      await this.click({
        x: action.x,
        y: action.y,
        mouseType: action.btnAction === BtnAction.LeftClick ? "left" : "right",
      });
    }
  }

  private async click({
    x,
    y,
    mouseType,
  }: {
    x: number;
    y: number;
    mouseType: "right" | "left";
  }) {
    console.log(mouseType === "left" ? "左击" : "右击", { x, y });
    const targetIdx = x + y * this.mineColumns;

    await sleep(200);
    this.container.children[targetIdx].dispatchEvent(
      new MouseEvent("mousedown", { button: mouseType === "left" ? 0 : 2 })
    );
  }
}

class Main {
  run() {
    const uiOperator = new UIOperator();
    const coreIns = new Core();
    async function play() {
      const nextOPList = coreIns.next(uiOperator.see());
      await uiOperator.do(nextOPList);
      if (nextOPList.length) {
        play();
      }
    }
    play();
  }
}

new Main().run();
