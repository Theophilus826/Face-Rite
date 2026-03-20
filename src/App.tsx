// src/App.tsx
import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import globle from "/globle.png";

import type { AppDispatch, RootState } from "./app/store";

// Redux actions
import { fetchCoins } from "./features/coins/CoinSlice";

// Components
import Navbar from "./component/Navbar";
import BottomNav from "./component/BottomNav";
import ProtectedRoute from "./component/ProtectedRoute";
import AdminRoute from "./component/AdminRoute";
import AdminLayout from "./component/AdminLayout";
import PostGalleryWithUpload from "./component/PostGallery";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Notifications from "./pages/Notifications";
import Me from "./pages/Me";
import CoinHistory from "./pages/CoinHistory";

// Lazy load
const HostGame = lazy(() => import("./component/HostGame"));

// Loader for lazy routes
function GameLoader() {
  return (
    <div className="h-screen flex items-center justify-center text-white text-xl animate-pulse">
      Loading game...
    </div>
  );
}

// Wrapper for protected PostGallery
function PostGalleryWrapper() {
  const user = useSelector((state: RootState) => state.auth.user);

  if (!user?.token) return <Navigate to="/login" replace />;

  return (
    <PostGalleryWithUpload
      postId="example-post-id"
      postOwnerId={user.id}
      token={user.token}
      createdAt={new Date().toISOString()}
      user={user}
      comments={[]}
     
    />
  );
}

// Main App wrapper
export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

// App content
function AppContent() {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();

  useEffect(() => {
    dispatch(fetchCoins());
  }, [dispatch]);

  const hideLayout = location.pathname.startsWith("/host-game");

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${globle})` }}
    >
      <ToastContainer position="top-right" autoClose={3000} />
      {!hideLayout && <Navbar />}
      {!hideLayout && <BottomNav />}

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/notifications" element={<Notifications />} />
        
        {/* Protected Routes */}
        <Route
          path="/me"
          element={
            <ProtectedRoute>
              <Me />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coin-history"
          element={
            <ProtectedRoute>
              <CoinHistory />
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

        {/* Game Route (no Navbar/BottomNav) */}
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

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="monitor" replace />} />
            {/* Add admin pages here */}
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}