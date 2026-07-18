import { useEffect, useState } from "react";
import api from "../services/api";

import {
  Paper,
  TextField,
  Button,
  Typography,
  Grid,
  Box
} from "@mui/material";


export default function CompanySettings(){


const [form,setForm] = useState({

 company_name:"",
 phone:"",
 email:"",
 address:"",
 rc:"",
 nif:"",
 nis:""

});


const [logo,setLogo] = useState(null);



useEffect(()=>{

 loadCompany();

},[]);




async function loadCompany(){

 try{

  const res = await api.get("/company");

  setForm({

   company_name:res.data.company_name || "",
   phone:res.data.phone || "",
   email:res.data.email || "",
   address:res.data.address || "",
   rc:res.data.rc || "",
   nif:res.data.nif || "",
   nis:res.data.nis || ""

  });


 }catch(error){

  console.log(error);

 }

}





function change(e){

 setForm({

  ...form,

  [e.target.name]:e.target.value

 });

}





async function save(){


try{


 const data = new FormData();



 Object.keys(form).forEach(key=>{

  data.append(
   key,
   form[key]
  );

 });



 if(logo){

  data.append(
   "logo",
   logo
  );

 }




 await api.post(

  "/company",

  data,

  {

   headers:{

    "Content-Type":
    "multipart/form-data"

   }

  }

 );



 alert("تم حفظ معلومات الشركة");


}catch(error){

 console.log(error);

 alert("خطأ في الحفظ");

}


}





return (

<Box>


<Typography
 variant="h4"
 fontWeight="bold"
 gutterBottom
>
🏢 معلومات الشركة
</Typography>



<Paper
sx={{p:3}}
>


<Grid container spacing={2}>


<Grid item xs={12}>

<TextField

fullWidth

label="اسم الشركة"

name="company_name"

value={form.company_name}

onChange={change}

/>

</Grid>



<Grid item xs={6}>

<TextField

fullWidth

label="الهاتف"

name="phone"

value={form.phone}

onChange={change}

/>

</Grid>



<Grid item xs={6}>

<TextField

fullWidth

label="البريد"

name="email"

value={form.email}

onChange={change}

/>

</Grid>




<Grid item xs={12}>

<TextField

fullWidth

label="العنوان"

name="address"

value={form.address}

onChange={change}

/>

</Grid>




<Grid item xs={4}>

<TextField

fullWidth

label="RC"

name="rc"

value={form.rc}

onChange={change}

/>

</Grid>



<Grid item xs={4}>

<TextField

fullWidth

label="NIF"

name="nif"

value={form.nif}

onChange={change}

/>

</Grid>



<Grid item xs={4}>

<TextField

fullWidth

label="NIS"

name="nis"

value={form.nis}

onChange={change}

/>

</Grid>



<Grid item xs={12}>


<Typography>

Logo الشركة

</Typography>


<input

type="file"

accept="image/*"

onChange={(e)=>
 setLogo(
  e.target.files[0]
 )
}

/>


</Grid>



<Grid item xs={12}>


<Button

variant="contained"

onClick={save}

>

💾 حفظ

</Button>


</Grid>



</Grid>


</Paper>


</Box>

);


}