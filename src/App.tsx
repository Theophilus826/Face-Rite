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
import { PushNotifications } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";
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
import ChatContant from "./pages/ChatContant";
import AboutPage from "./pages/AboutPage";

// Components
import Navbar from "./component/Navbar";
import CardGrid from "./component/CardGrid";
// import ProtectedRoute from "./component/ProtectedRoute";
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

  return (
    <PostGalleryWithUpload
      postId="example-post-id"
      postOwnerId={user?.id || ""}
      token={user?.token || ""}
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

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      console.log("Push notifications disabled on web");
      return;
    }

    const initPush = async () => {
      try {
        PushNotifications.addListener("registration", (token) => {
          console.log("FCM TOKEN:", token.value);
        });

        PushNotifications.addListener("registrationError", (error) => {
          console.error("FCM ERROR:", error);
        });

        PushNotifications.addListener(
          "pushNotificationReceived",
          (notification) => {
            console.log("PUSH RECEIVED:", notification);
          },
        );

        PushNotifications.addListener(
          "pushNotificationActionPerformed",
          (notification) => {
            console.log("PUSH CLICKED:", notification);
          },
        );

        const perm = await PushNotifications.requestPermissions();

        console.log("Notification permission result:", perm);
        
        if (perm.receive === "granted") {
          await PushNotifications.register();
        }
      } catch (err) {
        console.error("Push init error:", err);
      }
    };

    initPush();
  }, []);

  /* ================= UI HIDE LOGIC ================= */
  const hideLayout =
    location.pathname.startsWith("/host-game") ||
    location.pathname.startsWith("/chat") ||
    location.pathname.startsWith("/group");

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${globle})` }}
    >
      <ToastContainer position="top-right" autoClose={3000} />

      {/* ================= NAVIGATION ================= */}
      {!hideLayout && <Navbar />}
      {!hideLayout && <BottomNav />}

      {/* ================= ROUTES ================= */}
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

          <Route path="/home" element={<Home />} />
          <Route path="/me" element={<Me />} />
          <Route path="/deposit" element={<DepositPanel />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:profileUserId" element={<Profile />} />
          <Route path="/post" element={<PostGalleryWrapper />} />
          <Route path="/postComments/:id" element={<PostCommentsWrapper />} />
          <Route path="/coin-history" element={<CoinHistory />} />
          <Route path="/feedbacks" element={<FeedbackPages />} />
          <Route path="/newfeedback" element={<NewFeedback />} />
          <Route path="/feedback/:id" element={<FeedbackDetail />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/gemes" element={<Gemes />} />
          <Route path="/chat" element={<ChatContant />} />
          <Route path="/chat/:chatUserId" element={<ChatPage />} />
          <Route path="/group/:groupId" element={<GroupChatPage />} />

          {/* ================= ADMIN ================= */}

          <Route path="/admin" element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="monitor" replace />} />
              <Route path="monitor" element={<AdminMonitor />} />
              <Route path="credit-coins" element={<AdminCreditCoins />} />
              <Route path="carousel-upload" element={<CarouselUploader />} />
              <Route path="deposits" element={<AdminDeposit />} />
              <Route path="withdraw" element={<AdminWithdrawals />} />

              <Route path="host-game" element={<HostGame />} />

              <Route path="feedbacks" element={<FeedbackPages />} />
            </Route>
          </Route>

          {/* ================= OTHER ================= */}

          <Route path="/cards" element={<CardGrid />} />
          <Route path="/about" element={<AboutPage />} />
          {/* ================= FALLBACK ================= */}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}
