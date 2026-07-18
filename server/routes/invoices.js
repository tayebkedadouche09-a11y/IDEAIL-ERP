const express = require("express");

const router = express.Router();

const db = require("../database");




// =======================================
// GET ALL INVOICES
// =======================================


router.get("/",(req,res)=>{


db.all(

`
SELECT

invoices.*,

clients.name AS client_name,

projects.name AS project_name


FROM invoices


LEFT JOIN clients

ON invoices.client_id = clients.id


LEFT JOIN projects

ON invoices.project_id = projects.id


ORDER BY invoices.id DESC

`,

[],

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
// GET SINGLE INVOICE
// =======================================


router.get("/:id",(req,res)=>{


db.get(

`
SELECT

invoices.*,

clients.name AS client_name,

clients.phone AS client_phone,

clients.address AS client_address,

projects.name AS project_name


FROM invoices


LEFT JOIN clients

ON invoices.client_id = clients.id


LEFT JOIN projects

ON invoices.project_id = projects.id


WHERE invoices.id=?

`,

[req.params.id],


(err,row)=>{


if(err){

return res.status(500).json({

error:err.message

});

}



if(!row){

return res.status(404).json({

error:"الفاتورة غير موجودة"

});

}



res.json(row);



});


});// =======================================
// CREATE INVOICE
// =======================================


router.post("/",(req,res)=>{


const {


client_id,

project_id,

amount,

status,

invoice_date,

signature


}=req.body;





const invoice_number =

"INV-" +

Date.now();






db.run(

`
INSERT INTO invoices

(

client_id,

project_id,

invoice_number,

amount,

status,

invoice_date,

signature

)

VALUES(?,?,?,?,?,?,?)

`,

[

client_id,

project_id || null,

invoice_number,

amount || 0,

status || "غير مدفوعة",

invoice_date,

signature || ""

],


function(err){


if(err){

return res.status(500).json({

error:err.message

});

}



res.json({

success:true,

id:this.lastID,

invoice_number

});



});


});








// =======================================
// CREATE INVOICE FROM PROJECT
// =======================================


router.post("/from-project/:project_id",(req,res)=>{


const project_id=req.params.project_id;





db.get(

`

SELECT

projects.*


FROM projects


WHERE projects.id=?

`,

[project_id],


(err,project)=>{


if(err){

return res.status(500).json({

error:err.message

});

}



if(!project){

return res.status(404).json({

error:"المشروع غير موجود"

});

}





const invoice_number =

"INV-" +

Date.now();





db.run(

`

INSERT INTO invoices

(

client_id,

project_id,

invoice_number,

amount,

status,

invoice_date

)

VALUES(?,?,?,?,?,?)

`,

[

project.client_id,

project.id,

invoice_number,

project.amount || 0,

"غير مدفوعة",

new Date().toISOString().slice(0,10)

],


function(err){


if(err){

return res.status(500).json({

error:err.message

});

}



res.json({

success:true,

id:this.lastID,

invoice_number

});



});


});


});// =======================================
// UPDATE INVOICE
// =======================================


router.put("/:id",(req,res)=>{


const {


amount,

status,

invoice_date,

signature


}=req.body;





db.run(

`

UPDATE invoices SET


amount=?,

status=?,

invoice_date=?,

signature=?


WHERE id=?

`,

[

amount || 0,

status,

invoice_date,

signature || "",

req.params.id

],


function(err){


if(err){

return res.status(500).json({

error:err.message

});

}



res.json({

success:true

});



});


});








// =======================================
// DELETE INVOICE
// =======================================


router.delete("/:id",(req,res)=>{


db.run(

`

DELETE FROM invoices

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

success:true

});



});


});






module.exports = router;