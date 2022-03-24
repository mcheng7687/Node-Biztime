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

describe("GET /invoices", function () {
    test("Gets a list of 1 invoice", async function () {
        const response = await request(app).get(`/invoices`);

        expect(response.statusCode).toEqual(200);
        expect(JSON.stringify(response.body)).toEqual(JSON.stringify({ invoices: [testInvoice] }));
    });
});

describe("GET /invoices/:code", function () {
    test("Gets an object of 1 invoice with id", async function () {
        const response = await request(app).get(`/invoices/${testInvoice.id}`);
        let compiledInvoice = testInvoice;
        compiledInvoice.company = testCompany;
        delete compiledInvoice.comp_code;

        expect(response.statusCode).toEqual(200);
        expect(JSON.stringify(response.body)).toEqual(JSON.stringify({ invoice: compiledInvoice }));
    });

    test("Attempts to find invoice with id but returns 404", async function () {
        const response = await request(app).get(`/invoices/1000`);

        expect(response.statusCode).toEqual(404);
        expect(response.body.message).toEqual("There is no invoice with id 1000");
    });
});

describe("POST /invoices", function () {
    test("Creates a new invoice", async function () {
        const response = await request(app)
            .post(`/invoices`)
            .send({
                comp_code: "ABC",
                amt: 5000.00
            });

        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({
            invoice: { id: expect.any(Number), comp_code: "ABC", amt: 5000, paid: false, add_date: expect.any(String), paid_date: null }
        });
    });
});

describe("PUT /invoices/:id", function () {
    test("Update an existing invoice", async function () {
        const response = await request(app)
            .put(`/invoices/${testInvoice.id}`)
            .send({ amt: 500 });

        expect(response.statusCode).toEqual(200);
        expect(response.body.invoice.amt).toEqual(500);
    });

    test("Attempts to update invoice with id but returns 404", async function () {
        const response = await request(app).put(`/invoices/1000`);

        expect(response.statusCode).toEqual(404);
        expect(response.body.message).toEqual("There is no invoice with id 1000");
    });
});

describe("DELETE /invoices/:code", function () {
    test("Delete an existing invoice", async function () {
        const response = await request(app).delete(`/invoices/${testInvoice.id}`);

        expect(response.statusCode).toEqual(200);
        expect(response.body.status).toEqual("Deleted");
    });

    test("Attempts to delete invoice with id but returns 404", async function () {
        const response = await request(app).delete(`/invoices/1000`);

        expect(response.statusCode).toEqual(404);
        expect(response.body.message).toEqual("There is no invoice with id 1000");
    });
});