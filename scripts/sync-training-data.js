#!/usr/bin/env node

/**
 * Training Data Sync Script
 *
 * This script downloads images from Vercel Blob storage and organizes them
 * into the folder structure required for face recognition training.
 *
 * Folder structure created:
 * ./training-data/
 *   ├── School_Name/
 *   │   ├── Students/
 *   │   │   ├── student@firstname@age@grade@section@bloodgroup@admitdate@studentID@phone/
 *   │   │   │   ├── 1.jpg
 *   │   │   │   ├── 2.jpg
 *   │   │   │   └── ...20.jpg
 *   │   └── Teachers/
 *   │       └── teacher@firstname@age@bloodgroup@joindate@teacherID@subject@email/
 *   │           ├── 1.jpg
 *   │           └── ...5.jpg
 *
 * Usage:
 *   node scripts/sync-training-data.js
 *   npm run sync-training-data
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Download file from URL
 */
async function downloadFile(url, filepath) {
  try {
    return new Promise((resolve, reject) => {
      const file = require('fs').createWriteStream(filepath);

      https.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve();
        });

        file.on('error', (err) => {
          fs.unlink(filepath); // Delete partial file
          reject(err);
        });
      }).on('error', (err) => {
        reject(err);
      });
    });
  } catch (error) {
    console.error(`Error downloading ${url}:`, error.message);
    throw error;
  }
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dob) {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Create folder name for student
 */
function createStudentFolderName(student, user) {
  const age = calculateAge(student.dob);
  const admissionDate = new Date(student.admissionDate).toISOString().split('T')[0];

  return [
    'student',
    user.firstName.replace(/[^a-zA-Z0-9]/g, ''),
    age.toString(),
    student.grade.toString(),
    student.section.replace(/[^a-zA-Z0-9]/g, ''),
    student.bloodGroup.replace(/[^a-zA-Z0-9]/g, ''),
    admissionDate,
    student.studentId.replace(/[^a-zA-Z0-9]/g, ''),
    (user.phone || 'noPhone').replace(/[^a-zA-Z0-9]/g, '')
  ].join('@');
}

/**
 * Create folder name for teacher
 */
function createTeacherFolderName(teacher, user) {
  const age = calculateAge(teacher.hireDate); // Using hire date as approximate age reference
  const hireDate = new Date(teacher.hireDate).toISOString().split('T')[0];
  const subjects = Array.isArray(teacher.subjects) ? teacher.subjects.join('-') : 'NoSubject';

  return [
    'teacher',
    user.firstName.replace(/[^a-zA-Z0-9]/g, ''),
    age.toString(),
    'O+', // Default blood group for teachers (not stored)
    hireDate,
    teacher.teacherId.replace(/[^a-zA-Z0-9]/g, ''),
    subjects.replace(/[^a-zA-Z0-9-]/g, ''),
    (user.email || 'noEmail').replace(/[^a-zA-Z0-9]/g, '')
  ].join('@');
}

/**
 * Ensure directory exists
 */
async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Sync student photos
 */
async function syncStudentPhotos(school, outputDir) {
  console.log(`📚 Syncing student photos for ${school.name}...`);

  const students = await prisma.student.findMany({
    where: { schoolId: school.id },
    include: {
      user: true,
      photos: true
    }
  });

  const studentsDir = path.join(outputDir, school.name.replace(/[^a-zA-Z0-9]/g, '_'), 'Students');
  await ensureDir(studentsDir);

  let syncedCount = 0;
  let errorCount = 0;

  for (const student of students) {
    try {
      const folderName = createStudentFolderName(student, student.user);
      const studentDir = path.join(studentsDir, folderName);
      await ensureDir(studentDir);

      console.log(`  👨‍🎓 Processing student: ${student.user.firstName} (${student.photos.length} photos)`);

      for (const photo of student.photos) {
        try {
          const filename = `${photo.photoNumber}.jpg`;
          const filepath = path.join(studentDir, filename);

          // Check if file already exists
          try {
            await fs.access(filepath);
            console.log(`    ⏭️  Skipping existing: ${filename}`);
            continue;
          } catch {
            // File doesn't exist, proceed with download
          }

          await downloadFile(photo.photoPath, filepath);
          console.log(`    ✅ Downloaded: ${filename}`);
          syncedCount++;
        } catch (error) {
          console.error(`    ❌ Failed to download photo ${photo.photoNumber}:`, error.message);
          errorCount++;
        }
      }
    } catch (error) {
      console.error(`  ❌ Failed to process student ${student.user.firstName}:`, error.message);
      errorCount++;
    }
  }

  console.log(`📚 Student sync complete: ${syncedCount} downloaded, ${errorCount} errors`);
  return { syncedCount, errorCount };
}

/**
 * Sync teacher photos (if implemented)
 */
async function syncTeacherPhotos(school, outputDir) {
  console.log(`👨‍🏫 Syncing teacher photos for ${school.name}...`);

  // Note: Teacher photos not implemented in current schema
  // This is a placeholder for future implementation

  const teachers = await prisma.teacher.findMany({
    where: { schoolId: school.id },
    include: {
      user: true
    }
  });

  const teachersDir = path.join(outputDir, school.name.replace(/[^a-zA-Z0-9]/g, '_'), 'Teachers');
  await ensureDir(teachersDir);

  console.log(`  📝 Created teacher directory structure for ${teachers.length} teachers`);

  // Create folder structure for future teacher photo implementation
  for (const teacher of teachers) {
    const folderName = createTeacherFolderName(teacher, teacher.user);
    const teacherDir = path.join(teachersDir, folderName);
    await ensureDir(teacherDir);

    // Create a placeholder file
    const placeholderPath = path.join(teacherDir, 'PLACEHOLDER.txt');
    await fs.writeFile(placeholderPath, `Teacher: ${teacher.user.firstName} ${teacher.user.lastName}\nID: ${teacher.teacherId}\nSubjects: ${JSON.stringify(teacher.subjects)}\n\nPhotos will be stored here when teacher photo upload is implemented.`);
  }

  console.log(`👨‍🏫 Teacher structure created for ${teachers.length} teachers`);
  return { syncedCount: 0, errorCount: 0 };
}

/**
 * Main sync function
 */
async function syncTrainingData() {
  console.log('🚀 Starting training data synchronization...');
  console.log('📁 Output directory: ./training-data/');

  const outputDir = path.join(process.cwd(), 'training-data');
  await ensureDir(outputDir);

  try {
    // Get all schools
    const schools = await prisma.school.findMany({
      where: {
        id: { not: 'school_superadmin' } // Exclude superadmin virtual school
      }
    });

    if (schools.length === 0) {
      console.log('⚠️  No schools found in database');
      return;
    }

    console.log(`🏫 Found ${schools.length} school(s) to sync`);

    let totalSynced = 0;
    let totalErrors = 0;

    for (const school of schools) {
      console.log(`\n🏫 Processing school: ${school.name}`);

      // Sync student photos
      const studentResults = await syncStudentPhotos(school, outputDir);
      totalSynced += studentResults.syncedCount;
      totalErrors += studentResults.errorCount;

      // Sync teacher photos (placeholder)
      const teacherResults = await syncTeacherPhotos(school, outputDir);
      totalSynced += teacherResults.syncedCount;
      totalErrors += teacherResults.errorCount;
    }

    console.log('\n✅ Synchronization completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Files downloaded: ${totalSynced}`);
    console.log(`   - Errors: ${totalErrors}`);
    console.log(`   - Schools processed: ${schools.length}`);

    if (totalErrors > 0) {
      console.log('\n⚠️  Some files failed to download. Check the logs above for details.');
    }

    // Create summary file
    const summaryPath = path.join(outputDir, 'sync-summary.json');
    const summary = {
      timestamp: new Date().toISOString(),
      schoolsProcessed: schools.length,
      filesDownloaded: totalSynced,
      errors: totalErrors,
      schools: schools.map(s => s.name)
    };

    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`📋 Summary saved to: ${summaryPath}`);

  } catch (error) {
    console.error('❌ Synchronization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Command line interface
 */
if (require.main === module) {
  syncTrainingData()
    .then(() => {
      console.log('\n🎉 All done! Your training data is ready for machine learning.');
      console.log('📁 Check the ./training-data/ directory for organized folders.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = {
  syncTrainingData,
  createStudentFolderName,
  createTeacherFolderName
};