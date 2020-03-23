import sqlFormatter, { Language } from '../src/sqlFormatter';

/**
 * Core tests for all SQL formatters
 */
export default function behavesLikeSqlFormatter(language?: Language) {
  it('uses given indent config for indention', function() {
    const result = sqlFormatter.format('SELECT count(*),Column1 FROM Table1;', {
      language,
      indent: '    ',
    });

    expect(result).toBe(
      'SELECT\n' +
        '    count(*),\n' +
        '    Column1\n' +
        'FROM\n' +
        '    Table1;',
    );
  });

  function format(query: string) {
    return sqlFormatter.format(query, { language });
  }

  it('formats simple SET SCHEMA queries', function() {
    const result = format('SET SCHEMA tetrisdb; SET CURRENT SCHEMA bingodb;');
    expect(result).toBe(
      'SET SCHEMA\n' + '  tetrisdb;\n' + 'SET CURRENT SCHEMA\n' + '  bingodb;',
    );
  });

  it('formats simple SELECT query', function() {
    const result = format('SELECT count(*),Column1 FROM Table1;');
    expect(result).toBe(
      'SELECT\n' + '  count(*),\n' + '  Column1\n' + 'FROM\n' + '  Table1;',
    );
  });

  it('formats complex SELECT', function() {
    const result = format(
      "SELECT DISTINCT name, ROUND(age/7) field1, 18 + 20 AS field2, 'some string' FROM foo;",
    );
    expect(result).toBe(
      'SELECT\n' +
        '  DISTINCT name,\n' +
        '  ROUND(age / 7) field1,\n' +
        '  18 + 20 AS field2,\n' +
        "  'some string'\n" +
        'FROM\n' +
        '  foo;',
    );
  });

  it('formats SELECT with complex WHERE', function() {
    const result = sqlFormatter.format(
      "SELECT * FROM foo WHERE Column1 = 'testing'" +
        'AND ( (Column2 = Column3 OR Column4 >= NOW()) );',
    );
    expect(result).toBe(
      'SELECT\n' +
        '  *\n' +
        'FROM\n' +
        '  foo\n' +
        'WHERE\n' +
        "  Column1 = 'testing'\n" +
        '  AND (\n' +
        '    (\n' +
        '      Column2 = Column3\n' +
        '      OR Column4 >= NOW()\n' +
        '    )\n' +
        '  );',
    );
  });

  it('formats SELECT with toplevel reserved words', function() {
    const result = format(
      "SELECT * FROM foo WHERE name = 'John' GROUP BY some_column " +
        'HAVING column > 10 ORDER BY other_column LIMIT 5;',
    );
    expect(result).toBe(
      'SELECT\n' +
        '  *\n' +
        'FROM\n' +
        '  foo\n' +
        'WHERE\n' +
        "  name = 'John'\n" +
        'GROUP BY\n' +
        '  some_column\n' +
        'HAVING\n' +
        '  column > 10\n' +
        'ORDER BY\n' +
        '  other_column\n' +
        'LIMIT\n' +
        '  5;',
    );
  });

  it('formats LIMIT with two comma-separated values on single line', function() {
    const result = format('LIMIT 5, 10;');
    expect(result).toBe('LIMIT\n' + '  5, 10;');
  });

  it('formats LIMIT of single value followed by another SELECT using commas', function() {
    const result = format('LIMIT 5; SELECT foo, bar;');
    expect(result).toBe(
      'LIMIT\n' + '  5;\n' + 'SELECT\n' + '  foo,\n' + '  bar;',
    );
  });

  it('formats LIMIT of single value and OFFSET', function() {
    const result = format('LIMIT 5 OFFSET 8;');
    expect(result).toBe('LIMIT\n' + '  5 OFFSET 8;');
  });

  it('recognizes LIMIT in lowercase', function() {
    const result = format('limit 5, 10;');
    expect(result).toBe('limit\n' + '  5, 10;');
  });

  it('preserves case of keywords', function() {
    const result = format(
      'select distinct * frOM foo left join bar WHERe a > 1 and b = 3',
    );
    expect(result).toBe(
      'select\n' +
        '  distinct *\n' +
        'frOM\n' +
        '  foo\n' +
        '  left join bar\n' +
        'WHERe\n' +
        '  a > 1\n' +
        '  and b = 3',
    );
  });

  it('formats SELECT query with SELECT query inside it', function() {
    const result = format(
      'SELECT *, SUM(*) AS sum FROM (SELECT * FROM Posts LIMIT 30) WHERE a > b',
    );
    expect(result).toBe(
      'SELECT\n' +
        '  *,\n' +
        '  SUM(*) AS sum\n' +
        'FROM\n' +
        '  (\n' +
        '    SELECT\n' +
        '      *\n' +
        '    FROM\n' +
        '      Posts\n' +
        '    LIMIT\n' +
        '      30\n' +
        '  )\n' +
        'WHERE\n' +
        '  a > b',
    );
  });

  it('formats SELECT query with INNER JOIN', function() {
    const result = format(
      'SELECT customer_id.from, COUNT(order_id) AS total FROM customers ' +
        'INNER JOIN orders ON customers.customer_id = orders.customer_id;',
    );
    expect(result).toBe(
      'SELECT\n' +
        '  customer_id.from,\n' +
        '  COUNT(order_id) AS total\n' +
        'FROM\n' +
        '  customers\n' +
        '  INNER JOIN orders ON customers.customer_id = orders.customer_id;',
    );
  });

  it('formats SELECT query with different comments', function() {
    const result = format(
      'SELECT\n' +
        '/*\n' +
        ' * This is a block comment\n' +
        ' */\n' +
        '* FROM\n' +
        '-- This is another comment\n' +
        'MyTable # One final comment\n' +
        'WHERE 1 = 2;',
    );
    expect(result).toBe(
      'SELECT\n' +
        '  /*\n' +
        '   * This is a block comment\n' +
        '   */\n' +
        '  *\n' +
        'FROM\n' +
        '  -- This is another comment\n' +
        '  MyTable # One final comment\n' +
        'WHERE\n' +
        '  1 = 2;',
    );
  });

  it('formats simple INSERT query', function() {
    const result = format(
      "INSERT INTO Customers (ID, MoneyBalance, Address, City) VALUES (12,-123.4, 'Skagen 2111','Stv');",
    );
    expect(result).toBe(
      'INSERT INTO\n' +
        '  Customers (ID, MoneyBalance, Address, City)\n' +
        'VALUES\n' +
        "  (12, -123.4, 'Skagen 2111', 'Stv');",
    );
  });

  it('keeps short parenthized list with nested parenthesis on single line', function() {
    const result = format('SELECT (a + b * (c - NOW()));');
    expect(result).toBe('SELECT\n' + '  (a + b * (c - NOW()));');
  });

  it('breaks long parenthized lists to multiple lines', function() {
    const result = format(
      'INSERT INTO some_table (id_product, id_shop, id_currency, id_country, id_registration) (' +
        'SELECT IF(dq.id_discounter_shopping = 2, dq.value, dq.value / 100),' +
        "IF (dq.id_discounter_shopping = 2, 'amount', 'percentage') FROM foo);",
    );
    expect(result).toBe(
      'INSERT INTO\n' +
        '  some_table (\n' +
        '    id_product,\n' +
        '    id_shop,\n' +
        '    id_currency,\n' +
        '    id_country,\n' +
        '    id_registration\n' +
        '  ) (\n' +
        '    SELECT\n' +
        '      IF(\n' +
        '        dq.id_discounter_shopping = 2,\n' +
        '        dq.value,\n' +
        '        dq.value / 100\n' +
        '      ),\n' +
        '      IF (\n' +
        '        dq.id_discounter_shopping = 2,\n' +
        "        'amount',\n" +
        "        'percentage'\n" +
        '      )\n' +
        '    FROM\n' +
        '      foo\n' +
        '  );',
    );
  });

  it('formats simple UPDATE query', function() {
    const result = format(
      "UPDATE Customers SET ContactName='Alfred Schmidt', City='Hamburg' WHERE CustomerName='Alfreds Futterkiste';",
    );
    expect(result).toBe(
      'UPDATE\n' +
        '  Customers\n' +
        'SET\n' +
        "  ContactName = 'Alfred Schmidt',\n" +
        "  City = 'Hamburg'\n" +
        'WHERE\n' +
        "  CustomerName = 'Alfreds Futterkiste';",
    );
  });

  it('formats simple DELETE query', function() {
    const result = format(
      "DELETE FROM Customers WHERE CustomerName='Alfred' AND Phone=5002132;",
    );
    expect(result).toBe(
      'DELETE FROM\n' +
        '  Customers\n' +
        'WHERE\n' +
        "  CustomerName = 'Alfred'\n" +
        '  AND Phone = 5002132;',
    );
  });

  it('formats simple DROP query', function() {
    const result = format('DROP TABLE IF EXISTS admin_role;');
    expect(result).toBe('DROP TABLE IF EXISTS admin_role;');
  });

  it('formats uncomplete query', function() {
    const result = format('SELECT count(');
    expect(result).toBe('SELECT\n' + '  count(');
  });

  it('formats query that ends with open comment', function() {
    const result = format('SELECT count(*)\n/*Comment');
    expect(result).toBe('SELECT\n' + '  count(*)\n' + '  /*Comment');
  });

  it('formats UPDATE query with AS part', function() {
    const result = format(
      'UPDATE customers SET totalorders = ordersummary.total  FROM ( SELECT * FROM bank) AS ordersummary',
    );
    expect(result).toBe(
      'UPDATE\n' +
        '  customers\n' +
        'SET\n' +
        '  totalorders = ordersummary.total\n' +
        'FROM\n' +
        '  (\n' +
        '    SELECT\n' +
        '      *\n' +
        '    FROM\n' +
        '      bank\n' +
        '  ) AS ordersummary',
    );
  });

  it('formats top-level and newline multi-word reserved words with inconsistent spacing', function() {
    const result = format(
      'SELECT * FROM foo LEFT \t OUTER  \n JOIN bar ORDER \n BY blah',
    );
    expect(result).toBe(
      'SELECT\n' +
        '  *\n' +
        'FROM\n' +
        '  foo\n' +
        '  LEFT OUTER JOIN bar\n' +
        'ORDER BY\n' +
        '  blah',
    );
  });

  it('formats long double parenthized queries to multiple lines', function() {
    const result = format(
      "((foo = '0123456789-0123456789-0123456789-0123456789'))",
    );
    expect(result).toBe(
      '(\n' +
        '  (\n' +
        "    foo = '0123456789-0123456789-0123456789-0123456789'\n" +
        '  )\n' +
        ')',
    );
  });

  it('formats short double parenthized queries to one line', function() {
    const result = format("((foo = 'bar'))");
    expect(result).toBe("((foo = 'bar'))");
  });

  it('formats single-char operators', function() {
    expect(format('foo = bar')).toBe('foo = bar');
    expect(format('foo < bar')).toBe('foo < bar');
    expect(format('foo > bar')).toBe('foo > bar');
    expect(format('foo + bar')).toBe('foo + bar');
    expect(format('foo - bar')).toBe('foo - bar');
    expect(format('foo * bar')).toBe('foo * bar');
    expect(format('foo / bar')).toBe('foo / bar');
    expect(format('foo % bar')).toBe('foo % bar');
  });

  it('formats multi-char operators', function() {
    expect(format('foo != bar')).toBe('foo != bar');
    expect(format('foo <> bar')).toBe('foo <> bar');
    expect(format('foo == bar')).toBe('foo == bar'); // N1QL
    expect(format('foo || bar')).toBe('foo || bar'); // Oracle, Postgres, N1QL string concat

    expect(format('foo <= bar')).toBe('foo <= bar');
    expect(format('foo >= bar')).toBe('foo >= bar');

    expect(format('foo !< bar')).toBe('foo !< bar');
    expect(format('foo !> bar')).toBe('foo !> bar');
  });

  it('formats logical operators', function() {
    expect(format('foo ALL bar')).toBe('foo ALL bar');
    expect(format('foo = ANY (1, 2, 3)')).toBe('foo = ANY (1, 2, 3)');
    expect(format('EXISTS bar')).toBe('EXISTS bar');
    expect(format('foo IN (1, 2, 3)')).toBe('foo IN (1, 2, 3)');
    expect(format("foo LIKE 'hello%'")).toBe("foo LIKE 'hello%'");
    expect(format('foo IS NULL')).toBe('foo IS NULL');
    expect(format('UNIQUE foo')).toBe('UNIQUE foo');
  });

  it('formats AND/OR operators', function() {
    expect(format('foo BETWEEN bar AND baz')).toBe('foo BETWEEN bar\nAND baz');
    expect(format('foo AND bar')).toBe('foo\nAND bar');
    expect(format('foo OR bar')).toBe('foo\nOR bar');
  });

  it('recognizes strings', function() {
    expect(format('"foo JOIN bar"')).toBe('"foo JOIN bar"');
    expect(format("'foo JOIN bar'")).toBe("'foo JOIN bar'");
    expect(format('`foo JOIN bar`')).toBe('`foo JOIN bar`');
  });

  it('recognizes escaped strings', function() {
    expect(format('"foo \\" JOIN bar"')).toBe('"foo \\" JOIN bar"');
    expect(format("'foo \\' JOIN bar'")).toBe("'foo \\' JOIN bar'");
    expect(format('`foo `` JOIN bar`')).toBe('`foo `` JOIN bar`');
  });

  it('formats postgres specific operators', function() {
    expect(format('column::int')).toBe('column :: int');
    expect(format('v->2')).toBe('v -> 2');
    expect(format('v->>2')).toBe('v ->> 2');
    expect(format("foo ~~ 'hello'")).toBe("foo ~~ 'hello'");
    expect(format("foo !~ 'hello'")).toBe("foo !~ 'hello'");
    expect(format("foo ~* 'hello'")).toBe("foo ~* 'hello'");
    expect(format("foo ~~* 'hello'")).toBe("foo ~~* 'hello'");
    expect(format("foo !~~ 'hello'")).toBe("foo !~~ 'hello'");
    expect(format("foo !~* 'hello'")).toBe("foo !~* 'hello'");
    expect(format("foo !~~* 'hello'")).toBe("foo !~~* 'hello'");
  });

  it('keeps separation between multiple statements', function() {
    expect(format('foo;bar;')).toBe('foo;\nbar;');
    expect(format('foo\n;bar;')).toBe('foo;\nbar;');
    expect(format('foo\n\n\n;bar;\n\n')).toBe('foo;\nbar;');

    const result = format(
      'SELECT count(*),Column1 FROM Table1;\nSELECT count(*),Column1 FROM Table2;',
    );
    expect(result).toBe(
      'SELECT\n' +
        '  count(*),\n' +
        '  Column1\n' +
        'FROM\n' +
        '  Table1;\n' +
        'SELECT\n' +
        '  count(*),\n' +
        '  Column1\n' +
        'FROM\n' +
        '  Table2;',
    );
  });

  it('formats short CREATE TABLE', function() {
    expect(
      sqlFormatter.format('CREATE TABLE items (a INT PRIMARY KEY, b TEXT);'),
    ).toBe('CREATE TABLE items (a INT PRIMARY KEY, b TEXT);');
  });

  it('formats long CREATE TABLE', function() {
    expect(
      sqlFormatter.format(
        'CREATE TABLE items (a INT PRIMARY KEY, b TEXT, c INT NOT NULL, d INT NOT NULL);',
      ),
    ).toBe(
      'CREATE TABLE items (\n' +
        '  a INT PRIMARY KEY,\n' +
        '  b TEXT,\n' +
        '  c INT NOT NULL,\n' +
        '  d INT NOT NULL\n' +
        ');',
    );
  });

  it('formats INSERT without INTO', function() {
    const result = sqlFormatter.format(
      "INSERT Customers (ID, MoneyBalance, Address, City) VALUES (12,-123.4, 'Skagen 2111','Stv');",
    );
    expect(result).toBe(
      'INSERT\n' +
        '  Customers (ID, MoneyBalance, Address, City)\n' +
        'VALUES\n' +
        "  (12, -123.4, 'Skagen 2111', 'Stv');",
    );
  });

  it('formats ALTER TABLE ... MODIFY query', function() {
    const result = sqlFormatter.format(
      'ALTER TABLE supplier MODIFY supplier_name char(100) NOT NULL;',
    );
    expect(result).toBe(
      'ALTER TABLE\n' +
        '  supplier\n' +
        'MODIFY\n' +
        '  supplier_name char(100) NOT NULL;',
    );
  });

  it('formats ALTER TABLE ... ALTER COLUMN query', function() {
    const result = sqlFormatter.format(
      'ALTER TABLE supplier ALTER COLUMN supplier_name VARCHAR(100) NOT NULL;',
    );
    expect(result).toBe(
      'ALTER TABLE\n' +
        '  supplier\n' +
        'ALTER COLUMN\n' +
        '  supplier_name VARCHAR(100) NOT NULL;',
    );
  });

  it('recognizes [] strings', function() {
    expect(sqlFormatter.format('[foo JOIN bar]')).toBe('[foo JOIN bar]');
    expect(sqlFormatter.format('[foo ]] JOIN bar]')).toBe('[foo ]] JOIN bar]');
  });

  it('recognizes @variables', function() {
    const result = sqlFormatter.format(
      'SELECT @variable, @a1_2.3$, @\'var name\', @"var name", @`var name`, @[var name];',
    );
    expect(result).toBe(
      'SELECT\n' +
        '  @variable,\n' +
        '  @a1_2.3$,\n' +
        "  @'var name',\n" +
        '  @"var name",\n' +
        '  @`var name`,\n' +
        '  @[var name];',
    );
  });

  it('replaces @variables with param values', function() {
    const result = sqlFormatter.format(
      "SELECT @variable, @a1_2.3$, @'var name', @\"var name\", @`var name`, @[var name], @'var\\name';",
      {
        params: {
          variable: '"variable value"',
          'a1_2.3$': "'weird value'",
          'var name': "'var value'",
          'var\\name': "'var\\ value'",
        },
      },
    );
    expect(result).toBe(
      'SELECT\n' +
        '  "variable value",\n' +
        "  'weird value',\n" +
        "  'var value',\n" +
        "  'var value',\n" +
        "  'var value',\n" +
        "  'var value',\n" +
        "  'var\\ value';",
    );
  });

  it('recognizes :variables', function() {
    const result = sqlFormatter.format(
      'SELECT :variable, :a1_2.3$, :\'var name\', :"var name", :`var name`, :[var name];',
    );
    expect(result).toBe(
      'SELECT\n' +
        '  :variable,\n' +
        '  :a1_2.3$,\n' +
        "  :'var name',\n" +
        '  :"var name",\n' +
        '  :`var name`,\n' +
        '  :[var name];',
    );
  });

  it('replaces :variables with param values', function() {
    const result = sqlFormatter.format(
      'SELECT :variable, :a1_2.3$, :\'var name\', :"var name", :`var name`,' +
        " :[var name], :'escaped \\'var\\'', :\"^*& weird \\\" var   \";",
      {
        params: {
          variable: '"variable value"',
          'a1_2.3$': "'weird value'",
          'var name': "'var value'",
          "escaped 'var'": "'weirder value'",
          '^*& weird " var   ': "'super weird value'",
        },
      },
    );
    expect(result).toBe(
      'SELECT\n' +
        '  "variable value",\n' +
        "  'weird value',\n" +
        "  'var value',\n" +
        "  'var value',\n" +
        "  'var value',\n" +
        "  'var value',\n" +
        "  'weirder value',\n" +
        "  'super weird value';",
    );
  });

  it('recognizes ?[0-9]* placeholders', function() {
    const result = sqlFormatter.format('SELECT ?1, ?25, ?;');
    expect(result).toBe('SELECT\n' + '  ?1,\n' + '  ?25,\n' + '  ?;');
  });

  it('replaces ? numbered placeholders with param values', function() {
    const result = sqlFormatter.format('SELECT ?1, ?2, ?0;', {
      params: {
        0: 'first',
        1: 'second',
        2: 'third',
      },
    });
    expect(result).toBe('SELECT\n' + '  second,\n' + '  third,\n' + '  first;');
  });

  it('replaces ? indexed placeholders with param values', function() {
    const result = sqlFormatter.format('SELECT ?, ?, ?;', {
      params: ['first', 'second', 'third'],
    });
    expect(result).toBe('SELECT\n' + '  first,\n' + '  second,\n' + '  third;');
  });

  it('formats query with GO batch separator', function() {
    const result = sqlFormatter.format('SELECT 1 GO SELECT 2', {
      params: ['first', 'second', 'third'],
    });
    expect(result).toBe('SELECT\n' + '  1\n' + 'GO\n' + 'SELECT\n' + '  2');
  });

  it('formats SELECT query with CROSS JOIN', function() {
    const result = sqlFormatter.format(
      'SELECT a, b FROM t CROSS JOIN t2 on t.id = t2.id_t',
    );
    expect(result).toBe(
      'SELECT\n' +
        '  a,\n' +
        '  b\n' +
        'FROM\n' +
        '  t\n' +
        '  CROSS JOIN t2 on t.id = t2.id_t',
    );
  });

  it('formats SELECT query with CROSS APPLY', function() {
    const result = sqlFormatter.format(
      'SELECT a, b FROM t CROSS APPLY fn(t.id)',
    );
    expect(result).toBe(
      'SELECT\n' +
        '  a,\n' +
        '  b\n' +
        'FROM\n' +
        '  t\n' +
        '  CROSS APPLY fn(t.id)',
    );
  });

  it('formats simple SELECT', function() {
    const result = sqlFormatter.format('SELECT N, M FROM t');
    expect(result).toBe('SELECT\n' + '  N,\n' + '  M\n' + 'FROM\n' + '  t');
  });

  it('formats simple SELECT with national characters (MSSQL)', function() {
    const result = sqlFormatter.format("SELECT N'value'");
    expect(result).toBe('SELECT\n' + "  N'value'");
  });

  it('formats SELECT query with OUTER APPLY', function() {
    const result = sqlFormatter.format(
      'SELECT a, b FROM t OUTER APPLY fn(t.id)',
    );
    expect(result).toBe(
      'SELECT\n' +
        '  a,\n' +
        '  b\n' +
        'FROM\n' +
        '  t\n' +
        '  OUTER APPLY fn(t.id)',
    );
  });

  it('formats FETCH FIRST like LIMIT', function() {
    const result = sqlFormatter.format('SELECT * FETCH FIRST 2 ROWS ONLY;');
    expect(result).toBe(
      'SELECT\n' + '  *\n' + 'FETCH FIRST\n' + '  2 ROWS ONLY;',
    );
  });

  it('formats CASE ... WHEN with a blank expression', function() {
    const result = sqlFormatter.format(
      "CASE WHEN option = 'foo' THEN 1 WHEN option = 'bar' THEN 2 WHEN option = 'baz' THEN 3 ELSE 4 END;",
    );

    expect(result).toBe(
      'CASE\n' +
        "  WHEN option = 'foo' THEN 1\n" +
        "  WHEN option = 'bar' THEN 2\n" +
        "  WHEN option = 'baz' THEN 3\n" +
        '  ELSE 4\n' +
        'END;',
    );
  });

  it('formats CASE ... WHEN inside SELECT', function() {
    const result = sqlFormatter.format(
      "SELECT foo, bar, CASE baz WHEN 'one' THEN 1 WHEN 'two' THEN 2 ELSE 3 END FROM table",
    );

    expect(result).toBe(
      'SELECT\n' +
        '  foo,\n' +
        '  bar,\n' +
        '  CASE\n' +
        '    baz\n' +
        "    WHEN 'one' THEN 1\n" +
        "    WHEN 'two' THEN 2\n" +
        '    ELSE 3\n' +
        '  END\n' +
        'FROM\n' +
        '  table',
    );
  });

  it('formats CASE ... WHEN with an expression', function() {
    const result = sqlFormatter.format(
      "CASE toString(getNumber()) WHEN 'one' THEN 1 WHEN 'two' THEN 2 WHEN 'three' THEN 3 ELSE 4 END;",
    );

    expect(result).toBe(
      'CASE\n' +
        '  toString(getNumber())\n' +
        "  WHEN 'one' THEN 1\n" +
        "  WHEN 'two' THEN 2\n" +
        "  WHEN 'three' THEN 3\n" +
        '  ELSE 4\n' +
        'END;',
    );
  });

  it('recognizes lowercase CASE ... END', function() {
    const result = sqlFormatter.format(
      "case when option = 'foo' then 1 else 2 end;",
    );

    expect(result).toBe(
      'case\n' + "  when option = 'foo' then 1\n" + '  else 2\n' + 'end;',
    );
  });

  // Regression test for issue #43
  it('ignores words CASE and END inside other strings', function() {
    const result = sqlFormatter.format('SELECT CASEDATE, ENDDATE FROM table1;');

    expect(result).toBe(
      'SELECT\n' + '  CASEDATE,\n' + '  ENDDATE\n' + 'FROM\n' + '  table1;',
    );
  });

  it('formats tricky line comments', function() {
    expect(sqlFormatter.format('SELECT a#comment, here\nFROM b--comment')).toBe(
      'SELECT\n' + '  a #comment, here\n' + 'FROM\n' + '  b --comment',
    );
  });

  it('formats line comments followed by semicolon', function() {
    expect(sqlFormatter.format('SELECT a FROM b\n--comment\n;')).toBe(
      'SELECT\n' + '  a\n' + 'FROM\n' + '  b --comment\n' + ';',
    );
  });

  it('formats line comments followed by comma', function() {
    expect(sqlFormatter.format('SELECT a --comment\n, b')).toBe(
      'SELECT\n' + '  a --comment\n' + ',\n' + '  b',
    );
  });

  it('formats line comments followed by close-paren', function() {
    expect(sqlFormatter.format('SELECT ( a --comment\n )')).toBe(
      'SELECT\n' + '  (a --comment\n' + ')',
    );
  });

  it('formats line comments followed by open-paren', function() {
    expect(sqlFormatter.format('SELECT a --comment\n()')).toBe(
      'SELECT\n' + '  a --comment\n' + '  ()',
    );
  });

  it('formats lonely semicolon', function() {
    expect(sqlFormatter.format(';')).toBe(';');
  });
}
