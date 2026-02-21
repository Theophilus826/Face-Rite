import { useEffect, lazy, Suspense } from "react";
import { useDispatch } from "react-redux";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import globle from "/globle.png";
import type { AppDispatch } from "./app/store";

// Redux
import { fetchCoins } from "./features/coins/CoinSlice";

// Pages (eager loaded)
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import FeedbackPages from "./pages/FeedbackPages";
import FeedbackDetail from "./pages/Feedback";
import NewFeedback from "./pages/NewFeedback";
import Me from "./pages/Me";
import CoinHistory from "./pages/CoinHistory";
import AdminMonitor from "./pages/AdminMonitor";
import AdminCreditCoins from "./pages/AdminCreditCoins";

// Components (eager loaded)
import Navbar from "./component/Navbar";
import CardGrid from "./component/CardGrid";
import ProtectedRoute from "./component/ProtectedRoute";
import BottomNav from "./component/BottomNav";
import UserProfile from "./component/UserProfile";
import AdminLayout from "./component/AdminLayout";
import AdminRoute from "./component/AdminRoute";
import Online from "./component/Online";

// Lazy load heavy pages
const HostGame = lazy(() => import("./component/HostGame"));

function GameLoader() {
  return (
    <div className="h-screen flex items-center justify-center text-white text-xl animate-pulse">
      Loading game...
    </div>
  );
}

export default function App() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(fetchCoins());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <div
        className="min-h-screen w-full bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${globle})` }}
      >
        <ToastContainer position="top-right" autoClose={3000} />
        <Navbar />
        <BottomNav />

        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected User Routes */}
          <Route
            path="/Me"
            element={
              <ProtectedRoute>
                <Me />
              </ProtectedRoute>
            }
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route
            path="/online"
            element={
              <ProtectedRoute>
                <Online />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/:id"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />

          {/* Game */}
          <Route
            path="/games"
            element={
              <ProtectedRoute>
                <Suspense fallback={<GameLoader />}>
                  <HostGame />
                  <CardGrid />
                </Suspense>
              </ProtectedRoute>
            }
          />

          {/* Feedback */}
          <Route
            path="/Feedbacks"
            element={
              <ProtectedRoute>
                <FeedbackPages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/NewFeedback"
            element={
              <ProtectedRoute>
                <NewFeedback />
              </ProtectedRoute>
            }
          />
          <Route
            path="/Feedback/:id"
            element={
              <ProtectedRoute>
                <FeedbackDetail />
              </ProtectedRoute>
            }
          />

          {/* Admin */}
          <Route path="/admin" element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="monitor" replace />} />
              <Route path="monitor" element={<AdminMonitor />} />
              <Route path="credit-coins" element={<AdminCreditCoins />} />
              <Route path="host-game" element={<HostGame />} />
              <Route path="Feedbacks" element={<FeedbackPages />} />
            </Route>
          </Route>

          {/* Optional */}
          <Route path="/cards" element={<CardGrid />} />
          <Route path="/coin-history" element={<CoinHistory />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}