\c biztime

DROP TABLE IF EXISTS com_industry;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS industries;

CREATE TABLE companies (
    code text PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text
);

CREATE TABLE industries (
    code text PRIMARY KEY,
    industry text NOT NULL UNIQUE
);

CREATE TABLE com_industry (
    id SERIAL PRIMARY KEY,
    comp_code text NOT NULL REFERENCES companies(code) ON DELETE CASCADE,
    industry_code text NOT NULL REFERENCES industries(code) ON DELETE CASCADE
);

CREATE TABLE invoices (
    id serial PRIMARY KEY,
    comp_code text NOT NULL REFERENCES companies(code) ON DELETE CASCADE,
    amt float NOT NULL,
    paid boolean DEFAULT false NOT NULL,
    add_date date DEFAULT CURRENT_DATE NOT NULL,
    paid_date date,
    CONSTRAINT invoices_amt_check CHECK ((amt > (0)::double precision))
);

INSERT INTO companies
  VALUES ('apl', 'Apple Computer', 'Maker of OSX.'),
         ('ibm', 'IBM', 'Big blue.'),
         ('goog', 'Google', 'Search engine.'),
         ('amzn', 'Amazon', 'Largest e-commerce conglomerate'),
         ('dis', 'Disney', 'Owner of Marvel.');

INSERT INTO invoices (comp_code, amt, paid, paid_date)
  VALUES ('apl', 100, false, null),
         ('apl', 200, false, null),
         ('apl', 300, true, '2018-01-01'),
         ('ibm', 400, false, null),
         ('goog', 1000, false, null),
         ('dis', 500, true, '2018-03-24'),
         ('amzn', 600, false, null),
         ('amzn', 900, true, '2015-05-21');

INSERT INTO industries
  VALUES ('comp', 'Computer Hardware'),
         ('www', 'Internet'),
         ('ent', 'Entertainment');

INSERT INTO com_industry(comp_code, industry_code)
  VALUES ('apl', 'comp'),
         ('ibm', 'comp'),
         ('goog', 'www'),
         ('goog', 'ent'),
         ('apl', 'ent'),
         ('amzn', 'ent'),
         ('amzn', 'www'),
         ('dis', 'ent'),
         ('apl', 'www');