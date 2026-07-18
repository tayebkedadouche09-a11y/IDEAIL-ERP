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
  MenuItem,
} from "@mui/material";

import { useLanguage } from "../context/LanguageContext";


function Projects() {


const { t } = useLanguage();



const [projects,setProjects] = useState([]);

const [clients,setClients] = useState([]);

const [systems,setSystems] = useState([]);



const [open,setOpen] = useState(false);

const [editId,setEditId] = useState(null);



const emptyForm = {

client_id:"",
system_id:"",
name:"",
description:"",
surface_m2:0,
start_date:"",
end_date:"",
status:"جديد",
amount:""

};



const [form,setForm] = useState(emptyForm);






useEffect(()=>{

loadProjects();

loadClients();

loadSystems();

},[]);







async function loadProjects(){

try{


const res = await api.get("/projects");

setProjects(res.data);



}catch(err){

console.log(err);

}


}







async function loadClients(){

try{


const res = await api.get("/clients");

setClients(res.data);



}catch(err){

console.log(err);

}


}








async function loadSystems(){

try{


const res = await api.get("/systems");

setSystems(res.data);



}catch(err){

console.log(err);

}


}








function addNewProject(){


setEditId(null);

setForm(emptyForm);

setOpen(true);


}








function editProject(project){


setEditId(project.id);


setForm({

client_id:project.client_id || "",

system_id:project.system_id || "",

name:project.name || "",

description:project.description || "",

surface_m2:project.surface_m2 || 0,

start_date:project.start_date || "",

end_date:project.end_date || "",

status:project.status || "جديد",

amount:project.amount || ""


});


setOpen(true);


}








async function saveProject(){


try{


if(editId){


await api.put(

`/projects/${editId}`,

form

);



}else{


await api.post(

"/projects",

form

);



}



setOpen(false);

loadProjects();



}catch(err){


console.log(err);

alert("خطأ أثناء الحفظ");


}


}








async function deleteProject(id){


if(!window.confirm("هل تريد حذف المشروع؟"))

return;



try{


await api.delete(`/projects/${id}`);


loadProjects();



}catch(err){

console.log(err);

}


}


return (

<div>


<Typography variant="h4" gutterBottom>

📁 {t.projects}

</Typography>




<Button

variant="contained"

sx={{mb:2}}

onClick={addNewProject}

>

➕ {t.add}

</Button>






<Dialog

open={open}

onClose={()=>setOpen(false)}

>



<DialogTitle>

{editId ? t.edit : t.add} {t.projects}

</DialogTitle>





<DialogContent>





<TextField

select

fullWidth

margin="normal"

label={t.clients}

value={form.client_id}

onChange={(e)=>setForm({

...form,

client_id:e.target.value

})}

>



{

clients.map(client=>(


<MenuItem

key={client.id}

value={client.id}

>

{client.name}

</MenuItem>


))

}


</TextField>







<TextField

select

fullWidth

margin="normal"

label={t.system}

value={form.system_id}

onChange={(e)=>setForm({

...form,

system_id:e.target.value

})}

>


{

systems.map(system=>(


<MenuItem

key={system.id}

value={system.id}

>

{system.name}

</MenuItem>


))

}



</TextField>







<TextField

fullWidth

margin="normal"

label="اسم المشروع"

value={form.name}

onChange={(e)=>setForm({

...form,

name:e.target.value

})}

/>







<TextField

fullWidth

margin="normal"

label="المساحة m²"

type="number"

value={form.surface_m2}

onChange={(e)=>setForm({

...form,

surface_m2:e.target.value

})}

/>








<TextField

fullWidth

margin="normal"

label="الوصف"

value={form.description}

onChange={(e)=>setForm({

...form,

description:e.target.value

})}

/>








<TextField

fullWidth

margin="normal"

type="date"

label="تاريخ البداية"

InputLabelProps={{shrink:true}}

value={form.start_date}

onChange={(e)=>setForm({

...form,

start_date:e.target.value

})}

/>








<TextField

fullWidth

margin="normal"

type="date"

label="تاريخ النهاية"

InputLabelProps={{shrink:true}}

value={form.end_date}

onChange={(e)=>setForm({

...form,

end_date:e.target.value

})}

/>








<TextField

select

fullWidth

margin="normal"

label="الحالة"

value={form.status}

onChange={(e)=>setForm({

...form,

status:e.target.value

})}

>



<MenuItem value="جديد">

🟦 جديد

</MenuItem>



<MenuItem value="قيد التنفيذ">

🟨 قيد التنفيذ

</MenuItem>



<MenuItem value="مكتمل">

🟩 مكتمل

</MenuItem>



<MenuItem value="متوقف">

🟥 متوقف

</MenuItem>



</TextField>








<TextField

fullWidth

margin="normal"

label="المبلغ"

type="number"

value={form.amount}

onChange={(e)=>setForm({

...form,

amount:e.target.value

})}

/>






</DialogContent>








<DialogActions>


<Button

onClick={()=>setOpen(false)}

>

إلغاء

</Button>




<Button

variant="contained"

onClick={saveProject}

>

حفظ

</Button>



</DialogActions>





</Dialog>
<TableContainer component={Paper}>


<Table>



<TableHead>


<TableRow>


<TableCell>ID</TableCell>

<TableCell>{t.projects}</TableCell>

<TableCell>{t.clients}</TableCell>

<TableCell>{t.system}</TableCell>

<TableCell>{t.surface}</TableCell>

<TableCell>الحالة</TableCell>

<TableCell>المبلغ</TableCell>

<TableCell>الإجراءات</TableCell>


</TableRow>


</TableHead>







<TableBody>



{

projects.map(project=>(



<TableRow key={project.id}>




<TableCell>
{project.project_code}
</TableCell>





<TableCell>

{project.name}

</TableCell>



<TableCell>

{project.client_name || "-"}

</TableCell>



<TableCell>

{project.system_name || "-"}

</TableCell>



<TableCell>

{project.surface_m2} m²

</TableCell>



<TableCell>

{project.status}

</TableCell>



<TableCell>

{project.amount} DA

</TableCell>





<TableCell>





<Button

variant="contained"

sx={{mr:1}}

onClick={()=>editProject(project)}

>

✏️ تعديل

</Button>






<Button

variant="contained"

sx={{mr:1}}

onClick={()=>{

window.location.href=`/projects/${project.id}`

}}

>

📁 تفاصيل

</Button>







<Button

variant="contained"

color="error"

onClick={()=>deleteProject(project.id)}

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


export default Projects;