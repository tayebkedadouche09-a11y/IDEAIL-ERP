import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import Employees from "./pages/Employees";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Projects from "./pages/Projects";
import Invoices from "./pages/Invoices";
import Calculator from "./pages/Calculator";
import Systems from "./pages/Systems";
import Products from "./pages/Products";
import Stock from "./pages/Stock";
import Debts from "./pages/Debts";
import Reports from "./pages/Reports";
import SystemMaterials from "./pages/SystemMaterials";
import SystemProducts from "./pages/SystemProducts";
import CompanySettings from "./pages/CompanySettings";
import ClientAccounts from "./pages/ClientAccounts";
import ProjectDetails from "./pages/ProjectDetails";
function App() {


  return (

    <BrowserRouter>

      <Layout>

        <Routes>
          <Route
 path="/projects/:id"
 element={<ProjectDetails />}
/>
<Route
 path="/employees"
 element={<Employees />}
/>
<Route
path="/clients/:id/accounts"
element={<ClientAccounts />}
/>
          <Route path="/" element={<Dashboard />} />


          <Route path="/clients" element={<Clients />} />


          <Route path="/projects" element={<Projects />} />


          <Route path="/invoices" element={<Invoices />} />



          <Route
            path="/system-materials"
            element={<SystemMaterials />}
          />



          <Route
            path="/system-products"
            element={<SystemProducts />}
          />



          <Route
            path="/calculator"
            element={<Calculator />}
          />



          <Route
            path="/systems"
            element={<Systems />}
          />



          <Route
            path="/products"
            element={<Products />}
          />



          <Route
            path="/stock"
            element={<Stock />}
          />



          <Route
            path="/debts"
            element={<Debts />}
          />



          <Route
            path="/reports"
            element={<Reports />}
          />



          <Route
            path="/company-settings"
            element={<CompanySettings />}
          />


        </Routes>


      </Layout>


    </BrowserRouter>

  );

}


export default App;