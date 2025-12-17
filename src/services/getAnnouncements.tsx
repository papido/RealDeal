import axios from "axios";

const getAnnouncements = async () => {
  try {
    const response = await axios.post(
      "https://smile-uat.etiqa.com.my/mobile-svc-regional/api/Route/v1/Smile/Announcement",
      {},
      {
        headers: {
          "Content-Type": "application/json",
          "X-Regional-Id":
            "Key regional.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmlnaW4iOiJNWSIsIm5iZiI6MTczNjE0ODM3NSwiZXhwIjoxNzM4NzQwMzc1LCJpYXQiOjE3MzYxNDgzNzUsImlzcyI6IlJlZ2lvbmFsLU1vYmlsZSIsImF1ZCI6IlJlZ2lvbmFsLVVzZXIifQ.MiJl65dRNg_KdMKE4WJcxnV2hCM7w-YY_smx9D8wLqM",
        },
      }
    );

    return response.data?.data ?? [];
  } catch (error: any) {
    console.error("❌ API error:", error.response?.data || error.message);
  }
};

export default getAnnouncements;
