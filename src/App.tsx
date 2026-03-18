import { useEffect, lazy, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import globle from "/globle.png";
import type { AppDispatch, RootState } from "./app/store";

// Redux
import { fetchCoins } from "./features/coins/CoinSlice";

// Pages
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
import Notifications from "./pages/Notifications";
import DepositPanel from "./pages/DepositPanel";
import Withdraw from "./pages/Withdraw";
import Gemes from "./pages/Gemes";

// Components
import Navbar from "./component/Navbar";
import CardGrid from "./component/CardGrid";
import ProtectedRoute from "./component/ProtectedRoute";
import BottomNav from "./component/BottomNav";
import UserProfile from "./component/UserProfile";
import AdminLayout from "./component/AdminLayout";
import AdminRoute from "./component/AdminRoute";
import PostGalleryWithUpload from "./component/PostGallery";
import Profile from "./component/UserProfile";
// Lazy loaded
const HostGame = lazy(() => import("./component/HostGame"));

function GameLoader() {
  return (
    <div className="h-screen flex items-center justify-center text-white text-xl animate-pulse">
      Loading game...
    </div>
  );
}

// Wrapper for PostGallery that injects Redux data
function PostGalleryWrapper() {
  const user = useSelector((state: RootState) => state.auth.user);
  if (!user?.token) return <Navigate to="/login" replace />; // redirect if not logged in

  return (
    <PostGalleryWithUpload
      postId="" // optional default or fetch dynamically
      postOwnerId={user.id} // assuming user.id exists in auth.user
      token={user.token}
      createdAt={new Date().toISOString()}
    />
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
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/deposit" element={<DepositPanel />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/gemes" element={<Gemes />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/profile" element={<Profile/>} />

          {/* Protected User Routes */}
          <Route
            path="/Me"
            element={
              <ProtectedRoute>
                <Me />
              </ProtectedRoute>
            }
          />
          <Route
            path="/post"
            element={
              <ProtectedRoute>
                <PostGalleryWrapper />
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
            path="/host-game"
            element={
              <ProtectedRoute>
                <Suspense fallback={<GameLoader />}>
                  <HostGame />
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