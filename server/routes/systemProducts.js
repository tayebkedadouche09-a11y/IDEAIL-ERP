const express = require("express");
const router = express.Router();

const db = require("../database");


// عرض المواد الخاصة بنظام معين
router.get("/:systemId", (req,res)=>{

  db.all(
    `
    SELECT 
      system_products.id,
      products.name,
      products.unit,
      system_products.consumption

    FROM system_products

    JOIN products
    ON products.id = system_products.product_id

    WHERE system_products.system_id = ?

    `,
    [req.params.systemId],

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





// إضافة مادة إلى نظام
router.post("/",(req,res)=>{


  const {
    system_id,
    product_id,
    consumption
  } = req.body;



  db.run(

    `
    INSERT INTO system_products
    (
      system_id,
      product_id,
      consumption
    )

    VALUES (?,?,?)

    `,

    [
      system_id,
      product_id,
      consumption
    ],


    function(err){

      if(err){

        return res.status(500).json({
          error:err.message
        });

      }


      res.json({

        success:true,

        id:this.lastID

      });


    }

  );


});



module.exports = router;