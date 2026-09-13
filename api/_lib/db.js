const { Pool } = require("pg");

let pool;

function getDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
      ssl: { rejectUnauthorized: false }
    });
  }

  return function query(strings, ...values) {
    let text = strings[0];
    const parameters = [];

    values.forEach((value, index) => {
      if (value && value.__sqlFragment) {
        const offset = parameters.length;
        text += value.text.replace(/\$(\d+)/g, (_, number) => `$${Number(number) + offset}`);
        parameters.push(...value.values);
      } else {
        parameters.push(value);
        text += `$${parameters.length}`;
      }
      text += strings[index + 1];
    });

    return {
      __sqlFragment: true,
      text,
      values: parameters,
      then(resolve, reject) {
        return pool.query(text, parameters).then((result) => result.rows).then(resolve, reject);
      }
    };
  };
}

module.exports = { getDatabase };
