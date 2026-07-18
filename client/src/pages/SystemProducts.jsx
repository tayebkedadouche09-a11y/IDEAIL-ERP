import { useEffect, useState } from "react";
import api from "../services/api";

import {
  Typography,
  Button,
  TextField,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from "@mui/material";


function SystemProducts(){


const [systems,setSystems]=useState([]);
const [products,setProducts]=useState([]);
const [items,setItems]=useState([]);


const [form,setForm]=useState({

system_id:"",
product_id:"",
consumption:""

});



useEffect(()=>{

loadSystems();
loadProducts();

},[]);



async function loadSystems(){

const res=await api.get("/systems");

setSystems(res.data);

}



async function loadProducts(){

const res=await api.get("/products");

setProducts(res.data);

}





async function loadItems(){


if(!form.system_id)
return;


const res=await api.get(
`/system-products/${form.system_id}`
);


setItems(res.data);


}





async function save(){


await api.post(
"/system-products",
form
);


loadItems();


setForm({

...form,

product_id:"",
consumption:""

});


}





return (

<div>


<Typography variant="h4" gutterBottom>
🔗 ربط مواد الأنظمة
</Typography>



<Paper sx={{p:3,mb:3}}>


<TextField
select
fullWidth
margin="normal"
label="النظام"
value={form.system_id}
onChange={(e)=>{

setForm({
...form,
system_id:e.target.value
});

}}
>


{
systems.map(s=>(

<MenuItem
key={s.id}
value={s.id}
>
{s.name}
</MenuItem>

))
}


</TextField>





<TextField
select
fullWidth
margin="normal"
label="المادة"
value={form.product_id}
onChange={(e)=>
setForm({
...form,
product_id:e.target.value
})
}
>


{
products.map(p=>(

<MenuItem
key={p.id}
value={p.id}
>
{p.name}
</MenuItem>

))
}


</TextField>






<TextField
fullWidth
margin="normal"
label="الاستهلاك لكل m²"
type="number"
value={form.consumption}
onChange={(e)=>
setForm({
...form,
consumption:e.target.value
})
}
/>




<Button
variant="contained"
onClick={save}
>
➕ إضافة مادة للنظام
</Button>



<Button
sx={{ml:2}}
variant="outlined"
onClick={loadItems}
>
عرض المواد
</Button>



</Paper>





<TableContainer component={Paper}>


<Table>


<TableHead>

<TableRow>

<TableCell>
المادة
</TableCell>

<TableCell>
الوحدة
</TableCell>

<TableCell>
الاستهلاك
</TableCell>


</TableRow>

</TableHead>



<TableBody>


{
items.map(item=>(

<TableRow key={item.id}>


<TableCell>
{item.name}
</TableCell>


<TableCell>
{item.unit}
</TableCell>


<TableCell>
{item.consumption}
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


export default SystemProducts;