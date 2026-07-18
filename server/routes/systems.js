const express = require("express");
const router = express.Router();

const db = require("../database");


// عرض كل الأنظمة
router.get("/", (req, res) => {

  db.all(
    `
    SELECT *
    FROM systems
    ORDER BY id DESC
    `,
    [],
    (err, rows) => {

      if (err) {
        return res.status(500).json({
          error: err.message
        });
      }

      res.json(rows);

    }
  );

});




// إضافة نظام جديد
router.post("/", (req, res) => {

  const {
    name,
    type,
    resin_consumption,
    hardener_ratio,
    primer_consumption,
    sand_consumption,
    drying_time,
    notes
  } = req.body;


  db.run(
    `
    INSERT INTO systems
    (
      name,
      type,
      resin_consumption,
      hardener_ratio,
      primer_consumption,
      sand_consumption,
      drying_time,
      notes
    )

    VALUES (?, ?, ?, ?, ?, ?, ?, ?)

    `,
    [
      name,
      type,
      resin_consumption,
      hardener_ratio,
      primer_consumption,
      sand_consumption,
      drying_time,
      notes
    ],

    function(err){

      if(err){

        return res.status(500).json({
          error: err.message
        });

      }


      res.json({

        success:true,

        id:this.lastID,

        message:"تم إضافة النظام بنجاح"

      });


    }

  );


});





// تعديل نظام
router.put("/:id", (req,res)=>{

  const id = req.params.id;


  const {
    name,
    type,
    resin_consumption,
    hardener_ratio,
    primer_consumption,
    sand_consumption,
    drying_time,
    notes
  } = req.body;



  db.run(

    `
    UPDATE systems SET

    name=?,
    type=?,
    resin_consumption=?,
    hardener_ratio=?,
    primer_consumption=?,
    sand_consumption=?,
    drying_time=?,
    notes=?

    WHERE id=?

    `,

    [
      name,
      type,
      resin_consumption,
      hardener_ratio,
      primer_consumption,
      sand_consumption,
      drying_time,
      notes,
      id
    ],


    function(err){

      if(err){

        return res.status(500).json({
          error:err.message
        });

      }


      res.json({

        success:true,

        message:"تم تعديل النظام"

      });


    }

  );


});





// حذف نظام
router.delete("/:id",(req,res)=>{


  db.run(

    "DELETE FROM systems WHERE id=?",

    [req.params.id],


    function(err){

      if(err){

        return res.status(500).json({
          error:err.message
        });

      }


      res.json({

        success:true,

        message:"تم حذف النظام"

      });


    }

  );


});



module.exports = router;