import Db2Formatter from './languages/Db2Formatter';
import N1qlFormatter from './languages/N1qlFormatter';
import PlSqlFormatter from './languages/PlSqlFormatter';
import StandardSqlFormatter from './languages/StandardSqlFormatter';

export enum Language {
  DB2 = 'db2',
  N1QL = 'n1ql',
  PLSQL = 'pl/sql',
  SQL = 'sql',
}

export interface IConfig {
  language?: Language | string;
  indent?: string;
  params?: any;
}

export default {
  /**
   * Format whitespaces in a query to make it easier to read.
   */
  format: (query: string, _cfg?: IConfig): string => {
    const cfg: IConfig = _cfg || {};

    switch (cfg.language) {
      case Language.DB2:
        return new Db2Formatter(cfg).format(query);
      case Language.N1QL:
        return new N1qlFormatter(cfg).format(query);
      case Language.PLSQL:
        return new PlSqlFormatter(cfg).format(query);
      case Language.SQL:
      case undefined:
        return new StandardSqlFormatter(cfg).format(query);
      default:
        throw Error(`Unsupported SQL dialect: ${cfg.language}`);
    }
  },
};
