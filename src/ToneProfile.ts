import {Constants} from './Constants';
import {Binode} from './Binode';

export class ToneProfile {
  tonics: Binode[] = [];

  constructor(customProfile: number[]) {

    if (customProfile.length !== Constants.BANDS) {
      throw new Error('Tone profile must have 72 elements');
    }

    for (let o = 0; o < Constants.OCTAVES; o++) {
      let tonic: Binode = new Binode(customProfile[o * Constants.SEMITONES]);
      let q: Binode = tonic;
      for (let i = 1; i < Constants.SEMITONES; i++) {
        q.r = new Binode(customProfile[o * Constants.SEMITONES + i]);
        q.r.l = q;
        q = q.r;
      }
      q.r = tonic;
      tonic.l = q;

      // offset from A to C (3 semitones)
      for (let i = 0; i < 3; i++) {
        tonic = tonic.r;
      }

      this.tonics.push(tonic);
    }
  }


  destroy(): void {
    for (let o = 0; o < Constants.OCTAVES; o++) {
      let p: Binode = this.tonics[o];
      do {
        let zap = p;
        p = p.r;
        zap = null;
      } while (p !== this.tonics[o]);
    }
  }

  cosineSimilarity(input: number[], offset: number): number {

    if (input.length !== Constants.BANDS) {
      throw new Error('Chroma data must have 72 elements');
    }

    let intersection = 0.0;
    let profileNorm = 0.0;
    let inputNorm = 0.0;

    for (let o = 0; o < Constants.OCTAVES; o++) {
      // Rotate starting pointer left for offset. Each step shifts the position
      // of the tonic one step further right of the starting pointer (or one semitone up).
      let p = this.tonics[o];
      for (let i = 0; i < offset; i++) {
        p = p.l;
      }
      for (let i = o * Constants.SEMITONES; i < (o + 1) * Constants.SEMITONES; i++) {
        intersection += input[i] * p.data;
        profileNorm += Math.pow((p.data), 2);
        inputNorm += Math.pow((input[i]), 2);
        p = p.r;
      }
    }

    if (profileNorm > 0 && inputNorm > 0) {
      // div by zero check
      return intersection / (Math.sqrt(profileNorm) * Math.sqrt(inputNorm));
    } else {
      return 0;
    }
  }
}
