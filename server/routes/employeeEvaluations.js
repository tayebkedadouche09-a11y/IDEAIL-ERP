const express = require("express");
const router = express.Router();

const db = require("../database");


// عرض تقييمات عامل

router.get("/:employee_id",(req,res)=>{


db.all(

`
SELECT 

employee_evaluations.*,

employees.name AS employee_name

FROM employee_evaluations

LEFT JOIN employees

ON employee_evaluations.employee_id = employees.id

WHERE employee_id = ?

ORDER BY id DESC

`,

[req.params.employee_id],

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





// إضافة تقييم

router.post("/",(req,res)=>{


const {

employee_id,
rating,
work_quality,
punctuality,
discipline,
absence_days,
projects_completed,
notes

}=req.body;



db.run(

`

INSERT INTO employee_evaluations

(
employee_id,
rating,
work_quality,
punctuality,
discipline,
absence_days,
projects_completed,
notes
)

VALUES (?,?,?,?,?,?,?,?)

`,

[

employee_id,
rating,
work_quality,
punctuality,
discipline,
absence_days,
projects_completed,
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





// حذف تقييم

router.delete("/:id",(req,res)=>{


db.run(

"DELETE FROM employee_evaluations WHERE id=?",

[req.params.id],

(err)=>{


if(err){

return res.status(500).json({
error:err.message
});

}


res.json({
success:true
});


}


);



});



module.exports=router;