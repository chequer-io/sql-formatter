import sqlFormatter, { Language } from '../src/sqlFormatter';
import behavesLikeSqlFormatter from './behavesLikeSqlFormatter';

describe('SnowflakeFormatter', function() {
  behavesLikeSqlFormatter();

  it('formats pipeline ::', function() {
    expect(
      sqlFormatter.format(
        "SELECT\nFIELDS:project:key::string as project,\ncase FIELDS:status:statusCategory:key::string\nwhen 'done' THEN '완료'\nwhen 'indeterminate' THEN '보류'\nwhen 'new' THEN '신규'\nend as status,\ncount(*) as count\nFROM\nJIRA.ISSUES\nWHERE \nFIELDS:project:key::string in ('QUERYPIE','SQLGATE')\nGROUP BY\nproject,\nstatus\nORDER BY project, status;",
        { language: Language.SNOWFLAKE },
      ),
    ).toBe(
      'SELECT\n' +
        '  FIELDS:project:key::string as project,\n' +
        '  case\n' +
        '    FIELDS:status:statusCategory:key::string\n' +
        "    when 'done' THEN '완료'\n" +
        "    when 'indeterminate' THEN '보류'\n" +
        "    when 'new' THEN '신규'\n" +
        '  end as status,\n' +
        '  count(*) as count\n' +
        'FROM\n' +
        '  JIRA.ISSUES\n' +
        'WHERE\n' +
        "  FIELDS:project:key::string in ('QUERYPIE', 'SQLGATE')\n" +
        'GROUP BY\n' +
        '  project,\n' +
        '  status\n' +
        'ORDER BY\n' +
        '  project,\n' +
        '  status;',
    );
  });
});
