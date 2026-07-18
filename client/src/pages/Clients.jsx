import { useEffect, useState } from "react";
import api from "../services/api";

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem
} from "@mui/material";


function Clients() {


const emptyForm = {

  name:"",
  phone:"",
  email:"",
  address:"",
  company_name:"",
  status:"نشط",
  tax_number:""

};



const [clients,setClients]=useState([]);

const [open,setOpen]=useState(false);

const [editId,setEditId]=useState(null);

const [search,setSearch]=useState("");

const [form,setForm]=useState(emptyForm);





useEffect(()=>{

 loadClients();

},[]);





async function loadClients(){

try{

 const res=await api.get("/clients");

 setClients(res.data);

}catch(err){

 console.log(err);

}

}







function openAdd(){

setEditId(null);

setForm(emptyForm);

setOpen(true);

}







function openEdit(client){


setEditId(client.id);


setForm({

 name:client.name || "",
 phone:client.phone || "",
 email:client.email || "",
 address:client.address || "",
 company_name:client.company_name || "",
 status:client.status || "نشط",
 tax_number:client.tax_number || ""

});


setOpen(true);


}








function change(e){

setForm({

 ...form,

 [e.target.name]:e.target.value

});


}









async function saveClient(){


try{


if(editId){


 await api.put(

 `/clients/${editId}`,

 form

 );


}else{


 await api.post(

 "/clients",

 form

 );


}



setOpen(false);

loadClients();


}catch(err){

console.log(err);

alert("خطأ أثناء الحفظ");

}


}









async function deleteClient(id){


if(!window.confirm("هل تريد حذف العميل؟"))
return;



await api.delete(`/clients/${id}`);


loadClients();


}








return (

<div>


<Typography variant="h4" gutterBottom>

👥 إدارة العملاء

</Typography>




<Button

variant="contained"

sx={{mb:2}}

onClick={openAdd}

>

➕ إضافة عميل

</Button>





<TextField

fullWidth

label="🔍 البحث"

margin="normal"

value={search}

onChange={(e)=>setSearch(e.target.value)}

/>








<Dialog

open={open}

onClose={()=>setOpen(false)}

>


<DialogTitle>

{editId ? "تعديل العميل":"إضافة عميل"}

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

label="اسم الشركة"

name="company_name"

value={form.company_name}

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

label="البريد"

name="email"

value={form.email}

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

label="الرقم الجبائي"

name="tax_number"

value={form.tax_number}

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





</DialogContent>





<DialogActions>


<Button onClick={()=>setOpen(false)}>

إلغاء

</Button>



<Button

variant="contained"

onClick={saveClient}

>

حفظ

</Button>


</DialogActions>



</Dialog>










<TableContainer component={Paper}>


<Table>


<TableHead>


<TableRow>


<TableCell>رقم العميل</TableCell>

<TableCell>الاسم</TableCell>

<TableCell>الشركة</TableCell>

<TableCell>الهاتف</TableCell>

<TableCell>الحالة</TableCell>

<TableCell>الرقم الجبائي</TableCell>

<TableCell>الإجراءات</TableCell>


</TableRow>


</TableHead>





<TableBody>



{

clients

.filter(c=>

(c.name || "").toLowerCase()
.includes(search.toLowerCase())

)

.map(client=>(


<TableRow key={client.id}>


<TableCell>

{client.client_code || "-"}

</TableCell>



<TableCell>

{client.name}

</TableCell>




<TableCell>

{client.company_name || "-"}

</TableCell>



<TableCell>

{client.phone}

</TableCell>




<TableCell>

{client.status || "نشط"}

</TableCell>



<TableCell>

{client.tax_number || "-"}

</TableCell>





<TableCell>


<Button

variant="contained"

sx={{mr:1}}

onClick={()=>openEdit(client)}

>

✏️ تعديل

</Button>




<Button

color="error"

variant="contained"

onClick={()=>deleteClient(client.id)}

>

🗑 حذف

</Button>



</TableCell>



</TableRow>



))


}



</TableBody>



</Table>


</TableContainer>



</div>

);


}


export default Clients;