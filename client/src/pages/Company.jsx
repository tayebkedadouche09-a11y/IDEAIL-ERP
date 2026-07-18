import { useEffect, useState } from "react";
import api from "../services/api";

import {
  Paper,
  Typography,
  TextField,
  Button,
  Grid
} from "@mui/material";


function Company(){

  const [form,setForm] = useState({

    company_name:"",
    phone:"",
    email:"",
    address:"",
    logo:"",
    rc:"",
    nif:"",
    nis:""

  });



  useEffect(()=>{

    loadCompany();

  },[]);



  async function loadCompany(){

    try{

      const res = await api.get("/company");

      if(res.data){

        setForm({

          company_name:res.data.company_name || "",
          phone:res.data.phone || "",
          email:res.data.email || "",
          address:res.data.address || "",
          logo:res.data.logo || "",
          rc:res.data.rc || "",
          nif:res.data.nif || "",
          nis:res.data.nis || ""

        });

      }


    }catch(error){

      console.log(error);

    }

  }




  async function saveCompany(){


    try{


      await api.post("/company",form);


      alert("✅ تم حفظ معلومات المؤسسة");


    }catch(error){


      console.log(error);

      alert("خطأ في الحفظ");


    }


  }




  return (

    <Paper sx={{p:4}}>


      <Typography
        variant="h4"
        fontWeight="bold"
        gutterBottom
      >

        🏢 معلومات المؤسسة

      </Typography>



      <Grid container spacing={2}>


        <Grid item xs={12} md={6}>

          <TextField
            fullWidth
            label="اسم المؤسسة"
            value={form.company_name}
            onChange={(e)=>
              setForm({
                ...form,
                company_name:e.target.value
              })
            }
          />

        </Grid>



        <Grid item xs={12} md={6}>

          <TextField
            fullWidth
            label="الهاتف"
            value={form.phone}
            onChange={(e)=>
              setForm({
                ...form,
                phone:e.target.value
              })
            }
          />

        </Grid>



        <Grid item xs={12} md={6}>

          <TextField
            fullWidth
            label="البريد الإلكتروني"
            value={form.email}
            onChange={(e)=>
              setForm({
                ...form,
                email:e.target.value
              })
            }
          />

        </Grid>



        <Grid item xs={12} md={6}>

          <TextField
            fullWidth
            label="العنوان"
            value={form.address}
            onChange={(e)=>
              setForm({
                ...form,
                address:e.target.value
              })
            }
          />

        </Grid>



        <Grid item xs={12} md={4}>

          <TextField
            fullWidth
            label="RC"
            value={form.rc}
            onChange={(e)=>
              setForm({
                ...form,
                rc:e.target.value
              })
            }
          />

        </Grid>



        <Grid item xs={12} md={4}>

          <TextField
            fullWidth
            label="NIF"
            value={form.nif}
            onChange={(e)=>
              setForm({
                ...form,
                nif:e.target.value
              })
            }
          />

        </Grid>



        <Grid item xs={12} md={4}>

          <TextField
            fullWidth
            label="NIS"
            value={form.nis}
            onChange={(e)=>
              setForm({
                ...form,
                nis:e.target.value
              })
            }
          />

        </Grid>



        <Grid item xs={12}>


          <Button
            variant="contained"
            size="large"
            onClick={saveCompany}
          >

            💾 حفظ المعلومات

          </Button>


        </Grid>


      </Grid>


    </Paper>

  );


}


export default Company;