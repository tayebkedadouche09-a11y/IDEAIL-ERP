import { useEffect, useState } from "react";

import {
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from "@mui/material";

import api from "../services/api";


function Products() {


  const [products, setProducts] = useState([]);


  const [form, setForm] = useState({

    name:"",
    category:"",
    unit:"kg",
    purchase_price:"",
    sale_price:"",
    quantity:"",
    minimum_quantity:"",
    supplier:""

  });




  useEffect(()=>{

    loadProducts();

  },[]);





  async function loadProducts(){

    try{

      const response = await api.get("/products");

      setProducts(response.data);


    }catch(error){

      console.log(error);

    }

  }






  function handleChange(e){

    setForm({

      ...form,

      [e.target.name]:e.target.value

    });

  }






  async function addProduct(){

    try{


      await api.post("/products",form);


      setForm({

        name:"",
        category:"",
        unit:"kg",
        purchase_price:"",
        sale_price:"",
        quantity:"",
        minimum_quantity:"",
        supplier:""

      });



      loadProducts();



    }catch(error){

      console.log(error);

    }

  }





return (

<Paper sx={{p:4,borderRadius:3}}>


<Typography variant="h4" fontWeight="bold">

📦 Products

</Typography>




<Grid container spacing={2} sx={{mt:2}}>



<Grid item xs={12} md={4}>

<TextField

fullWidth

label="Nom matière"

name="name"

value={form.name}

onChange={handleChange}

/>

</Grid>





<Grid item xs={12} md={4}>

<TextField

fullWidth

label="Catégorie"

name="category"

value={form.category}

onChange={handleChange}

/>

</Grid>





<Grid item xs={12} md={4}>

<TextField

fullWidth

label="Unité"

name="unit"

value={form.unit}

onChange={handleChange}

/>

</Grid>





<Grid item xs={12} md={4}>

<TextField

fullWidth

label="Prix achat"

name="purchase_price"

type="number"

value={form.purchase_price}

onChange={handleChange}

/>

</Grid>





<Grid item xs={12} md={4}>

<TextField

fullWidth

label="Prix vente"

name="sale_price"

type="number"

value={form.sale_price}

onChange={handleChange}

/>

</Grid>





<Grid item xs={12} md={4}>

<TextField

fullWidth

label="Quantité"

name="quantity"

type="number"

value={form.quantity}

onChange={handleChange}

/>

</Grid>





<Grid item xs={12} md={4}>

<TextField

fullWidth

label="Fournisseur"

name="supplier"

value={form.supplier}

onChange={handleChange}

/>

</Grid>





<Grid item xs={12}>

<Button

variant="contained"

onClick={addProduct}

>

Ajouter matière

</Button>

</Grid>



</Grid>







<Table sx={{mt:4}}>


<TableHead>

<TableRow>

<TableCell>Nom</TableCell>

<TableCell>Catégorie</TableCell>

<TableCell>Prix achat</TableCell>

<TableCell>Quantité</TableCell>

</TableRow>


</TableHead>



<TableBody>


{

products.map((product)=>(


<TableRow key={product.id}>


<TableCell>

{product.name}

</TableCell>



<TableCell>

{product.category}

</TableCell>



<TableCell>

{product.purchase_price}

</TableCell>



<TableCell>

{product.quantity}

</TableCell>



</TableRow>


))


}



</TableBody>


</Table>


</Paper>


);


}



export default Products;