import isEmpty from 'lodash/isEmpty';
import escapeRegExp from 'lodash/escapeRegExp';
import tokenTypes from './tokenTypes';

export interface ITokenizerConfig {
  reservedWords: string[];
  reservedToplevelWords?: string[];
  reservedNewlineWords: string[];
  stringTypes: string[];
  openParens: string[];
  closeParens: string[];
  indexedPlaceholderTypes?: string[];
  namedPlaceholderTypes: string[];
  lineCommentTypes: string[];
  specialWordChars?: string[];
  skipWordBlockRegExp?: string[];
}

export interface IToken {
  type?: string;
  value?: string;
  key?: string;
}

export default class Tokenizer {
  WHITESPACE_REGEX: RegExp;
  NUMBER_REGEX: RegExp;
  OPERATOR_REGEX: RegExp;
  BLOCK_COMMENT_REGEX: RegExp;
  LINE_COMMENT_REGEX: RegExp;
  RESERVED_TOPLEVEL_REGEX: RegExp;
  RESERVED_NEWLINE_REGEX: RegExp;
  RESERVED_PLAIN_REGEX: RegExp;
  WORD_REGEX: RegExp;
  STRING_REGEX: RegExp;
  OPEN_PAREN_REGEX: RegExp;
  CLOSE_PAREN_REGEX: RegExp;
  INDEXED_PLACEHOLDER_REGEX: RegExp | false;
  IDENT_NAMED_PLACEHOLDER_REGEX: RegExp | false;
  STRING_NAMED_PLACEHOLDER_REGEX: RegExp | false;
  SKIP_WORDBLOCK_REGEX: RegExp | false;

  constructor(cfg: ITokenizerConfig) {
    this.WHITESPACE_REGEX = /^(\s+)/;
    this.NUMBER_REGEX = /^((-\s*)?[0-9]+(\.[0-9]+)?|0x[0-9a-fA-F]+|0b[01]+)\b/;
    this.OPERATOR_REGEX = /^(!=|<>|==|<=|>=|!<|!>|\|\||::|->>|->|~~\*|~~|!~~\*|!~~|~\*|!~\*|!~|.)/;

    this.BLOCK_COMMENT_REGEX = /^(\/\*[^]*?(?:\*\/|$))/;
    this.LINE_COMMENT_REGEX = this.createLineCommentRegex(cfg.lineCommentTypes);

    this.RESERVED_TOPLEVEL_REGEX = this.createReservedWordRegex(
      cfg.reservedToplevelWords ?? [],
    );
    this.RESERVED_NEWLINE_REGEX = this.createReservedWordRegex(
      cfg.reservedNewlineWords,
    );
    this.RESERVED_PLAIN_REGEX = this.createReservedWordRegex(cfg.reservedWords);

    this.SKIP_WORDBLOCK_REGEX = this.createSkipWordBlockRegex(
      cfg.skipWordBlockRegExp ?? [],
    );

    this.WORD_REGEX = this.createWordRegex(cfg.specialWordChars);
    this.STRING_REGEX = this.createStringRegex(cfg.stringTypes);

    this.OPEN_PAREN_REGEX = this.createParenRegex(cfg.openParens);
    this.CLOSE_PAREN_REGEX = this.createParenRegex(cfg.closeParens);

    this.INDEXED_PLACEHOLDER_REGEX = this.createPlaceholderRegex(
      cfg.indexedPlaceholderTypes ?? [],
      '[0-9]*',
    );
    this.IDENT_NAMED_PLACEHOLDER_REGEX = this.createPlaceholderRegex(
      cfg.namedPlaceholderTypes,
      '[a-zA-Z0-9._$]+',
    );
    this.STRING_NAMED_PLACEHOLDER_REGEX = this.createPlaceholderRegex(
      cfg.namedPlaceholderTypes,
      this.createStringPattern(cfg.stringTypes),
    );
  }

  createLineCommentRegex(lineCommentTypes: string[]) {
    return new RegExp(
      `^((?:${lineCommentTypes
        .map(c => escapeRegExp(c))
        .join('|')}).*?(?:\n|$))`,
    );
  }

  createReservedWordRegex(reservedWords: string[]) {
    const reservedWordsPattern = reservedWords.join('|').replace(/ /g, '\\s+');
    return new RegExp(`^(${reservedWordsPattern})\\b`, 'i');
  }

  createSkipWordBlockRegex(skipWordBlockRegExp: string[]) {
    if (isEmpty(skipWordBlockRegExp)) {
      return false;
    }

    const skipWordBlockPattern = skipWordBlockRegExp
      .join('|')
      .replace(/ /g, '\\s+');
    return new RegExp(`^(${skipWordBlockPattern})\\b`, 'i');
  }

  createWordRegex(specialChars: string[] = []) {
    return new RegExp(`^([\\w${specialChars.join('')}]+)`);
  }

  createStringRegex(stringTypes: string[]) {
    return new RegExp('^(' + this.createStringPattern(stringTypes) + ')');
  }

  // This enables the following string patterns:
  // 1. backtick quoted string using `` to escape
  // 2. square bracket quoted string (SQL Server) using ]] to escape
  // 3. double quoted string using "" or \" to escape
  // 4. single quoted string using '' or \' to escape
  // 5. national character quoted string using N'' or N\' to escape
  createStringPattern(stringTypes: string[]) {
    const patterns = {
      '``': '((`[^`]*($|`))+)',
      '[]': '((\\[[^\\]]*($|\\]))(\\][^\\]]*($|\\]))*)',
      '""': '(("[^"\\\\]*(?:\\\\.[^"\\\\]*)*("|$))+)',
      "''": "(('[^'\\\\]*(?:\\\\.[^'\\\\]*)*('|$))+)",
      "N''": "((N'[^N'\\\\]*(?:\\\\.[^N'\\\\]*)*('|$))+)",
    };

    return stringTypes.map(t => patterns[t]).join('|');
  }

  createParenRegex(parens: string[]) {
    return new RegExp(
      '^(' + parens.map(p => this.escapeParen(p)).join('|') + ')',
      'i',
    );
  }

  escapeParen(paren: string) {
    if (paren.length === 1) {
      // A single punctuation character
      return escapeRegExp(paren);
    } else {
      // longer word
      return '\\b' + paren + '\\b';
    }
  }

  createPlaceholderRegex(types: string[], pattern: string) {
    if (isEmpty(types)) {
      return false;
    }
    const typesRegex = types.map(escapeRegExp).join('|');

    return new RegExp(`^((?:${typesRegex})(?:${pattern}))`);
  }

  /**
   * Takes a SQL string and breaks it into tokens.
   * Each token is an object with type and value.
   *
   * @param {String} input The SQL string
   * @return {Object[]} tokens An array of tokens.
   *  @return {String} token.type
   *  @return {String} token.value
   */
  tokenize(input: string) {
    const tokens = [];
    let token;

    // Keep processing the string until it is empty
    while (input.length) {
      // Get the next token and the token type
      token = this.getNextToken(input, token);

      if (token) {
        // Advance the string
        if (token.value) {
          input = input.substring(token.value.length);
        }

        tokens.push(token);
      }
    }
    return tokens;
  }

  getNextToken(input: string, previousToken?: IToken): IToken | undefined {
    return (
      this.getSkipWordBlockToken(input) ||
      this.getWhitespaceToken(input) ||
      this.getCommentToken(input) ||
      this.getStringToken(input) ||
      this.getOpenParenToken(input) ||
      this.getCloseParenToken(input) ||
      this.getPlaceholderToken(input) ||
      this.getNumberToken(input) ||
      this.getReservedWordToken(input, previousToken) ||
      this.getWordToken(input) ||
      this.getOperatorToken(input)
    );
  }

  getWhitespaceToken(input: string) {
    return this.getTokenOnFirstMatch({
      input,
      type: tokenTypes.WHITESPACE,
      regex: this.WHITESPACE_REGEX,
    });
  }

  getCommentToken(input: string) {
    return this.getLineCommentToken(input) || this.getBlockCommentToken(input);
  }

  getLineCommentToken(input: string) {
    return this.getTokenOnFirstMatch({
      input,
      type: tokenTypes.LINE_COMMENT,
      regex: this.LINE_COMMENT_REGEX,
    });
  }

  getBlockCommentToken(input: string) {
    return this.getTokenOnFirstMatch({
      input,
      type: tokenTypes.BLOCK_COMMENT,
      regex: this.BLOCK_COMMENT_REGEX,
    });
  }

  getStringToken(input: string) {
    return this.getTokenOnFirstMatch({
      input,
      type: tokenTypes.STRING,
      regex: this.STRING_REGEX,
    });
  }

  getOpenParenToken(input: string) {
    return this.getTokenOnFirstMatch({
      input,
      type: tokenTypes.OPEN_PAREN,
      regex: this.OPEN_PAREN_REGEX,
    });
  }

  getCloseParenToken(input: string) {
    return this.getTokenOnFirstMatch({
      input,
      type: tokenTypes.CLOSE_PAREN,
      regex: this.CLOSE_PAREN_REGEX,
    });
  }

  getPlaceholderToken(input: string) {
    return (
      this.getIdentNamedPlaceholderToken(input) ||
      this.getStringNamedPlaceholderToken(input) ||
      this.getIndexedPlaceholderToken(input)
    );
  }

  getIdentNamedPlaceholderToken(input: string) {
    return this.getPlaceholderTokenWithKey({
      input,
      regex: this.IDENT_NAMED_PLACEHOLDER_REGEX,
      parseKey: (v: string) => v.slice(1),
    });
  }

  getStringNamedPlaceholderToken(input: string) {
    return this.getPlaceholderTokenWithKey({
      input,
      regex: this.STRING_NAMED_PLACEHOLDER_REGEX,
      parseKey: v =>
        this.getEscapedPlaceholderKey({
          key: v.slice(2, -1),
          quoteChar: v.slice(-1),
        }),
    });
  }

  getIndexedPlaceholderToken(input: string) {
    return this.getPlaceholderTokenWithKey({
      input,
      regex: this.INDEXED_PLACEHOLDER_REGEX,
      parseKey: v => v.slice(1),
    });
  }

  getPlaceholderTokenWithKey({
    input,
    regex,
    parseKey,
  }: {
    input: string;
    regex: RegExp | false;
    parseKey: (v: string) => string;
  }) {
    const token = this.getTokenOnFirstMatch({
      input,
      regex,
      type: tokenTypes.PLACEHOLDER,
    });
    if (token?.value) {
      token.key = parseKey(token.value);
    }
    return token;
  }

  getEscapedPlaceholderKey({
    key,
    quoteChar,
  }: {
    key: string;
    quoteChar: string;
  }) {
    return key.replace(
      new RegExp(escapeRegExp('\\') + quoteChar, 'g'),
      quoteChar,
    );
  }

  // Decimal, binary, or hex numbers
  getNumberToken(input: string) {
    return this.getTokenOnFirstMatch({
      input,
      type: tokenTypes.NUMBER,
      regex: this.NUMBER_REGEX,
    });
  }

  // Punctuation and symbols
  getOperatorToken(input: string) {
    return this.getTokenOnFirstMatch({
      input,
      type: tokenTypes.OPERATOR,
      regex: this.OPERATOR_REGEX,
    });
  }

  getReservedWordToken(input: string, previousToken?: IToken) {
    // A reserved word cannot be preceded by a "."
    // this makes it so in "mytable.from", "from" is not considered a reserved word
    if (previousToken && previousToken.value && previousToken.value === '.') {
      return;
    }
    return (
      this.getToplevelReservedToken(input) ||
      this.getNewlineReservedToken(input) ||
      this.getPlainReservedToken(input)
    );
  }

  getSkipWordBlockToken(input: string) {
    return this.getTokenOnFirstMatch({
      input,
      type: tokenTypes.SKIP_BLOCK,
      regex: this.SKIP_WORDBLOCK_REGEX,
    });
  }

  getToplevelReservedToken(input: string) {
    return this.getTokenOnFirstMatch({
      input,
      type: tokenTypes.RESERVED_TOPLEVEL,
      regex: this.RESERVED_TOPLEVEL_REGEX,
    });
  }

  getNewlineReservedToken(input: string) {
    return this.getTokenOnFirstMatch({
      input,
      type: tokenTypes.RESERVED_NEWLINE,
      regex: this.RESERVED_NEWLINE_REGEX,
    });
  }

  getPlainReservedToken(input: string) {
    return this.getTokenOnFirstMatch({
      input,
      type: tokenTypes.RESERVED,
      regex: this.RESERVED_PLAIN_REGEX,
    });
  }

  getWordToken(input: string) {
    return this.getTokenOnFirstMatch({
      input,
      type: tokenTypes.WORD,
      regex: this.WORD_REGEX,
    });
  }

  getTokenOnFirstMatch({
    input,
    type,
    regex,
  }: {
    input: string;
    type: string;
    regex: RegExp | false;
  }): IToken | undefined {
    if (regex) {
      const matches = input.match(regex as RegExp);

      if (matches) {
        return { type, value: matches[1] };
      }
    }

    return;
  }
}
