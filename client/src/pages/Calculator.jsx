import {
  Grid,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Button
} from "@mui/material";

import { useEffect, useState } from "react";
import api from "../services/api";


function Calculator() {

  const [surface, setSurface] = useState("");
  const [thickness, setThickness] = useState("");

  const [labor, setLabor] = useState("");
  const [transport, setTransport] = useState("");
  const [margin, setMargin] = useState("30");

  const [systems, setSystems] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);

  const [systemId, setSystemId] = useState("");
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");

  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);



  useEffect(() => {

    loadSystems();
    loadClients();

  }, []);



  useEffect(() => {

    if(clientId){

      loadProjects(clientId);

    }else{

      setProjects([]);
      setProjectId("");

    }

  },[clientId]);




  async function loadSystems(){

    try{

      const res = await api.get("/systems");

      setSystems(res.data);

    }catch(error){

      console.log(error);

    }

  }




  async function loadClients(){

    try{

      const res = await api.get("/clients");

      setClients(res.data);

    }catch(error){

      console.log(error);

    }

  }




  async function loadProjects(id){

    try{

      const res = await api.get("/projects");


      const filtered = res.data.filter(

        p => Number(p.client_id) === Number(id)

      );


      setProjects(filtered);


    }catch(error){

      console.log(error);

    }

  }  async function calculate(){

    if(!systemId || !surface || !thickness){

      alert("Choisir système + surface + épaisseur");

      return;

    }


    try{


      const res = await api.get(
        `/calculator/${systemId}`
      );


      let materialTotal = 0;


      const materials = res.data.map((item)=>{


        const quantity =
          Number(surface) *
          Number(item.consumption);


        const cost =
          quantity *
          Number(item.purchase_price);


        materialTotal += cost;


        return {

          name:item.name,

          quantity:quantity.toFixed(2),

          price:item.purchase_price,

          cost:cost.toFixed(2)

        };


      });



      const totalCost =

        materialTotal +

        Number(labor || 0) +

        Number(transport || 0);



      const profit =

        totalCost *

        Number(margin || 0) /

        100;



      const clientPrice =

        totalCost + profit;



      setResult({

        materials,

        materialTotal:materialTotal.toFixed(2),

        total:totalCost.toFixed(2),

        margin,

        price:clientPrice.toFixed(2),

        profit:profit.toFixed(2)

      });



    }catch(error){

      console.log(error);

    }

  }





  async function createDevis(){


    if(!clientId || !projectId || !result){

      alert("Choisir client + projet + calculer");

      return;

    }



    try{


      setSaving(true);



      await api.post("/invoices",{


        client_id:clientId,


        project_id:projectId,


        invoice_number:
        "DEV-" + Date.now(),


        amount:result.price,


        status:"Draft",


        invoice_date:
        new Date()
        .toISOString()
        .split("T")[0]


      });



      alert("✅ Devis créé avec succès");



    }catch(error){


      console.log(error);

      alert("Erreur création devis");


    }finally{


      setSaving(false);


    }


  }





  return (

    <Paper sx={{p:4,borderRadius:3}}>


      <Typography
        variant="h4"
        fontWeight="bold"
        gutterBottom
      >

        🧮 Calculateur Résine PRO

      </Typography>      <Grid container spacing={2}>


        <Grid item xs={12} md={4}>

          <TextField
            fullWidth
            select
            label="Client"
            value={clientId}
            onChange={(e)=>setClientId(e.target.value)}
          >

            <MenuItem value="">
              Choisir client
            </MenuItem>

            {clients.map((c)=>(

              <MenuItem
                key={c.id}
                value={c.id}
              >
                {c.name}
              </MenuItem>

            ))}

          </TextField>

        </Grid>



        <Grid item xs={12} md={4}>

          <TextField
            fullWidth
            select
            label="Projet"
            value={projectId}
            onChange={(e)=>setProjectId(e.target.value)}
          >

            <MenuItem value="">
              Choisir projet
            </MenuItem>


            {projects.map((p)=>(

              <MenuItem
                key={p.id}
                value={p.id}
              >
                {p.name}
              </MenuItem>

            ))}


          </TextField>

        </Grid>



        <Grid item xs={12} md={4}>

          <TextField
            fullWidth
            select
            label="Système Résine"
            value={systemId}
            onChange={(e)=>setSystemId(e.target.value)}
          >

            <MenuItem value="">
              Choisir système
            </MenuItem>


            {systems.map((s)=>(

              <MenuItem
                key={s.id}
                value={s.id}
              >
                {s.name}
              </MenuItem>

            ))}


          </TextField>

        </Grid>



        <Grid item xs={12} md={4}>

          <TextField
            fullWidth
            label="Surface m²"
            type="number"
            value={surface}
            onChange={(e)=>setSurface(e.target.value)}
          />

        </Grid>



        <Grid item xs={12} md={4}>

          <TextField
            fullWidth
            label="Épaisseur mm"
            type="number"
            value={thickness}
            onChange={(e)=>setThickness(e.target.value)}
          />

        </Grid>



        <Grid item xs={12} md={4}>

          <TextField
            fullWidth
            label="Main d'œuvre DA"
            type="number"
            value={labor}
            onChange={(e)=>setLabor(e.target.value)}
          />

        </Grid>



        <Grid item xs={12} md={4}>

          <TextField
            fullWidth
            label="Transport DA"
            type="number"
            value={transport}
            onChange={(e)=>setTransport(e.target.value)}
          />

        </Grid>



        <Grid item xs={12} md={4}>

          <TextField
            fullWidth
            label="Marge %"
            type="number"
            value={margin}
            onChange={(e)=>setMargin(e.target.value)}
          />

        </Grid>



        <Grid item xs={12}>

          <Button
            variant="contained"
            size="large"
            onClick={calculate}
          >
            🧮 Calculer
          </Button>


          <Button
            sx={{ml:2}}
            variant="outlined"
            disabled={!result || saving}
            onClick={createDevis}
          >
            📄 Créer Devis
          </Button>

        </Grid>


      </Grid>



      {result && (

        <Paper sx={{mt:4,p:3}}>


          <Typography
            variant="h5"
            fontWeight="bold"
          >
            📊 Résultat
          </Typography>



          {result.materials.map((m)=>(

            <Typography key={m.name}>

              {m.name} :
              {m.quantity} kg × {m.price} DA =
              {m.cost} DA

            </Typography>

          ))}



          <Typography sx={{mt:2}}>
            💰 Coût matière :
            {result.materialTotal} DA
          </Typography>


          <Typography>
            🏗️ Coût total :
            {result.total} DA
          </Typography>


          <Typography>
            📈 Marge :
            {result.margin} %
          </Typography>


          <Typography>
            🧾 Prix client :
            {result.price} DA
          </Typography>


          <Typography>
            🏆 Bénéfice :
            {result.profit} DA
          </Typography>


        </Paper>

      )}


    </Paper>

  );

}


export default Calculator;