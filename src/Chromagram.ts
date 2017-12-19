import {Constants} from './Constants';

export class Chromagram {
  private chromaData: Array<number[]>;

  constructor(hops: number) {
    this.chromaData =  [];
    for (let i = 0; i < hops; i++) {
      this.chromaData.push(Constants.fillArray(Constants.BANDS));
    }
  }

  getMagnitude(hop: number, band: number): number {
    if (hop >= this.getHops()) {
      throw new Error('Cannot get magnitude of out-of-bounds hop (' + hop + '/' + this.getHops() + ')');
    }
    if (band >= Constants.BANDS) {
      throw new Error('Cannot get magnitude of out-of-bounds band (' + band + '/' + Constants.BANDS + ')');
    }
    return this.chromaData[hop][band];
  }

  setMagnitude(hop: number, band: number, value: number): void {
    if (hop >= this.getHops()) {
      throw new Error('Cannot set magnitude of out-of-bounds hop (' + hop + '/' + this.getHops() + ')');
    }
    if (band >= Constants.BANDS) {
      throw  new Error('Cannot set magnitude of out-of-bounds band (' + band + '/' + Constants.BANDS + ')');
    }
    if (!isFinite(value)) {
      throw new Error('Cannot set magnitude to NaN');
    }
    this.chromaData[hop][band] = value;
  }

  collapseToOneHop(): number[] {
    const oneHop: number[] = Constants.fillArray(Constants.BANDS);
    for (let h = 0; h < this.getHops(); h++) {
      for (let b = 0; b < Constants.BANDS; b++) {
        oneHop[b] += this.getMagnitude(h, b) / this.getHops();
      }
    }
    return oneHop;
  }

  append(that: Chromagram): void {
    this.chromaData = this.chromaData.concat(that.chromaData);
  }

  getHops(): number {
    return this.chromaData.length;
  }
}
