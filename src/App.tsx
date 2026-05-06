import { useEffect, lazy, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useParams,
} from "react-router-dom";
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
import ChatPage from "./pages/ChatPage";
import GroupChatPage from "./pages/GroupChatPage";
import PostComments, { type CommentType } from "./pages/PostComments";
import AdminDeposit from "./pages/AdminDeposit";
import AdminWithdrawals from "./pages/AdminWithdrawals";


// Components
import Navbar from "./component/Navbar";
import CardGrid from "./component/CardGrid";
import ProtectedRoute from "./component/ProtectedRoute";
import BottomNav from "./component/BottomNav";
import AdminLayout from "./component/AdminLayout";
import AdminRoute from "./component/AdminRoute";
import CarouselUploader from "./component/CarouselUploader";
import PostGalleryWithUpload from "./component/PostGallery";
import Profile from "./component/UserProfile";

// Lazy
const HostGame = lazy(() => import("./component/HostGame"));

/* ---------------- Loader ---------------- */
function GameLoader() {
  return (
    <div className="h-screen flex items-center justify-center text-white text-xl animate-pulse">
      🎮 Loading game...
    </div>
  );
}

/* ---------------- Post Gallery Wrapper ---------------- */
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

/* ---------------- Post Comments Wrapper ---------------- */
function PostCommentsWrapper() {
  const user = useSelector((state: RootState) => state.auth.user);
  const { id } = useParams();

  if (!user?.token) return <Navigate to="/login" replace />;

  return (
    <PostComments
      postId={id || ""}
      user={user}
      comments={[]}
      onNewComment={(c: CommentType) => console.log("New comment:", c)}
    />
  );
}

/* ---------------- App Root ---------------- */
export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

/* ---------------- App Content ---------------- */
function AppContent() {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);

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

      {/* ✅ IMPORTANT: Suspense ONLY wraps lazy usage */}
      <Suspense fallback={<GameLoader />}>
        <Routes>
          {/* ================= PUBLIC ================= */}

          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route
            path="/login"
            element={user?.token ? <Navigate to="/home" replace /> : <Login />}
          />

          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/host-game" element={<HostGame />} />

          {/* ================= PROTECTED ================= */}

          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          <Route
            path="/me"
            element={
              <ProtectedRoute>
                <Me />
              </ProtectedRoute>
            }
          />

          <Route
            path="/deposit"
            element={
              <ProtectedRoute>
                <DepositPanel />
              </ProtectedRoute>
            }
          />

          <Route
            path="/withdraw"
            element={
              <ProtectedRoute>
                <Withdraw />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile/:profileUserId"
            element={
              <ProtectedRoute>
                <Profile />
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
            path="/postComments/:id"
            element={
              <ProtectedRoute>
                <PostCommentsWrapper />
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
            path="/feedbacks"
            element={
              <ProtectedRoute>
                <FeedbackPages />
              </ProtectedRoute>
            }
          />

          <Route
            path="/newfeedback"
            element={
              <ProtectedRoute>
                <NewFeedback />
              </ProtectedRoute>
            }
          />

          <Route
            path="/feedback/:id"
            element={
              <ProtectedRoute>
                <FeedbackDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />

          <Route
            path="/gemes"
            element={
              <ProtectedRoute>
                <Gemes />
              </ProtectedRoute>
            }
          />

          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/chat/:chatUserId"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/group/:groupId"
            element={
              <ProtectedRoute>
                <GroupChatPage />
              </ProtectedRoute>
            }
          />
          

          {/* ================= ADMIN ================= */}

          <Route path="/admin" element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="monitor" replace />} />
              <Route path="monitor" element={<AdminMonitor />} />
              <Route path="credit-coins" element={<AdminCreditCoins />} />
              <Route path="carousel-upload" element={<CarouselUploader />} />
              <Route path="deposits" element={<AdminDeposit />} />
              <Route path="withdraw" element={<AdminWithdrawals />} />

              {/* ⚡ Lazy works safely here now */}
              <Route path="host-game" element={<HostGame />} />

              <Route path="feedbacks" element={<FeedbackPages />} />
            </Route>
          </Route>

          {/* ================= OPTIONAL ================= */}

          <Route path="/cards" element={<CardGrid />} />

          {/* ================= FALLBACK ================= */}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}
