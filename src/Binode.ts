export class Binode {
  data: number;
  l: Binode;
  r: Binode;

  constructor(x: number = 0) {
    this.data = x;
    this.l = null;
    this.r = null;
  }
}
