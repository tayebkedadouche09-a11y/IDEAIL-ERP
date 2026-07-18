import { useEffect, useState } from "react";

import { useParams } from "react-router-dom";

import api from "../services/api";


import {
Paper,
Typography,
Button,
TextField,
MenuItem,
Table,
TableHead,
TableRow,
TableCell,
TableBody,
Divider
} from "@mui/material";




export default function ProjectDetails(){



const {id}=useParams();




const [project,setProject]=useState(null);

const [employees,setEmployees]=useState([]);

const [workers,setWorkers]=useState([]);

const [materials,setMaterials]=useState([]);




const [workerForm,setWorkerForm]=useState({

employee_id:"",
days_worked:1,
daily_rate:0,
notes:""

});






useEffect(()=>{


loadProject();

loadEmployees();

loadWorkers();

loadMaterials();


},[]);







async function loadProject(){


try{


const res=await api.get(`/projects/${id}`);

setProject(res.data);



}catch(err){

console.log(err);

}


}








async function loadEmployees(){


try{


const res=await api.get("/employees");

setEmployees(res.data);



}catch(err){

console.log(err);

}


}








async function loadWorkers(){


try{


const res=await api.get(`/projects/${id}/workers`);

setWorkers(res.data);



}catch(err){

console.log(err);

}


}








async function loadMaterials(){


try{


const res=await api.get(`/project-materials/${id}`);

setMaterials(res.data);



}catch(err){

console.log(err);

}


}







function changeWorker(e){


setWorkerForm({

...workerForm,

[e.target.name]:e.target.value


});


}







async function addWorker(){


if(!workerForm.employee_id){

alert("اختر العامل");

return;

}



try{


await api.post(

`/projects/${id}/workers`,

{

...workerForm,

days_worked:Number(workerForm.days_worked),

daily_rate:Number(workerForm.daily_rate)

}

);



loadWorkers();



setWorkerForm({

employee_id:"",
days_worked:1,
daily_rate:0,
notes:""

});



}catch(err){

console.log(err);

}


}
async function deleteWorker(workerId){


if(!window.confirm("هل تريد حذف العامل؟"))

return;



try{


await api.delete(

`/projects/${id}/workers/${workerId}`

);



loadWorkers();



}catch(err){

console.log(err);

}


}








const workerCost = workers.reduce(

(total,w)=>

total +

(

Number(w.days_worked || 0)

*

Number(w.daily_rate || 0)

),

0

);






const materialCost = materials.reduce(

(total,m)=>

total +

Number(m.total_cost || 0),

0

);






const totalCost =

workerCost +

materialCost;







const profit =

Number(project?.amount || 0)

-

totalCost;







const profitPercent =

project?.amount

?

((profit / project.amount)*100).toFixed(2)

:

0;









async function createInvoice(){


try{


const res = await api.post(

`/invoices/from-project/${id}`

);





alert(

"تم إنشاء الفاتورة رقم: "

+

res.data.invoice_number

);





window.open(

`http://localhost:3000/pdf/invoice/${res.data.id}`,

"_blank"

);





}catch(err){


console.log(err);


alert(

"خطأ أثناء إنشاء الفاتورة"

);


}


}







return (

<div>



<Typography

variant="h4"

gutterBottom

>

📁 تفاصيل المشروع

</Typography>






{
project &&

<Paper sx={{p:3,mb:3}}>


<Typography variant="h6">

المشروع: {project.name}

</Typography>



<Divider sx={{my:2}} />



<Typography>

العميل:

{" "}

{project.client_name || "-"}

</Typography>




<Typography>

النظام:

{" "}

{project.system_name || "-"}

</Typography>





<Typography>

قيمة المشروع:

{" "}

{project.amount || 0} DA

</Typography>



</Paper>

}







<Paper sx={{p:3,mb:3}}>


<Typography

variant="h5"

>

👷 العمال

</Typography>





<TextField

select

fullWidth

margin="normal"

label="العامل"

name="employee_id"

value={workerForm.employee_id}

onChange={changeWorker}

>


{

employees.map(emp=>(


<MenuItem

key={emp.id}

value={emp.id}

>

{emp.name}

</MenuItem>


))


}


</TextField>





<TextField

fullWidth

margin="normal"

type="number"

label="عدد الأيام"

name="days_worked"

value={workerForm.days_worked}

onChange={changeWorker}

/>





<TextField

fullWidth

margin="normal"

type="number"

label="سعر اليوم"

name="daily_rate"

value={workerForm.daily_rate}

onChange={changeWorker}

/>





<Button

variant="contained"

onClick={addWorker}

>

➕ إضافة عامل

</Button><Table sx={{mt:3}}>

<TableHead>

<TableRow>

<TableCell>العامل</TableCell>

<TableCell>الأيام</TableCell>

<TableCell>الأجرة</TableCell>

<TableCell>التكلفة</TableCell>

<TableCell>حذف</TableCell>

</TableRow>

</TableHead>


<TableBody>


{

workers.map(w=>(


<TableRow key={w.id}>


<TableCell>

{w.employee_name}

</TableCell>


<TableCell>

{w.days_worked}

</TableCell>


<TableCell>

{w.daily_rate} DA

</TableCell>


<TableCell>

{

Number(w.days_worked)

*

Number(w.daily_rate)

} DA

</TableCell>



<TableCell>

<Button

color="error"

onClick={()=>deleteWorker(w.id)}

>

🗑

</Button>

</TableCell>


</TableRow>


))


}


</TableBody>


</Table>


</Paper>







<Paper sx={{p:3,mt:3}}>


<Typography

variant="h5"

>

📦 مواد المشروع

</Typography>



<Table>


<TableHead>


<TableRow>


<TableCell>

المادة

</TableCell>


<TableCell>

الكمية

</TableCell>


<TableCell>

التكلفة

</TableCell>


</TableRow>


</TableHead>



<TableBody>


{

materials.map(m=>(


<TableRow key={m.id}>


<TableCell>

{m.product_name}

</TableCell>


<TableCell>

{m.quantity}

</TableCell>


<TableCell>

{m.total_cost} DA

</TableCell>


</TableRow>


))


}


</TableBody>


</Table>


</Paper>







<Paper sx={{p:3,mt:3}}>


<Typography

variant="h5"

gutterBottom

>

💰 الحساب النهائي

</Typography>



<Divider sx={{my:2}} />



<Typography>

تكلفة العمال:

<strong>

{" "}

{workerCost} DA

</strong>

</Typography>



<Typography>

تكلفة المواد:

<strong>

{" "}

{materialCost} DA

</strong>

</Typography>




<Typography>

التكلفة الإجمالية:

<strong>

{" "}

{totalCost} DA

</strong>

</Typography>





<Typography

variant="h6"

sx={{mt:2}}

>

الربح المتوقع:

<strong>

{" "}

{profit} DA

</strong>

</Typography>




<Typography>

نسبة الربح:

<strong>

{" "}

{profitPercent} %

</strong>

</Typography>






<Button

variant="contained"

color="success"

sx={{mt:3}}

onClick={createInvoice}

>

🧾 إنشاء فاتورة PDF

</Button>




</Paper>





</div>

);


}