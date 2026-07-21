import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
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
import Devis from "./pages/Devis";
import Expenses from "./pages/Expenses";
import Payments from "./pages/Payments";
import CashFlow from "./pages/CashFlow";
import Automation from "./pages/Automation";
import Assistant from "./pages/Assistant";
import Documents from "./pages/Documents";
import Vehicles from "./pages/Vehicles";
import Suppliers from "./pages/Suppliers";
import Attendance from "./pages/Attendance";
import Leave from "./pages/Leave";
import Payroll from "./pages/Payroll";
import Calendar from "./pages/Calendar";
import Backup from "./pages/Backup";
import Search from "./pages/Search";
import EnterpriseModule from "./pages/EnterpriseModule";

const ENTERPRISE_MODULES = [
  ["companies", "companies"], ["accounts", "accounts"], ["periods", "periods"],
  ["journal-entries", "journalEntries"], ["purchase-requests", "purchaseRequests"],
  ["assets", "assets"], ["quality", "qualityInspections"], ["boms", "billsOfMaterials"],
  ["production", "productionOrders"], ["leads", "leads"], ["tasks", "tasks"], ["teams", "teams"],
  ["contracts", "contracts"], ["report-designer", "reportTemplates"], ["workflows", "workflows"],
  ["approvals", "approvals"], ["portal-requests", "portalRequests"], ["maintenance", "maintenance"],
];

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login page - no layout */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes with layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <ProjectDetails />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/employees"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <Employees />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/clients/:id/accounts"
          element={
            <ProtectedRoute>
              <Layout>
                <ClientAccounts />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/clients"
          element={
            <ProtectedRoute>
              <Layout>
                <Clients />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <Layout>
                <Projects />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/invoices"
          element={
            <ProtectedRoute>
              <Layout>
                <Invoices />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/system-materials"
          element={
            <ProtectedRoute>
              <Layout>
                <SystemMaterials />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/system-products"
          element={
            <ProtectedRoute>
              <Layout>
                <SystemProducts />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/calculator"
          element={
            <ProtectedRoute>
              <Layout>
                <Calculator />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/systems"
          element={
            <ProtectedRoute>
              <Layout>
                <Systems />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <Layout>
                <Products />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/stock"
          element={
            <ProtectedRoute>
              <Layout>
                <Stock />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/debts"
          element={
            <ProtectedRoute>
              <Layout>
                <Debts />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Layout>
                <Reports />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/devis"
          element={
            <ProtectedRoute>
              <Layout>
                <Devis />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/expenses"
          element={
            <ProtectedRoute>
              <Layout>
                <Expenses />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <Layout>
                <Payments />
              </Layout>
            </ProtectedRoute>
          }
        />

<Route
          path="/cash-flow"
          element={
            <ProtectedRoute>
              <Layout>
                <CashFlow />
              </Layout>
            </ProtectedRoute>
          }
        />

<Route
          path="/company-settings"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <CompanySettings />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/automation"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <Automation />
              </Layout>
            </ProtectedRoute>
          }
        />

<Route
          path="/assistant"
          element={
            <ProtectedRoute>
              <Layout>
                <Assistant />
              </Layout>
            </ProtectedRoute>
          }
        />

<Route
          path="/documents"
          element={
            <ProtectedRoute>
              <Layout>
                <Documents />
              </Layout>
            </ProtectedRoute>
          }
        />

<Route
          path="/vehicles"
          element={
            <ProtectedRoute>
              <Layout>
                <Vehicles />
              </Layout>
            </ProtectedRoute>
          }
        />

<Route
          path="/suppliers"
          element={
            <ProtectedRoute>
              <Layout>
                <Suppliers />
              </Layout>
            </ProtectedRoute>
          }
        />

<Route
          path="/attendance"
          element={
            <ProtectedRoute>
              <Layout>
                <Attendance />
              </Layout>
            </ProtectedRoute>
          }
        />

<Route
          path="/leave"
          element={
            <ProtectedRoute>
              <Layout>
                <Leave />
              </Layout>
            </ProtectedRoute>
          }
        />

<Route
          path="/payroll"
          element={
            <ProtectedRoute>
              <Layout>
                <Payroll />
              </Layout>
            </ProtectedRoute>
          }
        />

<Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <Layout>
                <Calendar />
              </Layout>
            </ProtectedRoute>
          }
        />

<Route
          path="/backup"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <Backup />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <Layout>
                <Search />
              </Layout>
            </ProtectedRoute>
          }
        />
        {ENTERPRISE_MODULES.map(([path, module]) => (
          <Route key={path} path={`/${path}`} element={<ProtectedRoute><Layout><EnterpriseModule module={module} /></Layout></ProtectedRoute>} />
        ))}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
