const express = require("express");
const router = express.Router();

const db = require("../database");



// =======================================
// GET ALL PROJECTS
// =======================================

router.get("/", (req,res)=>{


db.all(

`
SELECT

projects.*,

clients.name AS client_name,

systems.name AS system_name


FROM projects


LEFT JOIN clients

ON projects.client_id = clients.id


LEFT JOIN systems

ON projects.system_id = systems.id


ORDER BY projects.id ASC

`,

[],

(err,rows)=>{


if(err){

return res.status(500).json({

error:err.message

});

}




// إنشاء رقم عرض مرتب بدون تغيير ID

const projects = rows.map((project,index)=>({


...project,


project_code:

"PRO-" + String(index + 1).padStart(4,"0")


}));




res.json(projects);



});


});// =======================================
// GET PROJECT DETAILS
// =======================================


router.get("/:id",(req,res)=>{


db.get(

`
SELECT

projects.*,

clients.name AS client_name,

systems.name AS system_name


FROM projects


LEFT JOIN clients

ON projects.client_id = clients.id


LEFT JOIN systems

ON projects.system_id = systems.id


WHERE projects.id=?

`,

[req.params.id],


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



res.json(project);



});


});






// =======================================
// CREATE PROJECT
// =======================================


router.post("/",(req,res)=>{


const {

client_id,

system_id,

surface_m2,

name,

description,

start_date,

end_date,

status,

amount


}=req.body;





db.run(

`
INSERT INTO projects

(

client_id,

system_id,

surface_m2,

name,

description,

start_date,

end_date,

status,

amount

)

VALUES(?,?,?,?,?,?,?,?,?)

`,

[

client_id,

system_id || null,

surface_m2 || 0,

name,

description,

start_date,

end_date,

status || "جديد",

amount || 0

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



});


});// =======================================
// UPDATE PROJECT
// =======================================


router.put("/:id",(req,res)=>{


const {

client_id,

system_id,

surface_m2,

name,

description,

start_date,

end_date,

status,

amount


}=req.body;



db.run(

`
UPDATE projects SET

client_id=?,

system_id=?,

surface_m2=?,

name=?,

description=?,

start_date=?,

end_date=?,

status=?,

amount=?


WHERE id=?

`,

[

client_id,

system_id || null,

surface_m2 || 0,

name,

description,

start_date,

end_date,

status,

amount || 0,

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
// DELETE PROJECT
// =======================================


router.delete("/:id",(req,res)=>{


db.run(

`

DELETE FROM projects

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





// =======================================
// PROJECT WORKERS
// =======================================


router.get("/:id/workers",(req,res)=>{


db.all(

`
SELECT

project_workers.*,

employees.name AS employee_name


FROM project_workers


LEFT JOIN employees

ON project_workers.employee_id = employees.id


WHERE project_workers.project_id=?


ORDER BY project_workers.id DESC

`,

[req.params.id],


(err,rows)=>{


if(err){

return res.status(500).json({

error:err.message

});

}



res.json(rows);



});


});






router.post("/:id/workers",(req,res)=>{


const {

employee_id,

days_worked,

daily_rate,

notes


}=req.body;



const total_cost =

Number(days_worked || 0)

*

Number(daily_rate || 0);





db.run(

`

INSERT INTO project_workers

(

project_id,

employee_id,

days_worked,

daily_rate,

total_cost,

notes

)

VALUES(?,?,?,?,?,?)

`,

[

req.params.id,

employee_id,

days_worked || 0,

daily_rate || 0,

total_cost,

notes || ""

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

total_cost

});



});


});






router.delete("/:project_id/workers/:id",(req,res)=>{


db.run(

`

DELETE FROM project_workers

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