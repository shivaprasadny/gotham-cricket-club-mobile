import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api/axiosConfig";

export type UploadUrlResponse = {
  uploadUrl: string;
  imageKey: string;
  contentType: string;
  expiresAt: string;
};

// Step 1: get pre-signed S3 upload URL from backend
export async function getUploadUrl(): Promise<UploadUrlResponse> {
  const res = await api.post<UploadUrlResponse>("/profile/image/upload-url");
  return res.data;
}

// Step 2: upload the image file directly to S3 using the pre-signed URL
export async function uploadToS3(uploadUrl: string, imageUri: string, contentType: string): Promise<void> {
  const response = await fetch(imageUri);
  const blob = await response.blob();
  await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob,
  });
}

// Step 3: tell backend to save the image key
export async function confirmImageUpload(imageKey: string): Promise<{ profileImageUrl: string; profileImageUpdatedAt?: string }> {
  const res = await api.put<{ profileImageUrl: string; profileImageUpdatedAt?: string }>("/profile/image", { imageKey });
  return res.data;
}

// Delete profile image
export async function deleteProfileImage(): Promise<void> {
  await api.delete("/profile/image");
}

// Cache helpers for HomeHeader
export async function cacheProfileImageUrl(url: string | null): Promise<void> {
  if (url) {
    await AsyncStorage.setItem("profile_image_url", url);
  } else {
    await AsyncStorage.removeItem("profile_image_url");
  }
}

export async function getCachedProfileImageUrl(): Promise<string | null> {
  return AsyncStorage.getItem("profile_image_url");
}
