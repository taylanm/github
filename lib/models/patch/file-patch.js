import Patch, {nullPatch} from './patch';
  isPresent() {
    return this.oldFile.isPresent() || this.newFile.isPresent() || this.patch.isPresent();
  }

    if (!this.isPresent()) {
      return '';
    }


export const nullFilePatch = new FilePatch(nullFile, nullFile, nullPatch);