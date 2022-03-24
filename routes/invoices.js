const express = require('express');

const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

router.get("/", async function (req, res, next) {
    try {
        const results = await db.query(`
            SELECT id, comp_code, amt, paid, add_date, paid_date 
            FROM invoices`);

        return res.json({ invoices: results.rows });
    }

    catch (err) {
        return next(err);
    }
});

router.get("/:id", async function (req, res, next) {
    try {
        const invoiceQuery = await db.query(`
            SELECT id, comp_code, amt, paid, add_date, paid_date 
            FROM invoices 
            WHERE id=$1`, [req.params.id]);

        if (invoiceQuery.rows.length === 0) {
            let notFoundError = new Error(`There is no invoice with id ${req.params.id}`);
            notFoundError.status = 404;
            throw notFoundError;
        }

        const compQuery = await db.query(`
            SELECT code,name,description 
            FROM companies 
            WHERE code=$1`, [invoiceQuery.rows[0].comp_code]);

        let invoiceInfo = invoiceQuery.rows[0];
        delete invoiceInfo.comp_code;
        invoiceInfo.company = compQuery.rows[0];

        return res.json({ invoice: invoiceInfo });
    }
    catch (err) {
        return next(err);
    }
});

router.post("/", async function (req, res, next) {
    try {
        const result = await db.query(`
            INSERT INTO invoices (comp_code, amt)
            VALUES ($1, $2) 
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [req.body.comp_code, req.body.amt]);

        return res.status(201).json({ invoice: result.rows[0] });
    } catch (err) {
        return next(err);
    }
});

router.put("/:id", async function (req, res, next) {
    try {

        let paid = req.body.paid;
        let paid_date;
        if (paid) {
            const today = new Date();
            paid_date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
        }
        else if (paid === false) {
            paid_date = null;
        }
        else {
            const paidDateQuery = await db.query(`
                SELECT paid, paid_date 
                FROM invoices 
                WHERE id = $1`,
                [req.params.id]);
            paid_date = paidDateQuery.rows[0].paid_date;
            paid = paidDateQuery.rows[0].paid;
        }

        const result = await db.query(`
            UPDATE invoices 
            SET amt = $1, paid = $3, paid_date = $4
            WHERE id = $2
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [req.body.amt, req.params.id, paid, paid_date]);

        if (result.rows.length === 0) {
            throw new ExpressError(`There is no invoice with id ${req.params.id}`, 404);
        }

        return res.json({ invoice: result.rows[0] });
        return res.json({r: paid});
    } catch (err) {
        return next(err);
    }
});

router.delete("/:id", async function (req, res, next) {
    try {
        const result = await db.query(`
        DELETE FROM invoices 
        WHERE id = $1 
        RETURNING id`, [req.params.id]);

        if (result.rows.length === 0) {
            throw new ExpressError(`There is no invoice with id ${req.params.id}`, 404);
        }
        return res.json({ status: "Deleted" });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;