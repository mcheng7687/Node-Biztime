const express = require('express');

const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");
const slugify = require("slugify");

router.get("/", async function (req, res, next) {
    try {
        const results = await db.query(`
            SELECT code, name, description 
            FROM companies`);

        return res.json({ companies: results.rows });
    }

    catch (err) {
        return next(err);
    }
});

router.get("/:code", async function (req, res, next) {
    try {
        const compQuery = await db.query(`
            SELECT companies.code AS company_code, name, description, industries.code AS industry_code 
            FROM companies 
            LEFT JOIN com_industry ON companies.code = com_industry.comp_code
            LEFT JOIN industries ON com_industry.industry_code = industries.code
            WHERE companies.code=$1`,
            [req.params.code]);

        if (compQuery.rows.length === 0) {
            let notFoundError = new Error(`There is no company with code id '${req.params.code}'`);
            notFoundError.status = 404;
            throw notFoundError;
        }

        const invoiceQuery = await db.query(`
            SELECT id, comp_code, amt, paid, add_date, paid_date 
            FROM invoices 
            WHERE comp_code=$1`, [compQuery.rows[0].company_code]);

        let {company_code, name, description} = compQuery.rows[0];
        let industries = compQuery.rows.map(r => r.industry_code);
        let invoices = invoiceQuery.rows;

        return res.json({company_code, name, description, industries, invoices});
    }
    catch (err) {
        return next(err);
    }
});

router.post("/", async function (req, res, next) {
    try {
        let companyCode = req.body.code;
        if (companyCode === undefined)
            companyCode = slugify(req.body.name, {lower: true, strict: true});

        const result = await db.query(`
            INSERT INTO companies
            VALUES ($1, $2, $3) 
            RETURNING code, name, description`,
            [companyCode, req.body.name, req.body.description]);

        return res.status(201).json({ company: result.rows[0] });
    } catch (err) {
        return next(err);
    }
});

router.put("/:code", async function (req, res, next) {
    try {
        const result = await db.query(`
            UPDATE companies 
            SET name = $1, description = $2
            WHERE code = $3
            RETURNING code, name, description`,
            [req.body.name, req.body.description, req.params.code]);

        if (result.rows.length === 0) {
            throw new ExpressError(`There is no company with code id '${req.params.code}'`, 404);
        }

        return res.json({ company: result.rows[0] });
    } catch (err) {
        return next(err);
    }
});

router.delete("/:code", async function (req, res, next) {
    try {
        const result = await db.query(`
        DELETE FROM companies 
        WHERE code = $1 
        RETURNING code`, [req.params.code]);

        if (result.rows.length === 0) {
            throw new ExpressError(`There is no company with code id '${req.params.code}'`, 404);
        }
        return res.json({ status: "Deleted" });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;