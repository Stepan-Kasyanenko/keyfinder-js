import {Constants, key_t} from './Constants';
import {ToneProfile} from './ToneProfile';

export class KeyClassifier {
  major: ToneProfile;
  minor: ToneProfile;
  silence: ToneProfile;

  constructor(majorProfile: number[], minorProfile: number[]) {

    if (majorProfile.length !== Constants.BANDS) {
      throw new Error('Tone profile must have 72 elements');
    }

    if (minorProfile.length !== Constants.BANDS) {
      throw new Error('Tone profile must have 72 elements');
    }

    this.major = new ToneProfile(majorProfile);
    this.minor = new ToneProfile(minorProfile);
    this.silence = new ToneProfile(Constants.fillArray(Constants.BANDS));
  }

  destroy() {
    this.major.destroy();
    this.minor.destroy();
    this.silence.destroy();
  }

  classify(chromaVector: number[]): key_t {
    const scores: number[] = Constants.fillArray(24);
    let bestScore = 0.0;
    for (let i = 0; i < Constants.SEMITONES; i++) {
      let score;
      score = this.major.cosineSimilarity(chromaVector, i); // major
      scores[i * 2] = score;
      score = this.minor.cosineSimilarity(chromaVector, i); // minor
      scores[(i * 2) + 1] = score;
    }
    bestScore = this.silence.cosineSimilarity(chromaVector, 0);
    // find best match, defaulting to silence
    let bestMatch: key_t = key_t.SILENCE;
    for (let i = 0; i < 24; i++) {
      if (scores[i] > bestScore) {
        bestScore = scores[i];
        bestMatch = i as key_t;
      }
    }
    return bestMatch;
  }
}
