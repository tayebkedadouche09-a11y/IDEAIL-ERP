const express = require("express");
const router = express.Router();

const db = require("../database");
const { refreshProjectProfitability } = require("../controllers/profitability");
const { eventBus } = require("../services/events");



// =======================================
// GET PROJECT MATERIALS
// =======================================

router.get("/:project_id",(req,res)=>{


db.all(

`
SELECT

project_materials.*,

products.name AS product_name,

products.unit,

products.purchase_price


FROM project_materials


LEFT JOIN products

ON project_materials.product_id = products.id


WHERE project_materials.project_id=?


ORDER BY project_materials.id DESC

`,

[req.params.project_id],

(err,rows)=>{


if(err){

return res.status(500).json({

error:err.message

});

}


res.json(rows);


});


});






// =======================================
// ADD MATERIAL
// =======================================

router.post("/",(req,res)=>{


const {

project_id,

product_id,

quantity,

notes

}=req.body;



if(!project_id || !product_id){

return res.status(400).json({

error:"بيانات ناقصة"

});

}






db.get(

`

SELECT purchase_price

FROM products

WHERE id=?

`,

[product_id],

(err,product)=>{


if(err){

return res.status(500).json({

error:err.message

});

}




if(!product){

return res.status(404).json({

error:"المادة غير موجودة"

});

}




const total_cost =

Number(quantity || 0)

*

Number(product.purchase_price || 0);







db.run(

`

INSERT INTO project_materials

(

project_id,

product_id,

quantity,

total_cost,

notes

)

VALUES(?,?,?,?,?)

`,

[

project_id,

product_id,

quantity || 0,

total_cost,

notes || ""

],

function(err){


if(err){

return res.status(500).json({

error:err.message

});

}



refreshProjectProfitability(db, project_id, (profitErr, summary) => {

if(profitErr){

return res.status(500).json({

error:profitErr.message

});

}

// Emit MaterialAdded event
eventBus.emit("MaterialAdded", { 
  materialId: this.lastID, 
  projectId: project_id,
  productId: product_id,
  quantity: quantity,
  totalCost: total_cost
}, db);

res.json({

success:true,

id:this.lastID,

total_cost,

profitability:summary

});

});


}



);


}



);


});







// =======================================
// DELETE MATERIAL
// =======================================

router.delete("/:id",(req,res)=>{


db.get(

`SELECT project_id FROM project_materials WHERE id=?`,

[req.params.id],

(err,material)=>{

if(err){

return res.status(500).json({

error:err.message

});

}

if(!material){

return res.status(404).json({

error:"المادة غير موجودة"

});

}


db.run(

`

DELETE FROM project_materials

WHERE id=?

`,

[req.params.id],

function(deleteErr){

if(deleteErr){

return res.status(500).json({

error:deleteErr.message

});

}

refreshProjectProfitability(db, material.project_id, (profitErr, summary) => {

if(profitErr){

return res.status(500).json({

error:profitErr.message

});

}

res.json({

success:true,

profitability:summary

});

});

}

);

}

);


});

module.exports = router;