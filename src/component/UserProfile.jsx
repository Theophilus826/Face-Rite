import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { API } from "../features/Api";
import PostGalleryWithUpload from "../component/PostGallery";

export default function Profile() {
  const user = useSelector((state) => state.auth.user);
  const [posts, setPosts] = useState([]);
  const [profileImage, setProfileImage] = useState(user?.avatar || "");
  const [uploading, setUploading] = useState(false);

  // Fetch posts for the user
  useEffect(() => {
    if (!user) return;
    API.get(`/user/${user._id}/posts`)
      .then((res) => setPosts(res.data.posts || []))
      .catch((err) => console.error(err));
  }, [user]);

  // Update profile image by picking an existing post image
  const handleSetProfileFromPost = async (url) => {
    try {
      setUploading(true);

      await API.put(`/user/${user._id}/avatar`, { avatar: url });
      setProfileImage(url);
    } catch (err) {
      console.error("Failed to set profile image from post:", err);
    } finally {
      setUploading(false);
    }
  };

  // Optional: upload new profile image
  const handleProfileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "image");

      const result = await API.post("/post/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const url = result.media.url;

      await API.put(`/user/${user._id}/avatar`, { avatar: url });
      setProfileImage(url);
    } catch (err) {
      console.error("Profile image upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-center my-6">
        {user?.name}'s Profile
      </h1>

      {/* Profile Image */}
      <div className="flex flex-col items-center mb-8">
        <img
          src={profileImage || "/default-avatar.png"}
          alt="Profile"
          className="w-32 h-32 rounded-full object-cover border-2 border-gray-300"
        />
        <label className="mt-2 cursor-pointer text-blue-600 hover:underline">
          {uploading ? "Uploading..." : "Change Profile Image"}
          <input
            type="file"
            accept="image/*"
            onChange={handleProfileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* User Posts */}
      {posts.length === 0 ? (
        <p className="text-center text-gray-500">You have not posted yet</p>
      ) : (
        posts.map((post) => (
          <div key={post._id} className="mb-6">
            <PostGalleryWithUpload
              postId={post._id}
              postOwnerId={post.user?._id || post.user}
              token={user?.token}
              text={post.text || ""}
              initialLikes={post.likeCount || 0}
              initialLoves={post.loveCount || 0}
              createdAt={post.createdAt}
              mediaFiles={post.media || []}
              // Allow picking an image from post
              onSelectMedia={(mediaUrl) => handleSetProfileFromPost(mediaUrl)}
            />
          </div>
        ))
      )}
    </div>
  );
}