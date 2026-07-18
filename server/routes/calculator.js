const express = require("express");
const router = express.Router();

const db = require("../database");


// حساب تكلفة نظام رزين
router.get("/:systemId", (req,res)=>{


  const systemId = req.params.systemId;


  db.all(

    `
    SELECT

    products.name,

    products.unit,

    products.purchase_price,

    system_products.consumption


    FROM system_products


    JOIN products

    ON products.id = system_products.product_id


    WHERE system_products.system_id = ?

    `,


    [systemId],


    (err,rows)=>{


      if(err){

        return res.status(500).json({

          error:err.message

        });

      }


      res.json(rows);


    }


  );


});



module.exports = router;