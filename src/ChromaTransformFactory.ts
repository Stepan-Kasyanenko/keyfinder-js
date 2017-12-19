import {ChromaTransform} from './ChromaTransform';

export class ChromaTransformFactory {
  private chromaTransforms: ChromaTransformWrapper[] = [];
  chromaTransformFactoryMutex: any; // Need to lock thread. Not used in js

  getChromaTransform(frameRate: number): ChromaTransform {
    for (let i = 0; i < this.chromaTransforms.length; i++) {
      const wrapper: ChromaTransformWrapper = this.chromaTransforms[i];
      if (wrapper.getFrameRate() === frameRate) {
        return wrapper.getChromaTransform();
      }
    }

    this.chromaTransforms.push(new ChromaTransformWrapper(frameRate, new ChromaTransform(frameRate)));
    const newChromaTransformIndex = this.chromaTransforms.length - 1;

    return this.chromaTransforms[newChromaTransformIndex].getChromaTransform();
  }
}

class ChromaTransformWrapper {
  frameRate: number;
  chromaTransform: ChromaTransform;

  constructor(inFrameRate: number, inChromaTransform: ChromaTransform) {
    this.frameRate = inFrameRate;
    this.chromaTransform = inChromaTransform;
  }

  getFrameRate(): number {
    return this.frameRate;
  }

  getChromaTransform(): ChromaTransform {
    return this.chromaTransform;
  }
}
