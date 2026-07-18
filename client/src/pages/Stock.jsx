import { useEffect, useState } from "react";
import api from "../services/api";

import {
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem
} from "@mui/material";


export default function Stock(){


const emptyForm = {

product_id:"",
movement_type:"Entrée",
quantity:"",
notes:""

};



const [movements,setMovements]=useState([]);

const [products,setProducts]=useState([]);

const [open,setOpen]=useState(false);

const [editId,setEditId]=useState(null);


const [form,setForm]=useState(emptyForm);





useEffect(()=>{

loadStock();

loadProducts();

},[]);





async function loadStock(){

try{

const res=await api.get("/stock");

setMovements(res.data);

}catch(err){

console.log(err);

}

}





async function loadProducts(){

try{

const res=await api.get("/products");

setProducts(res.data);

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







function editMovement(item){


setEditId(item.id);


setForm({

product_id:item.product_id || "",

movement_type:item.movement_type || "Entrée",

quantity:item.quantity || "",

notes:item.notes || ""

});


setOpen(true);


}







async function save(){


try{


if(editId){


await api.put(

`/stock/${editId}`,

form

);


}else{


await api.post(

"/stock",

form

);


}




setOpen(false);

setEditId(null);

setForm(emptyForm);

loadStock();



}catch(err){

console.log(err);

}


}







async function deleteMovement(id){


if(!window.confirm("هل تريد حذف هذه الحركة؟"))

return;



try{


await api.delete(`/stock/${id}`);


loadStock();



}catch(err){

console.log(err);

}



}







return(


<Paper sx={{p:3}}>



<Typography variant="h4" fontWeight="bold">

📦 Stock

</Typography>





<Button

variant="contained"

sx={{mt:2,mb:2}}

onClick={addNew}

>

+ Nouvelle opération

</Button>






<Table>



<TableHead>


<TableRow>


<TableCell>Produit</TableCell>

<TableCell>Type</TableCell>

<TableCell>Quantité</TableCell>

<TableCell>Date</TableCell>

<TableCell>Actions</TableCell>


</TableRow>


</TableHead>






<TableBody>



{

movements.map(item=>(



<TableRow key={item.id}>


<TableCell>

{item.product_name}

</TableCell>



<TableCell>

{item.movement_type}

</TableCell>



<TableCell>

{item.quantity}

</TableCell>



<TableCell>

{item.created_at}

</TableCell>




<TableCell>



<Button

variant="contained"

sx={{mr:1}}

onClick={()=>editMovement(item)}

>

✏️ Modifier

</Button>




<Button

variant="contained"

color="error"

onClick={()=>deleteMovement(item.id)}

>

🗑 Supprimer

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

{editId ? "Modifier opération":"Nouvelle opération"}

</DialogTitle>





<DialogContent>





<TextField

select

fullWidth

margin="dense"

label="Produit"

name="product_id"

value={form.product_id}

onChange={change}

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

select

fullWidth

margin="dense"

label="Type"

name="movement_type"

value={form.movement_type}

onChange={change}

>


<MenuItem value="Entrée">

Entrée

</MenuItem>



<MenuItem value="Sortie">

Sortie

</MenuItem>


</TextField>






<TextField

fullWidth

margin="dense"

label="Quantité"

name="quantity"

type="number"

value={form.quantity}

onChange={change}

/>






<TextField

fullWidth

margin="dense"

label="Remarque"

name="notes"

value={form.notes}

onChange={change}

/>





</DialogContent>





<DialogActions>



<Button

onClick={()=>setOpen(false)}

>

Annuler

</Button>





<Button

variant="contained"

onClick={save}

>

Enregistrer

</Button>



</DialogActions>





</Dialog>





</Paper>



);


}