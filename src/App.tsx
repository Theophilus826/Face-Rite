import { useEffect, lazy, Suspense, useRef } from "react";
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
import DownloadPage from "./pages/Download";
import AdminUploadApk from "./component/AdminUploadApk";
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
  const pushInitializedRef = useRef(false);

  useEffect(() => {
    dispatch(fetchCoins());
  }, [dispatch]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    if (pushInitializedRef.current) return;
    pushInitializedRef.current = true;

    let regListener;
    let receivedListener;
    let actionListener;
    let errorListener;

    const initPush = async () => {
      try {
        console.log("🔵 PUSH INIT START");

        const perm = await PushNotifications.requestPermissions();

        console.log("🔵 PUSH PERMISSION:", JSON.stringify(perm));

        if (perm.receive !== "granted") {
          console.log("❌ Permission denied");
          return;
        }

        // LISTENERS FIRST
        errorListener = await PushNotifications.addListener(
          "registrationError",
          (error) => {
            console.error("❌ REGISTRATION ERROR:", error);
          },
        );

        regListener = await PushNotifications.addListener(
          "registration",
          async (token) => {
            try {
              console.log("🔥 DEVICE TOKEN:", token.value);

              const storedUser = JSON.parse(
                localStorage.getItem("user") || "null",
              );

              const userToken = storedUser?.token;

              console.log("👤 USER FOUND:", !!storedUser);
              console.log("🔑 AUTH TOKEN FOUND:", !!userToken);

              if (!userToken) {
                console.log("⚠️ user not logged in, skipping token save");
                return;
              }

              // TEMPORARY: use real API directly
              const url =
                "https://swordgame-5.onrender.com/api/notifications/fcm-token";

              console.log("📤 SAVING FCM TOKEN TO:", url);

              const response = await fetch(url, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${userToken}`,
                },
                body: JSON.stringify({
                  token: token.value,
                }),
              });

              const text = await response.text();

              console.log("✅ FCM SAVE STATUS:", response.status);
              console.log("✅ FCM SAVE RESPONSE:", text);

              try {
                console.log("✅ FCM JSON:", JSON.parse(text));
              } catch {
                console.log("⚠️ RESPONSE NOT JSON");
              }
            } catch (err) {
              console.error("❌ FCM SAVE ERROR:", err);
            }
          },
        );

        receivedListener = await PushNotifications.addListener(
          "pushNotificationReceived",
          (notification) => {
            console.log("📩 PUSH RECEIVED:", notification);
          },
        );

        actionListener = await PushNotifications.addListener(
          "pushNotificationActionPerformed",
          (action) => {
            console.log("👆 PUSH CLICKED:", action);

            const data = action.notification.data;

            if (data?.type === "chat") {
              window.location.href = `/chat/${data.chatUserId}`;
            }

            if (data?.type === "like") {
              window.location.href = `/postComments/${data.postId}`;
            }

            if (data?.type === "system") {
              window.location.href = `/notifications`;
            }
          },
        );

        console.log("🟢 REGISTERING PUSH...");
        await PushNotifications.register();
        console.log("🟢 REGISTER CALLED");
      } catch (err) {
        console.error("❌ PUSH INIT ERROR:", err);
      }
    };

    initPush();

    return () => {
      regListener?.remove?.();
      receivedListener?.remove?.();
      actionListener?.remove?.();
      errorListener?.remove?.();
    };
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
          <Route path="/download" element={<DownloadPage />} />

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
              <Route path="adminuploadapk" element={<AdminUploadApk />} />

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
