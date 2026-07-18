import { useEffect, useState } from "react";
import api from "../services/api";

import {
  Paper,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem
} from "@mui/material";


export default function Employees(){


const emptyForm={

name:"",
phone:"",
address:"",
job_title:"",
specialty:"",
salary_type:"daily",
daily_rate:"",
hourly_rate:"",
monthly_salary:"",
status:"نشط",
notes:""

};



const [employees,setEmployees]=useState([]);

const [open,setOpen]=useState(false);

const [editId,setEditId]=useState(null);

const [form,setForm]=useState(emptyForm);





useEffect(()=>{

loadEmployees();

},[]);





async function loadEmployees(){

try{

const res=await api.get("/employees");

setEmployees(res.data);


}catch(err){

console.log(err);

}

}





function change(e){

setForm({

...form,

[e.target.name]:e.target.value

});

}





function addNew(){

setEditId(null);

setForm(emptyForm);

setOpen(true);

}






function editEmployee(emp){

setEditId(emp.id);


setForm({

name:emp.name || "",
phone:emp.phone || "",
address:emp.address || "",
job_title:emp.job_title || "",
specialty:emp.specialty || "",
salary_type:emp.salary_type || "daily",
daily_rate:emp.daily_rate || "",
hourly_rate:emp.hourly_rate || "",
monthly_salary:emp.monthly_salary || "",
status:emp.status || "نشط",
notes:emp.notes || ""

});


setOpen(true);


}







async function save(){


try{


if(editId){


await api.put(
`/employees/${editId}`,
form
);


}else{


await api.post(
"/employees",
form
);


}



setOpen(false);

loadEmployees();


}catch(err){

console.log(err);

}


}






async function remove(id){


if(!window.confirm("هل تريد حذف العامل؟"))
return;


await api.delete(`/employees/${id}`);


loadEmployees();


}






return(


<Paper sx={{p:3}}>


<Typography variant="h4" fontWeight="bold">

👷 Employees

</Typography>



<Button

variant="contained"

sx={{mt:2,mb:2}}

onClick={addNew}

>

➕ إضافة عامل

</Button>





<Table>


<TableHead>

<TableRow>

<TableCell>Code</TableCell>

<TableCell>الاسم</TableCell>

<TableCell>الهاتف</TableCell>

<TableCell>الوظيفة</TableCell>

<TableCell>الأجرة</TableCell>

<TableCell>الحالة</TableCell>

<TableCell>إجراءات</TableCell>

</TableRow>

</TableHead>





<TableBody>


{
employees.map(emp=>(


<TableRow key={emp.id}>


<TableCell>

{emp.employee_code}

</TableCell>


<TableCell>

{emp.name}

</TableCell>


<TableCell>

{emp.phone}

</TableCell>


<TableCell>

{emp.job_title}

</TableCell>


<TableCell>

{emp.daily_rate} DA

</TableCell>


<TableCell>

{emp.status}

</TableCell>



<TableCell>


<Button

variant="contained"

sx={{mr:1}}

onClick={()=>editEmployee(emp)}

>

✏️ تعديل

</Button>



<Button

color="error"

variant="contained"

onClick={()=>remove(emp.id)}

>

🗑 حذف

</Button>



</TableCell>


</TableRow>


))
}



</TableBody>


</Table>








<Dialog

open={open}

onClose={()=>setOpen(false)}

>


<DialogTitle>

{editId ? "تعديل عامل":"إضافة عامل"}

</DialogTitle>



<DialogContent>



<TextField

fullWidth

margin="normal"

label="الاسم"

name="name"

value={form.name}

onChange={change}

/>



<TextField

fullWidth

margin="normal"

label="الهاتف"

name="phone"

value={form.phone}

onChange={change}

/>



<TextField

fullWidth

margin="normal"

label="العنوان"

name="address"

value={form.address}

onChange={change}

/>



<TextField

fullWidth

margin="normal"

label="الوظيفة"

name="job_title"

value={form.job_title}

onChange={change}

/>



<TextField

fullWidth

margin="normal"

label="التخصص"

name="specialty"

value={form.specialty}

onChange={change}

/>




<TextField

select

fullWidth

margin="normal"

label="نوع الأجرة"

name="salary_type"

value={form.salary_type}

onChange={change}

>


<MenuItem value="daily">
يومي
</MenuItem>


<MenuItem value="monthly">
شهري
</MenuItem>


<MenuItem value="hourly">
بالساعة
</MenuItem>


</TextField>





<TextField

fullWidth

margin="normal"

label="سعر اليوم"

name="daily_rate"

type="number"

value={form.daily_rate}

onChange={change}

/>




<TextField

fullWidth

margin="normal"

label="الراتب الشهري"

name="monthly_salary"

type="number"

value={form.monthly_salary}

onChange={change}

/>





<TextField

select

fullWidth

margin="normal"

label="الحالة"

name="status"

value={form.status}

onChange={change}

>


<MenuItem value="نشط">
🟢 نشط
</MenuItem>


<MenuItem value="متوقف">
🔴 متوقف
</MenuItem>


</TextField>





<TextField

fullWidth

margin="normal"

label="ملاحظات"

name="notes"

value={form.notes}

onChange={change}

/>




</DialogContent>





<DialogActions>


<Button onClick={()=>setOpen(false)}>
إلغاء
</Button>


<Button

variant="contained"

onClick={save}

>

حفظ

</Button>


</DialogActions>



</Dialog>



</Paper>


);


}