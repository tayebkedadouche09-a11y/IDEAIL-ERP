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
  Chip
} from "@mui/material";


function Invoices() {

  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);

  const [open, setOpen] = useState(false);

  const [editId, setEditId] = useState(null);

  const [signature, setSignature] = useState(null);

  const [filter, setFilter] = useState("all");


  const emptyForm = {
    client_id:"",
    project_id:"",
    invoice_number:"",
    amount:"",
    status:"Draft",
    invoice_date:""
  };


  const [form,setForm] = useState(emptyForm);



  useEffect(()=>{

    loadInvoices();
    loadClients();
    loadProjects();

  },[]);



  async function loadInvoices(){

    try{

      const res = await api.get("/invoices");

      setInvoices(res.data);

    }catch(error){

      console.log(error);

      alert("Erreur chargement devis");

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



  async function loadProjects(){

    try{

      const res = await api.get("/projects");

      setProjects(res.data);

    }catch(error){

      console.log(error);

    }

  }



  function addInvoice(){

    setEditId(null);
    setSignature(null);
    setForm(emptyForm);
    setOpen(true);

  }



  function editInvoice(inv){

    setEditId(inv.id);
    setSignature(null);

    setForm({

      client_id:inv.client_id,
      project_id:inv.project_id || "",
      invoice_number:inv.invoice_number,
      amount:inv.amount,
      status:inv.status,
      invoice_date:inv.invoice_date || ""

    });

    setOpen(true);

  }  async function saveInvoice(){

    try{

      const data = new FormData();


      Object.keys(form).forEach(key=>{

        data.append(
          key,
          form[key]
        );

      });



      if(signature){

        data.append(
          "signature",
          signature
        );

      }



      if(editId){

        await api.put(
          `/invoices/${editId}`,
          data,
          {
            headers:{
              "Content-Type":
              "multipart/form-data"
            }
          }
        );


      }else{


        await api.post(
          "/invoices",
          data,
          {
            headers:{
              "Content-Type":
              "multipart/form-data"
            }
          }
        );


      }



      setOpen(false);

      loadInvoices();


    }catch(error){

      console.log(error);

      alert("Erreur sauvegarde");

    }


  }





  async function deleteInvoice(id){


    if(!window.confirm(
      "Supprimer ce document ?"
    )) return;



    try{


      await api.delete(
        `/invoices/${id}`
      );


      loadInvoices();



    }catch(error){


      console.log(error);

      alert("Erreur suppression");


    }


  }





  const filteredInvoices =

    filter==="all"

    ? invoices

    :

    invoices.filter(
      inv=>inv.status===filter
    );





  function statusColor(status){


    if(status==="Draft")
      return "default";


    if(status==="مدفوعة")
      return "success";


    return "warning";


  }



  return (

    <div>


      <Typography
        variant="h4"
        fontWeight="bold"
        gutterBottom
      >

        🧾 Devis & Factures

      </Typography>




      <Button

        variant="contained"

        sx={{mb:2}}

        onClick={addInvoice}

      >

        ➕ Nouveau Devis

      </Button>





      <TextField

        select

        label="Filtre"

        value={filter}

        onChange={(e)=>
          setFilter(e.target.value)
        }

        sx={{
          ml:2,
          width:200
        }}

      >

        <MenuItem value="all">
          Tous
        </MenuItem>


        <MenuItem value="Draft">
          📄 Devis
        </MenuItem>


        <MenuItem value="غير مدفوعة">
          🟦 Non payé
        </MenuItem>


        <MenuItem value="مدفوعة">
          🟩 Payé
        </MenuItem>


      </TextField>





      <Dialog

        open={open}

        onClose={()=>
          setOpen(false)
        }

        fullWidth

        maxWidth="sm"

      >


        <DialogTitle>

          {editId
          ?
          "Modifier document"
          :
          "Créer Devis"}

        </DialogTitle>


        <DialogContent>


          <TextField

            select

            fullWidth

            margin="normal"

            label="Client"

            value={form.client_id}

            onChange={(e)=>
              setForm({
                ...form,
                client_id:e.target.value
              })
            }

          >

            {clients.map(c=>(

              <MenuItem
                key={c.id}
                value={c.id}
              >

                {c.name}

              </MenuItem>

            ))}


          </TextField>          <TextField

            select

            fullWidth

            margin="normal"

            label="Projet"

            value={form.project_id}

            onChange={(e)=>
              setForm({
                ...form,
                project_id:e.target.value
              })
            }

          >

            <MenuItem value="">
              Sans projet
            </MenuItem>


            {projects.map(p=>(

              <MenuItem
                key={p.id}
                value={p.id}
              >
                {p.name}
              </MenuItem>

            ))}


          </TextField>




          <TextField

            fullWidth

            margin="normal"

            label="Numéro"

            value={form.invoice_number}

            onChange={(e)=>
              setForm({
                ...form,
                invoice_number:e.target.value
              })
            }

          />




          <TextField

            fullWidth

            type="number"

            margin="normal"

            label="Montant DA"

            value={form.amount}

            onChange={(e)=>
              setForm({
                ...form,
                amount:e.target.value
              })
            }

          />




          <TextField

            select

            fullWidth

            margin="normal"

            label="Statut"

            value={form.status}

            onChange={(e)=>
              setForm({
                ...form,
                status:e.target.value
              })
            }

          >

            <MenuItem value="Draft">
              📄 Devis
            </MenuItem>

            <MenuItem value="غير مدفوعة">
              🟦 Non payé
            </MenuItem>

            <MenuItem value="مدفوعة">
              🟩 Payé
            </MenuItem>


          </TextField>




          <TextField

            fullWidth

            type="date"

            margin="normal"

            InputLabelProps={{
              shrink:true
            }}

            value={form.invoice_date}

            onChange={(e)=>
              setForm({
                ...form,
                invoice_date:e.target.value
              })
            }

          />



          <Typography sx={{mt:2}}>
            Signature client
          </Typography>


          <input

            type="file"

            accept="image/*"

            onChange={(e)=>
              setSignature(
                e.target.files[0]
              )
            }

          />


        </DialogContent>



        <DialogActions>


          <Button
            onClick={()=>
              setOpen(false)
            }
          >
            Annuler
          </Button>



          <Button

            variant="contained"

            onClick={saveInvoice}

          >
            Enregistrer
          </Button>


        </DialogActions>


      </Dialog>






      <TableContainer
        component={Paper}
        sx={{mt:3}}
      >

        <Table>


          <TableHead>

            <TableRow>

              <TableCell>N°</TableCell>

              <TableCell>Client</TableCell>

              <TableCell>Projet</TableCell>

              <TableCell>Montant</TableCell>

              <TableCell>Statut</TableCell>

              <TableCell>Date</TableCell>

              <TableCell>Actions</TableCell>

            </TableRow>

          </TableHead>



          <TableBody>


          {filteredInvoices.map(inv=>(


            <TableRow key={inv.id}>


              <TableCell>
                {inv.invoice_number}
              </TableCell>


              <TableCell>
                {inv.client_name}
              </TableCell>


              <TableCell>
                {inv.project_name || "-"}
              </TableCell>


              <TableCell>
                {inv.amount} DA
              </TableCell>


              <TableCell>

                <Chip

                  label={inv.status}

                  color={statusColor(inv.status)}

                />

              </TableCell>


              <TableCell>
                {inv.invoice_date}
              </TableCell>



              <TableCell>


                <Button
                  size="small"
                  onClick={()=>
                    editInvoice(inv)
                  }
                >
                  ✏️
                </Button>



                <Button

                  size="small"

                  color="success"

                  component="a"

                  href={
                    `http://localhost:3000/pdf/devis/${inv.id}`
                  }

                  target="_blank"

                >
                  📄
                </Button>



                <Button

                  size="small"

                  color="error"

                  onClick={()=>
                    deleteInvoice(inv.id)
                  }

                >
                  🗑
                </Button>


              </TableCell>


            </TableRow>


          ))}


          </TableBody>


        </Table>


      </TableContainer>


    </div>

  );

}


export default Invoices;