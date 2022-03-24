const express = require('express');

const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

router.get("/", async function (req, res, next) {
    try {
        const dbQuery = await db.query(`
            SELECT industries.code, industry, companies.code AS comp_code
            FROM industries
            LEFT JOIN com_industry ON industries.code = com_industry.industry_code
            LEFT JOIN companies ON com_industry.comp_code = companies.code
            `);

        let industries = [];
        const results = dbQuery.rows;
        let industries_codes = [...new Set(results.map(r => r.code))];

        for (let i of industries_codes) {
            let applied_comp = results.filter(r => r.code === i);
            let companies = applied_comp.map(r => r.comp_code);
            industries.push({
                code : applied_comp[0].code, 
                industry : applied_comp[0].industry, 
                companies : companies});
        }

        return res.json(industries);
    }

    catch (err) {
        return next(err);
    }
});

router.post("/", async function (req, res, next) {
    try {
        const result = await db.query(`
            INSERT INTO industries (code, industry)
            VALUES ($1, $2)
            RETURNING id, code, industry`,
            [req.body.code, req.body.industry]);

        return res.status(201).json({ industry: result.rows[0] });
    } catch (err) {
        return next(err);
    }
});

router.get("/:code", async function (req, res, next) {
    try {
        const result = await db.query(`
            SELECT industries.code, industry, companies.code AS comp_code
            FROM industries
            LEFT JOIN com_industry ON industries.code = com_industry.industry_code
            LEFT JOIN companies ON com_industry.comp_code = companies.code
            WHERE industries.code = $1`,
            [req.params.code]);

        let { code, industry } = result.rows[0];
        let companies = result.rows.map(r => r.comp_code);
        return res.json({ code, industry, companies });
    } catch (err) {
        return next(err);
    }
});

router.post("/:code", async function (req, res, next) {
    try {
        const result = await db.query(`
        INSERT INTO com_industry(comp_code, industry_code)
        VALUES ($1, $2)
        RETURNING id, comp_code, industry_code`,
        [req.body.comp, req.params.code]);

        return res.json(result.rows[0]);
    } catch (err) {
        return next(err)
    }
    
});


module.exports = router;