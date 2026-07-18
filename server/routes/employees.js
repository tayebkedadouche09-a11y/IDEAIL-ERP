const express = require("express");
const router = express.Router();

const db = require("../database");


// =======================================
// عرض جميع العمال
// ترقيم تلقائي حسب الترتيب
// =======================================

router.get("/", (req,res)=>{

db.all(

`
SELECT *
FROM employees
ORDER BY id ASC
`,

[],

(err,rows)=>{

if(err){

return res.status(500).json({
error:err.message
});

}


// إعادة إنشاء الرقم تلقائيا
const employees = rows.map((emp,index)=>({

...emp,

employee_code:
"EMP-" + String(index + 1).padStart(4,"0")

}));


res.json(employees);


}

);


});




// =======================================
// إضافة عامل
// =======================================

router.post("/",(req,res)=>{


const {

name,
phone,
address,
job_title,
specialty,
salary_type,
daily_rate,
hourly_rate,
monthly_salary,
status,
notes

}=req.body;



if(!name){

return res.status(400).json({

error:"اسم العامل مطلوب"

});

}



db.run(

`

INSERT INTO employees

(

name,
phone,
address,
job_title,
specialty,
salary_type,
daily_rate,
hourly_rate,
monthly_salary,
status,
notes

)

VALUES (?,?,?,?,?,?,?,?,?,?,?)

`,

[

name,
phone,
address,
job_title,
specialty,
salary_type,
daily_rate,
hourly_rate,
monthly_salary,
status || "نشط",
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

id:this.lastID,

message:"تمت إضافة العامل"

});


}



);


});





// =======================================
// تعديل عامل
// =======================================

router.put("/:id",(req,res)=>{


const id=req.params.id;


const {

name,
phone,
address,
job_title,
specialty,
salary_type,
daily_rate,
hourly_rate,
monthly_salary,
status,
notes

}=req.body;



db.run(

`

UPDATE employees SET

name=?,
phone=?,
address=?,
job_title=?,
specialty=?,
salary_type=?,
daily_rate=?,
hourly_rate=?,
monthly_salary=?,
status=?,
notes=?

WHERE id=?

`,

[

name,
phone,
address,
job_title,
specialty,
salary_type,
daily_rate,
hourly_rate,
monthly_salary,
status,
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

message:"تم تعديل العامل"

});


}



);


});






// =======================================
// حذف عامل
// =======================================

router.delete("/:id",(req,res)=>{


db.run(

"DELETE FROM employees WHERE id=?",

[req.params.id],


function(err){


if(err){

return res.status(500).json({

error:err.message

});

}


res.json({

success:true,

message:"تم حذف العامل"

});


}


);


});




module.exports = router;