// Vercel Blob Storage Implementation
// Replaces local file system storage for production-ready cloud storage

import { put, del, list } from '@vercel/blob';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

export interface UploadedFile {
  url: string;
  pathname: string;
  size: number;
  filename: string;
}

export interface StudentPhotoUpload {
  studentId: string;
  schoolName: string;
  folderName: string;
  photos: File[];
}

/**
 * Uploads student photos to Vercel Blob storage
 * Maintains folder structure for face recognition compatibility
 */
export async function uploadStudentPhotos(
  uploadData: StudentPhotoUpload
): Promise<UploadedFile[]> {
  const { studentId, schoolName, folderName, photos } = uploadData;
  const uploadedFiles: UploadedFile[] = [];

  for (let i = 0; i < photos.length && i < 20; i++) {
    const photo = photos[i];
    const photoNumber = i + 1;
    
    // Optimize image before upload
    const optimizedBuffer = await optimizeImage(photo);
    
    // Create pathname that maintains folder structure
    const pathname = `schools/${schoolName}/Students/${folderName}/${photoNumber}.jpg`;
    
    try {
      const blob = await put(pathname, optimizedBuffer, {
        access: 'public',
        contentType: 'image/jpeg'
      });

      uploadedFiles.push({
        url: blob.url,
        pathname: pathname,
        size: optimizedBuffer.length,
        filename: `${photoNumber}.jpg`
      });
    } catch (error) {
      console.error(`Failed to upload photo ${photoNumber} for student ${studentId}:`, error);
      throw new Error(`Upload failed for photo ${photoNumber}`);
    }
  }

  return uploadedFiles;
}

/**
 * Uploads teacher photos to Vercel Blob storage
 */
export async function uploadTeacherPhotos(
  teacherId: string,
  schoolName: string,
  folderName: string,
  photos: File[]
): Promise<UploadedFile[]> {
  const uploadedFiles: UploadedFile[] = [];

  for (let i = 0; i < photos.length && i < 10; i++) {
    const photo = photos[i];
    const photoNumber = i + 1;
    
    const optimizedBuffer = await optimizeImage(photo);
    const pathname = `schools/${schoolName}/Teachers/${folderName}/${photoNumber}.jpg`;
    
    try {
      const blob = await put(pathname, optimizedBuffer, {
        access: 'public',
        contentType: 'image/jpeg'
      });

      uploadedFiles.push({
        url: blob.url,
        pathname: pathname,
        size: optimizedBuffer.length,
        filename: `${photoNumber}.jpg`
      });
    } catch (error) {
      console.error(`Failed to upload teacher photo ${photoNumber}:`, error);
      throw new Error(`Upload failed for photo ${photoNumber}`);
    }
  }

  return uploadedFiles;
}

/**
 * Optimizes images for web and storage efficiency
 */
async function optimizeImage(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Optimize image: resize, compress, convert to JPEG
  const optimized = await sharp(buffer)
    .resize(800, 800, { 
      fit: 'inside',
      withoutEnlargement: true 
    })
    .jpeg({ 
      quality: 85,
      progressive: true 
    })
    .toBuffer();

  return optimized;
}

/**
 * Downloads all images from Vercel Blob to local folder structure
 * Used for face recognition training data sync
 */
export async function syncImagesFromBlob(
  basePath: string = './training-data'
): Promise<void> {
  try {
    // List all blobs in the schools directory
    const { blobs } = await list({
      prefix: 'schools/',
      limit: 10000
    });

    console.log(`📦 Found ${blobs.length} files to sync...`);

    for (const blob of blobs) {
      // Parse the blob pathname to recreate folder structure
      // Format: schools/SchoolName/Students/student@data@.../1.jpg
      const pathParts = blob.pathname.split('/');
      
      if (pathParts.length >= 4) {
        const localPath = path.join(basePath, ...pathParts.slice(1)); // Remove 'schools' prefix
        const localDir = path.dirname(localPath);

        // Create directory if it doesn't exist
        await fs.mkdir(localDir, { recursive: true });

        // Check if file already exists and is up to date
        const shouldDownload = await shouldDownloadFile(localPath, blob.size);

        if (shouldDownload) {
          // Download and save file
          const response = await fetch(blob.url);
          const buffer = await response.arrayBuffer();
          
          await fs.writeFile(localPath, Buffer.from(buffer));
          console.log(`✅ Downloaded: ${localPath}`);
        } else {
          console.log(`⏭️  Skipped (up to date): ${localPath}`);
        }
      }
    }

    console.log('🎉 Image sync completed!');
  } catch (error) {
    console.error('❌ Image sync failed:', error);
    throw error;
  }
}

/**
 * Checks if a local file should be downloaded based on size comparison
 */
async function shouldDownloadFile(localPath: string, remoteSize: number): Promise<boolean> {
  try {
    const stats = await fs.stat(localPath);
    return stats.size !== remoteSize;
  } catch (error) {
    // File doesn't exist, should download
    return true;
  }
}

/**
 * Deletes photos from Vercel Blob storage
 */
export async function deletePhotosFromBlob(pathnames: string[]): Promise<void> {
  for (const pathname of pathnames) {
    try {
      await del(pathname);
      console.log(`🗑️  Deleted: ${pathname}`);
    } catch (error) {
      console.error(`Failed to delete ${pathname}:`, error);
    }
  }
}

/**
 * Gets public URL for a blob
 */
export function getBlobUrl(pathname: string): string {
  return `https://${process.env.VERCEL_URL || 'localhost:3000'}/api/blob/${pathname}`;
}

/**
 * Validates photo uploads
 */
export function validatePhotoUpload(files: File[]): { valid: boolean; message?: string } {
  if (files.length < 5) {
    return { valid: false, message: 'Minimum 5 photos required' };
  }
  if (files.length > 20) {
    return { valid: false, message: 'Maximum 20 photos allowed' };
  }
  
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB per file
  
  for (const file of files) {
    if (!allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        message: 'Only JPG, PNG, and WebP files allowed' 
      };
    }
    if (file.size > maxSize) {
      return { 
        valid: false, 
        message: 'File size must be less than 10MB' 
      };
    }
  }
  
  return { valid: true };
}

/**
 * Creates a backup of local training data
 */
export async function backupTrainingData(
  sourcePath: string = './training-data',
  backupPath: string = './training-data-backup'
): Promise<void> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(backupPath, `backup-${timestamp}`);
    
    await fs.mkdir(backupDir, { recursive: true });
    
    // Copy all files from source to backup
    await copyDirectory(sourcePath, backupDir);
    
    console.log(`📋 Training data backed up to: ${backupDir}`);
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}

/**
 * Recursively copies directory
 */
async function copyDirectory(src: string, dest: string): Promise<void> {
  try {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  } catch (error) {
    console.error(`Failed to copy directory ${src} to ${dest}:`, error);
  }
}