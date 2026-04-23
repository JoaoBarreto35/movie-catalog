import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "./lib/supabaseClient";
import { SubscriptionGuard } from "./components/SubscriptionGuard";
import { AdminGuard } from "./components/AdminGuard";
import { ToastProvider } from "./components/Toast/ToastContainer";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

import Login from "./Pages/Login";
import Home from "./Pages/Home";
import Search from "./Pages/Search";
import Category from "./Pages/Category";
import Details from "./Pages/Details";
import UserProfile from "./Pages/UserPage";
import Series from "./Pages/Series";
import Movies from "./Pages/Movies";
import TVDetails from "./Pages/TVDetails";
import TVCategory from "./Pages/TVCategory";
import Plans from "./Pages/Plans";
import PaymentSuccess from "./Pages/PaymentSuccess";
import SetPassword from "./Pages/SetPassword";
import AdminDashboard from "./Pages/Admin";
import PlansManager from "./Pages/Admin/Plans";
import UsersManager from "./Pages/Admin/Users";
import SubscriptionsManager from "./Pages/Admin/Subscriptions";
import TransactionsManager from "./Pages/Admin/Transactions";
//import LogsManager from "./Pages/Admin/Logs";
import PlanForm from "./Pages/Admin/Plans/PlanForm";
import { NotFound } from "./Pages/NotFound";

function AppShell() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}

function ProtectedLayout({ session }: { session: Session | null }) {
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function SubscriptionLayout({ session }: { session: Session | null }) {
  if (!session) return <Navigate to="/login" replace />;

  return (
    <SubscriptionGuard>
      <Outlet />
    </SubscriptionGuard>
  );
}
function AdminGuardLayout({ session }: { session: Session | null }) {
  if (!session) return <Navigate to="/login" replace />;

  return (
    <AdminGuard>
      <Outlet />
    </AdminGuard>
  );
}


function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div style={{ padding: 24 }}>Carregando...</div>;
  }

  return (
    <ToastProvider>

      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedLayout session={session} />}>
            <Route element={<AppShell />}>
              <Route path="/plans" element={<Plans />} />
            </Route>

            <Route element={<SubscriptionLayout session={session} />}>

              <Route element={<AppShell />}>
                <Route path="/home" element={<Home />} />
                <Route path="/category/:id" element={<Category />} />
                <Route path="/details/:id" element={<Details />} />
                <Route path="/profile" element={<UserProfile />} />
                <Route path="/series" element={<Series />} />
                <Route path="/movies" element={<Movies />} />
                <Route path="/tv/:id" element={<TVDetails />} />
                <Route path="/tv/category/:id" element={<TVCategory />} />
                <Route path="/search" element={<Search />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/set-password" element={<SetPassword />} />

                <Route element={<AdminGuardLayout session={session} />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/plans/" element={<PlansManager />} />
                  <Route path="/admin/plans/new" element={<PlanForm />} />
                  <Route path="/admin/plans/edit/:id" element={<PlanForm />} />
                  <Route path="/admin/users" element={<UsersManager />} />
                  <Route path="/admin/subscriptions" element={<SubscriptionsManager />} />
                  <Route path="/admin/transactions" element={<TransactionsManager />} />
                  {/* <Route path="/admin/logs" element={<LogsManager />} /> */}
                </Route>
              </Route>
            </Route>
          </Route>

          <Route
            path="/"
            element={<Navigate to={session ? "/home" : "/login"} replace />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
