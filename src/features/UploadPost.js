import React, { useState } from "react";
import axios from "axios";

export default function UploadPost({ token }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);

    // Optional preview
    const url = URL.createObjectURL(selected);
    setPreview(url);
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("/api/post/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Upload success:", res.data);
      alert("Upload successful!");
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed");
    }
  };

  return (
   <>
    <div>
      <input type="file" accept="image/*,video/*" onChange={handleFileChange} />
      {preview && <video src={preview} controls style={{ width: "100%", marginTop: "10px" }} />}
      <button onClick={handleUpload} style={{ marginTop: "10px" }}>
        Upload
      </button>
    </div>
   </>
  );
};