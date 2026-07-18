const express = require("express");
const router = express.Router();

const db = require("../database");


// =======================================
// عرض جميع حركات المخزون
// =======================================

router.get("/", (req, res) => {


    db.all(

        `
        SELECT

        stock_movements.*,

        products.name AS product_name

        FROM stock_movements


        LEFT JOIN products

        ON stock_movements.product_id = products.id


        ORDER BY stock_movements.id DESC

        `,

        [],

        (err, rows) => {


            if(err){

                return res.status(500).json({

                    error:err.message

                });

            }


            res.json(rows);


        }

    );


});




// =======================================
// إضافة حركة مخزون
// =======================================

router.post("/", (req,res)=>{


    const {

        product_id,
        movement_type,
        quantity,
        notes

    } = req.body;




    db.run(

        `
        INSERT INTO stock_movements

        (

        product_id,
        movement_type,
        quantity,
        notes

        )

        VALUES (?,?,?,?)

        `,


        [

            product_id,
            movement_type,
            quantity,
            notes

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






// =======================================
// تعديل حركة مخزون
// =======================================

router.put("/:id",(req,res)=>{


    const id=req.params.id;


    const {

        product_id,
        movement_type,
        quantity,
        notes

    } = req.body;




    db.run(

        `
        UPDATE stock_movements SET


        product_id=?,

        movement_type=?,

        quantity=?,

        notes=?


        WHERE id=?


        `,


        [

            product_id,

            movement_type,

            quantity,

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

                message:"تم تعديل الحركة"

            });



        }


    );



});







// =======================================
// حذف حركة مخزون
// =======================================

router.delete("/:id",(req,res)=>{


    db.run(

        `

        DELETE FROM stock_movements

        WHERE id=?

        `,


        [

            req.params.id

        ],



        function(err){


            if(err){

                return res.status(500).json({

                    error:err.message

                });

            }



            res.json({

                success:true,

                message:"تم حذف الحركة"

            });



        }


    );


});





module.exports = router;