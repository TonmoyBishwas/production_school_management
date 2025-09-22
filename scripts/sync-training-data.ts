#!/usr/bin/env tsx
/**
 * Image Sync Script for Face Recognition Training
 * Downloads all student/teacher photos from Vercel Blob to local folder structure
 * Maintains exact folder naming for ML model compatibility
 */

import { syncImagesFromBlob, backupTrainingData } from '../src/lib/storage';
import { prisma } from '../src/lib/db';
import { createStudentFolderName, createTeacherFolderName } from '../src/lib/utils';
import fs from 'fs/promises';
import path from 'path';

async function main() {
  console.log('🚀 Starting training data sync...');

  const startTime = Date.now();
  const basePath = './training-data';

  try {
    // Backup existing training data
    console.log('📋 Creating backup of existing training data...');
    await backupTrainingData();

    // Sync from Vercel Blob
    console.log('📦 Syncing images from cloud storage...');
    await syncImagesFromBlob(basePath);

    // Generate metadata file for training
    console.log('📄 Generating training metadata...');
    await generateTrainingMetadata(basePath);

    // Generate training summary
    console.log('📊 Generating training summary...');
    await generateTrainingSummary(basePath);

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    console.log(`✅ Training data sync completed in ${duration} seconds!`);
    console.log(`📁 Training data available at: ${path.resolve(basePath)}`);
    
  } catch (error) {
    console.error('❌ Training data sync failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Generates metadata file for ML training
 */
async function generateTrainingMetadata(basePath: string) {
  const schools = await prisma.school.findMany({
    include: {
      students: {
        include: {
          user: true,
          photos: true
        }
      },
      teachers: {
        include: {
          user: true
        }
      }
    }
  });

  const metadata = {
    generated_at: new Date().toISOString(),
    total_schools: schools.length,
    schools: schools.map(school => ({
      id: school.id,
      name: school.name,
      students: school.students.map(student => {
        const age = Math.floor((Date.now() - new Date(student.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        const folderName = createStudentFolderName(
          student.user.firstName,
          age,
          student.grade,
          student.section,
          student.bloodGroup,
          student.admissionDate.toISOString(),
          student.studentId,
          student.user.phone || ''
        );

        return {
          id: student.id,
          student_id: student.studentId,
          name: `${student.user.firstName} ${student.user.lastName}`,
          folder_name: folderName,
          photo_count: student.photos.length,
          grade: student.grade,
          section: student.section,
          blood_group: student.bloodGroup
        };
      }),
      teachers: school.teachers.map(teacher => {
        const age = Math.floor((Date.now() - new Date(teacher.hireDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) + 25; // Estimate age
        const folderName = createTeacherFolderName(
          teacher.user.firstName,
          age,
          'O+', // Default blood group for teachers
          teacher.hireDate.toISOString(),
          teacher.teacherId,
          'Teaching', // Default subject
          teacher.user.email || ''
        );

        return {
          id: teacher.id,
          teacher_id: teacher.teacherId,
          name: `${teacher.user.firstName} ${teacher.user.lastName}`,
          folder_name: folderName,
          subjects: teacher.subjects
        };
      })
    }))
  };

  const metadataPath = path.join(basePath, 'training_metadata.json');
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  console.log(`📄 Metadata saved to: ${metadataPath}`);
}

/**
 * Generates training summary for quick reference
 */
async function generateTrainingSummary(basePath: string) {
  const schools = await prisma.school.findMany({
    include: {
      _count: {
        select: {
          students: true,
          teachers: true
        }
      }
    }
  });

  const summary = {
    sync_date: new Date().toISOString(),
    total_schools: schools.length,
    total_students: schools.reduce((sum, school) => sum + school._count.students, 0),
    total_teachers: schools.reduce((sum, school) => sum + school._count.teachers, 0),
    schools_breakdown: schools.map(school => ({
      name: school.name,
      students: school._count.students,
      teachers: school._count.teachers
    })),
    folder_structure: {
      description: "Each person has a folder with naming convention:",
      student_format: "student@firstname@age@grade@section@bloodgroup@admitdate@studentid@parentphone",
      teacher_format: "teacher@firstname@age@bloodgroup@joindate@teacherid@subject@email",
      photo_format: "1.jpg, 2.jpg, ... (numbered sequentially)"
    },
    usage_instructions: {
      face_recognition: "Use the folder names as class labels for training",
      data_validation: "Check training_metadata.json for detailed information",
      backup_location: "./training-data-backup/ (timestamped backups)"
    }
  };

  const summaryPath = path.join(basePath, 'README.md');
  const readmeContent = `# Face Recognition Training Data

Generated on: ${summary.sync_date}

## Overview
- **Total Schools**: ${summary.total_schools}
- **Total Students**: ${summary.total_students}
- **Total Teachers**: ${summary.total_teachers}

## School Breakdown
${summary.schools_breakdown.map(school => 
  `- **${school.name}**: ${school.students} students, ${school.teachers} teachers`
).join('\n')}

## Folder Structure
Each person has a dedicated folder with the following naming convention:

### Students
Format: \`student@firstname@age@grade@section@bloodgroup@admitdate@studentid@parentphone\`

### Teachers
Format: \`teacher@firstname@age@bloodgroup@joindate@teacherid@subject@email\`

### Photos
- Photos are numbered sequentially: \`1.jpg\`, \`2.jpg\`, etc.
- Students: 5-20 photos each
- Teachers: 1-10 photos each

## Usage for Face Recognition

1. Use folder names as class labels for training
2. Each folder contains optimized JPEG images
3. All images are standardized to max 800x800px
4. Check \`training_metadata.json\` for detailed information

## Backup Information
- Backups are automatically created in \`./training-data-backup/\`
- Each backup is timestamped
- Original cloud storage remains unchanged

## Sync Command
To re-sync training data:
\`\`\`bash
npm run sync-training-data
\`\`\`
`;

  await fs.writeFile(summaryPath, readmeContent);
  
  const summaryJsonPath = path.join(basePath, 'training_summary.json');
  await fs.writeFile(summaryJsonPath, JSON.stringify(summary, null, 2));
  
  console.log(`📊 Summary saved to: ${summaryPath}`);
  console.log(`📊 JSON summary saved to: ${summaryJsonPath}`);
}

// Run the script
if (require.main === module) {
  main();
}

export { main as syncTrainingData };