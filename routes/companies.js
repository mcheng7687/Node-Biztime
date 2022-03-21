const express = require('express');

const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError")

router.get("/", async function (req, res, next) {
    try {
        const results = await db.query(
            `SELECT code,name FROM companies`);

        return res.json({ companies: results.rows });
    }

    catch (err) {
        return next(err);
    }
});

router.get("/:code", async function (req, res, next) {
    try {
        const compQuery = await db.query(
            `SELECT code,name,description FROM companies 
            WHERE code=$1`, 
            [req.params.code]);

        if (compQuery.rows.length === 0) {
            let notFoundError = new Error(`There is no company with code id '${req.params.code}`);
            notFoundError.status = 404;
            throw notFoundError;
        }

        const invoiceQuery = await db.query(
            `SELECT id, comp_code, amt, paid, add_date, paid_date 
            FROM invoices 
            WHERE comp_code=$1`, [compQuery.rows[0].code]);

        let compInfo = compQuery.rows[0];
        compInfo.invoices = invoiceQuery.rows;

        return res.json({ company: compInfo });
    }
    catch (err) {
        return next(err);
    }
});

router.post("/", async function (req, res, next) {
    try {
        const result = await db.query(
            `INSERT INTO companies
            VALUES ($1, $2, $3) 
            RETURNING code, name, description`,
            [req.body.code, req.body.name, req.body.description]);

        return res.status(201).json({ company: result.rows[0] });
    } catch (err) {
        return next(err);
    }
});

router.put("/:code", async function (req, res, next) {
    try {
        const result = await db.query(
            `UPDATE companies 
            SET name = $1, description = $2
            WHERE code = $3
            RETURNING code, name, description`,
            [req.body.name, req.body.description, req.params.code]);

        if (result.rows.length === 0) {
            throw new ExpressError(`There is no company with code id '${req.params.code}`, 404);
        }

        return res.json({ company: result.rows[0] });
    } catch (err) {
        return next(err);
    }
});

router.delete("/:code", async function(req, res, next) {
    try {
      const result = await db.query(
        "DELETE FROM companies WHERE code = $1 RETURNING code", [req.params.code]);
  
      if (result.rows.length === 0) {
        throw new ExpressError(`There is no company with code id '${req.params.code}`, 404);
      }
      return res.json({ status: "Deleted" });
    } catch (err) {
      return next(err);
    }
  });

module.exports = router;