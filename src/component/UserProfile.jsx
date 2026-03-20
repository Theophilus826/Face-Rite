import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { API } from "../features/Api";
import PostGalleryWithUpload from "../component/PostGallery";

export default function Profile() {
  const user = useSelector((state) => state.auth.user);
  const [posts, setPosts] = useState([]);

  // Fetch posts for the user
  useEffect(() => {
    if (!user) return;
    API.get(`/user/${user._id}/posts`)
      .then((res) => setPosts(res.data.posts || []))
      .catch((err) => console.error(err));
  }, [user]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-center my-6">
        {user?.name}'s Posts
      </h1>

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
              initialLikes={post.reactions?.likes || 0}
              initialLoves={post.reactions?.loves || 0}
              createdAt={post.createdAt}
              mediaFiles={post.media || []}
            />
          </div>
        ))
      )}
    </div>
  );
}