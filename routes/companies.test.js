// connect to right DB --- set before loading db.js
process.env.NODE_ENV = "test";

// npm packages
const request = require("supertest");

// app imports
const app = require("../app");
const db = require("../db");

let testCompany, testInvoice;

beforeEach(async function () {
    const newCompany = await db.query(`
        INSERT INTO companies 
        VALUES ('ABC', 'Alphabet City', 'Google parent company')
        RETURNING code, name, description`);
    testCompany = newCompany.rows[0];

    const newInvoice = await db.query(`
        INSERT INTO invoices (id, comp_code, amt)
        VALUES (1, 'ABC', 1000)
        RETURNING id, comp_code, amt, paid, add_date, paid_date`);
    testInvoice = newInvoice.rows[0];
});

afterEach(async function () {
    // delete any data created by test
    await db.query("DELETE FROM companies");
    await db.query("DELETE FROM invoices");
});

afterAll(async function () {
    // close db connection
    await db.end();
});

describe("GET /companies", function () {
    test("Gets a list of 1 company", async function () {
        const response = await request(app).get(`/companies`);

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ companies: [testCompany] });
    });
});

describe("GET /companies/:code", function () {
    test("Gets an object of 1 company with code", async function () {
        const response = await request(app).get(`/companies/${testCompany.code}`);
        testCompany.invoices = [testInvoice];

        expect(response.statusCode).toEqual(200);
        expect(JSON.stringify(response.body)).toEqual(JSON.stringify({ company: testCompany }));
    });

    test("Attempts to find company with code but returns 404", async function () {
        const response = await request(app).get(`/companies/zzz`);

        expect(response.statusCode).toEqual(404);
        expect(response.body.message).toEqual("There is no company with code id 'zzz'");
    });
});

describe("POST /companies", function () {
    test("Creates a new company", async function () {
        const response = await request(app)
            .post(`/companies`)
            .send({
                code: "amzn",
                name: "Amazon",
                description: "Largest ecommerce redistributor"
            });
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({
            company: { code: "amzn", name: "Amazon", description: "Largest ecommerce redistributor" }
        });
    });
});

describe("PUT /companies/:code", function () {
    test("Update an existing company", async function () {
        const response = await request(app)
            .put(`/companies/${testCompany.code}`)
            .send({
                name: "Google",
                description: "Best email and web search engine"
            });
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            company: { code: "ABC", name: "Google", description: "Best email and web search engine" }
        });
    });

    test("Attempts to update company with code but returns 404", async function () {
        const response = await request(app).put(`/companies/zzz`);

        expect(response.statusCode).toEqual(404);
        expect(response.body.message).toEqual("There is no company with code id 'zzz'");
    });
});

describe("DELETE /companies/:code", function () {
    test("Delete an existing company", async function () {
        const response = await request(app).delete(`/companies/${testCompany.code}`);

        expect(response.statusCode).toEqual(200);
        expect(response.body.status).toEqual("Deleted");
    });

    test("Attempts to delete company with code but returns 404", async function () {
        const response = await request(app).delete(`/companies/zzz`);

        expect(response.statusCode).toEqual(404);
        expect(response.body.message).toEqual("There is no company with code id 'zzz'");
    });
});