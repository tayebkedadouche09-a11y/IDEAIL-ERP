import { useEffect, useState } from "react";

import {
  Paper,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from "@mui/material";

import api from "../services/api";


function SystemMaterials() {


  const [systems, setSystems] = useState([]);

  const [products, setProducts] = useState([]);

  const [materials, setMaterials] = useState([]);



  const [systemId, setSystemId] = useState("");

  const [productId, setProductId] = useState("");

  const [consumption, setConsumption] = useState("");





  useEffect(()=>{

    loadSystems();

    loadProducts();

  },[]);





  useEffect(()=>{

    if(systemId){

      loadMaterials();

    }else{

      setMaterials([]);

    }

  },[systemId]);





  async function loadSystems(){

    try{

      const res = await api.get("/systems");

      setSystems(res.data);

    }catch(error){

      console.log(error);

    }

  }





  async function loadProducts(){

    try{

      const res = await api.get("/products");

      setProducts(res.data);

    }catch(error){

      console.log(error);

    }

  }






  async function loadMaterials(){

    try{

      const res = await api.get(
        `/system-products/${systemId}`
      );

      setMaterials(res.data);

    }catch(error){

      console.log(error);

    }

  }







  async function addMaterial(){


    try{


      await api.post("/system-products",{

        system_id: systemId,

        product_id: productId,

        consumption: consumption

      });



      setProductId("");

      setConsumption("");


      loadMaterials();



    }catch(error){

      console.log(error);

    }


  }







return (

<Paper sx={{p:4,borderRadius:3}}>


<Typography variant="h4" fontWeight="bold">

🧪 System Materials

</Typography>




<Grid container spacing={2} sx={{mt:2}}>



<Grid item xs={12} md={4}>


<TextField

fullWidth

select

label="Système"

value={systemId}

onChange={(e)=>setSystemId(e.target.value)}

>


<MenuItem value="">
Choisir système
</MenuItem>


{

systems.map((system)=>(

<MenuItem

key={system.id}

value={system.id}

>

{system.name}

</MenuItem>


))

}


</TextField>


</Grid>







<Grid item xs={12} md={4}>


<TextField

fullWidth

select

label="Matière"

value={productId}

onChange={(e)=>setProductId(e.target.value)}

>


<MenuItem value="">
Choisir matière
</MenuItem>


{

products.map((product)=>(


<MenuItem

key={product.id}

value={product.id}

>

{product.name}

</MenuItem>


))


}


</TextField>


</Grid>







<Grid item xs={12} md={4}>


<TextField

fullWidth

label="Consommation kg/m²"

type="number"

value={consumption}

onChange={(e)=>setConsumption(e.target.value)}

/>


</Grid>







<Grid item xs={12}>


<Button

variant="contained"

onClick={addMaterial}

>

Ajouter


</Button>


</Grid>


</Grid>







<Table sx={{mt:4}}>


<TableHead>

<TableRow>

<TableCell>Matière</TableCell>

<TableCell>Unité</TableCell>

<TableCell>Consommation</TableCell>


</TableRow>

</TableHead>




<TableBody>


{

materials.map((m)=>(


<TableRow key={m.id}>


<TableCell>
{m.name}
</TableCell>


<TableCell>
{m.unit}
</TableCell>


<TableCell>
{m.consumption} kg/m²
</TableCell>



</TableRow>


))


}



</TableBody>


</Table>



</Paper>


);


}


export default SystemMaterials;