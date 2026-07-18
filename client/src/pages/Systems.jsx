import { useEffect, useState } from "react";

import {
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";

import api from "../services/api";


function Systems() {


  const emptyForm = {

    name: "",
    type: "",
    resin_consumption: "",
    hardener_ratio: "",
    primer_consumption: "",
    sand_consumption: "",
    drying_time: "",
    notes: ""

  };



  const [systems, setSystems] = useState([]);

  const [form, setForm] = useState(emptyForm);

  const [editId, setEditId] = useState(null);



  useEffect(()=>{

    loadSystems();

  },[]);





  async function loadSystems(){

    try{

      const response = await api.get("/systems");

      setSystems(response.data);

    }catch(error){

      console.log(error);

    }

  }





  function handleChange(e){

    setForm({

      ...form,

      [e.target.name]: e.target.value

    });

  }






  async function saveSystem(){


    try{


      if(editId){


        await api.put(

          `/systems/${editId}`,

          form

        );


      }else{


        await api.post(

          "/systems",

          form

        );


      }



      setForm(emptyForm);

      setEditId(null);

      loadSystems();



    }catch(error){


      console.log(error);


    }


  }







  function editSystem(system){


    setEditId(system.id);


    setForm({

      name: system.name || "",

      type: system.type || "",

      resin_consumption:
        system.resin_consumption || "",

      hardener_ratio:
        system.hardener_ratio || "",

      primer_consumption:
        system.primer_consumption || "",

      sand_consumption:
        system.sand_consumption || "",

      drying_time:
        system.drying_time || "",

      notes:
        system.notes || ""

    });


  }







  async function deleteSystem(id){


    if(!window.confirm("هل تريد حذف هذا النظام؟")){

      return;

    }



    try{


      await api.delete(`/systems/${id}`);


      loadSystems();



    }catch(error){


      console.log(error);


    }


  }






  return (


    <Paper sx={{p:4,borderRadius:3}}>



      <Typography variant="h4" fontWeight="bold">

        🧪 Systèmes Résine

      </Typography>






      <Grid container spacing={2} sx={{mt:2}}>




        <Grid item xs={12} md={4}>

          <TextField

            fullWidth

            label="Nom système"

            name="name"

            value={form.name}

            onChange={handleChange}

          />

        </Grid>






        <Grid item xs={12} md={4}>

          <TextField

            fullWidth

            label="Type"

            name="type"

            value={form.type}

            onChange={handleChange}

          />

        </Grid>






        <Grid item xs={12} md={4}>

          <TextField

            fullWidth

            label="Résine kg/m²/mm"

            name="resin_consumption"

            value={form.resin_consumption}

            onChange={handleChange}

          />

        </Grid>







        <Grid item xs={12} md={4}>

          <TextField

            fullWidth

            label="Durcisseur %"

            name="hardener_ratio"

            value={form.hardener_ratio}

            onChange={handleChange}

          />

        </Grid>







        <Grid item xs={12} md={4}>

          <TextField

            fullWidth

            label="Primaire kg/m²"

            name="primer_consumption"

            value={form.primer_consumption}

            onChange={handleChange}

          />

        </Grid>







        <Grid item xs={12} md={4}>

          <TextField

            fullWidth

            label="Sable kg/m²"

            name="sand_consumption"

            value={form.sand_consumption}

            onChange={handleChange}

          />

        </Grid>







        <Grid item xs={12}>


          <Button

            variant="contained"

            onClick={saveSystem}

          >

            {editId ? "Modifier système" : "Ajouter système"}

          </Button>



          {editId &&

            <Button

              sx={{ml:2}}

              variant="outlined"

              onClick={()=>{

                setEditId(null);

                setForm(emptyForm);

              }}

            >

              Annuler

            </Button>

          }



        </Grid>



      </Grid>








      <Table sx={{mt:4}}>



        <TableHead>


          <TableRow>


            <TableCell>Nom</TableCell>

            <TableCell>Type</TableCell>

            <TableCell>Résine</TableCell>

            <TableCell>Durcisseur</TableCell>

            <TableCell>Actions</TableCell>


          </TableRow>


        </TableHead>







        <TableBody>



        {

          systems.map((system)=>(



            <TableRow key={system.id}>



              <TableCell>

                {system.name}

              </TableCell>




              <TableCell>

                {system.type}

              </TableCell>




              <TableCell>

                {system.resin_consumption}

              </TableCell>




              <TableCell>

                {system.hardener_ratio} %

              </TableCell>




              <TableCell>



                <Button

                  variant="contained"

                  sx={{mr:1}}

                  onClick={()=>editSystem(system)}

                >

                  ✏️ تعديل

                </Button>




                <Button

                  variant="contained"

                  color="error"

                  onClick={()=>deleteSystem(system.id)}

                >

                  🗑 حذف

                </Button>



              </TableCell>




            </TableRow>



          ))

        }



        </TableBody>



      </Table>



    </Paper>


  );


}



export default Systems;