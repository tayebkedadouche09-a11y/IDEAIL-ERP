const express = require("express");
const router = express.Router();

const db = require("../database");



// =======================================
// عرض كل المواد
// =======================================

router.get("/", (req,res)=>{


  db.all(

    `
    SELECT *

    FROM products

    ORDER BY id DESC

    `,

    [],

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








// =======================================
// إضافة مادة
// =======================================

router.post("/",(req,res)=>{


const {

name,
category,
unit,
purchase_price,
sale_price,
quantity,
minimum_quantity,
supplier

}=req.body;



db.run(

`

INSERT INTO products

(

name,
category,
unit,
purchase_price,
sale_price,
quantity,
minimum_quantity,
supplier

)

VALUES (?,?,?,?,?,?,?,?)

`,

[

name,
category,
unit,
purchase_price,
sale_price,
quantity,
minimum_quantity,
supplier

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
// تعديل مادة
// =======================================

router.put("/:id",(req,res)=>{


const id=req.params.id;



const {

name,
category,
unit,
purchase_price,
sale_price,
quantity,
minimum_quantity,
supplier

}=req.body;




db.run(

`

UPDATE products SET


name=?,

category=?,

unit=?,

purchase_price=?,

sale_price=?,

quantity=?,

minimum_quantity=?,

supplier=?


WHERE id=?


`,

[

name,
category,
unit,
purchase_price,
sale_price,
quantity,
minimum_quantity,
supplier,
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

message:"تم تعديل المادة"

});



}


);



});









// =======================================
// حذف مادة
// =======================================

router.delete("/:id",(req,res)=>{


db.run(

`

DELETE FROM products

WHERE id=?

`,

[req.params.id],



function(err){


if(err){

return res.status(500).json({

error:err.message

});

}



res.json({

success:true,

message:"تم حذف المادة"

});



}


);


});





module.exports = router;