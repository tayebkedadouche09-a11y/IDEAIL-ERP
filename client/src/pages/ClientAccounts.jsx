import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
Paper,
Typography,
Button,
TextField,
Table,
TableHead,
TableRow,
TableCell,
TableBody
} from "@mui/material";

import api from "../services/api";


export default function ClientAccounts(){


const {id}=useParams();


const [accounts,setAccounts]=useState([]);

const [total,setTotal]=useState({
total:0,
paid:0,
remaining:0
});


const [form,setForm]=useState({

description:"",
days_worked:"",
daily_price:"",
paid_amount:""

});



useEffect(()=>{

loadAccounts();
loadTotal();

},[]);



async function loadAccounts(){

const res=await api.get(
`/clients/${id}/accounts`
);

setAccounts(res.data);

}



async function loadTotal(){

const res=await api.get(
`/clients/${id}/accounts-total`
);

setTotal(res.data);

}




function change(e){

setForm({

...form,

[e.target.name]:e.target.value

});

}




async function save(){


await api.post(

`/clients/${id}/accounts`,

form

);


setForm({

description:"",
days_worked:"",
daily_price:"",
paid_amount:""

});


loadAccounts();

loadTotal();


}





return (

<Paper sx={{p:4}}>


<Typography variant="h4" fontWeight="bold">

💰 حساب العميل

</Typography>



<TextField

fullWidth

margin="normal"

label="وصف العمل"

name="description"

value={form.description}

onChange={change}

/>



<TextField

fullWidth

margin="normal"

label="عدد الأيام"

name="days_worked"

type="number"

value={form.days_worked}

onChange={change}

/>



<TextField

fullWidth

margin="normal"

label="سعر اليوم"

name="daily_price"

type="number"

value={form.daily_price}

onChange={change}

/>



<TextField

fullWidth

margin="normal"

label="المدفوع"

name="paid_amount"

type="number"

value={form.paid_amount}

onChange={change}

/>



<Button

variant="contained"

onClick={save}

>

إضافة حساب

</Button>





<Typography sx={{mt:3}}>

الإجمالي:
{total.total} DA

<br/>

المدفوع:
{total.paid} DA

<br/>

الباقي:
{total.remaining} DA

</Typography>






<Table sx={{mt:3}}>


<TableHead>

<TableRow>

<TableCell>
الوصف
</TableCell>


<TableCell>
الأيام
</TableCell>


<TableCell>
سعر اليوم
</TableCell>


<TableCell>
المجموع
</TableCell>


</TableRow>

</TableHead>




<TableBody>


{
accounts.map(a=>(

<TableRow key={a.id}>


<TableCell>
{a.description}
</TableCell>


<TableCell>
{a.days_worked}
</TableCell>


<TableCell>
{a.daily_price}
</TableCell>


<TableCell>
{a.total_amount}
</TableCell>


</TableRow>


))

}


</TableBody>


</Table>


</Paper>

);


}