import { IToken } from './Tokenizer';
/**
 * Handles placeholder replacement with given params.
 */
export default class Params {
  params: any[];
  index: number;

  constructor(params: any[]) {
    this.params = params;
    this.index = 0;
  }

  get({ key, value }: IToken) {
    if (!this.params) {
      return value;
    }
    if (key) {
      return this.params[key];
    }
    return this.params[this.index++];
  }
}
