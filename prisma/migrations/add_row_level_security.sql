-- Row Level Security Migration for Multi-Tenancy
-- This ensures complete data isolation between schools

-- Enable RLS on all school-specific tables
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_photos ENABLE ROW LEVEL SECURITY;

-- Create function to get current school ID from JWT context
CREATE OR REPLACE FUNCTION current_school_id()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.current_school_id', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get current user role from JWT context
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.current_user_role', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for SCHOOLS table
CREATE POLICY school_isolation ON schools
  FOR ALL USING (
    current_user_role() = 'superadmin' OR 
    id = current_school_id()
  );

-- RLS Policies for USERS table
CREATE POLICY user_isolation ON users
  FOR ALL USING (
    current_user_role() = 'superadmin' OR 
    school_id = current_school_id()
  );

-- RLS Policies for STUDENTS table
CREATE POLICY student_isolation ON students
  FOR ALL USING (
    current_user_role() = 'superadmin' OR 
    school_id = current_school_id()
  );

-- RLS Policies for TEACHERS table
CREATE POLICY teacher_isolation ON teachers
  FOR ALL USING (
    current_user_role() = 'superadmin' OR 
    school_id = current_school_id()
  );

-- RLS Policies for PARENTS table
CREATE POLICY parent_isolation ON parents
  FOR ALL USING (
    current_user_role() = 'superadmin' OR 
    school_id = current_school_id()
  );

-- RLS Policies for ATTENDANCE table
CREATE POLICY attendance_isolation ON attendance
  FOR ALL USING (
    current_user_role() = 'superadmin' OR 
    school_id = current_school_id()
  );

-- RLS Policies for SCHEDULES table
CREATE POLICY schedule_isolation ON schedules
  FOR ALL USING (
    current_user_role() = 'superadmin' OR 
    school_id = current_school_id()
  );

-- RLS Policies for SUBJECTS table
CREATE POLICY subject_isolation ON subjects
  FOR ALL USING (
    current_user_role() = 'superadmin' OR 
    school_id = current_school_id()
  );

-- RLS Policies for ACADEMIC_CALENDAR table
CREATE POLICY calendar_isolation ON academic_calendar
  FOR ALL USING (
    current_user_role() = 'superadmin' OR 
    school_id = current_school_id()
  );

-- RLS Policies for EXAMS table
CREATE POLICY exam_isolation ON exams
  FOR ALL USING (
    current_user_role() = 'superadmin' OR 
    school_id = current_school_id()
  );

-- RLS Policies for GRADES table
-- Grades are linked through students, so check student's school
CREATE POLICY grade_isolation ON grades
  FOR ALL USING (
    current_user_role() = 'superadmin' OR 
    EXISTS (
      SELECT 1 FROM students s 
      WHERE s.id = grades.student_id 
      AND s.school_id = current_school_id()
    )
  );

-- RLS Policies for HOMEWORK table
CREATE POLICY homework_isolation ON homework
  FOR ALL USING (
    current_user_role() = 'superadmin' OR 
    school_id = current_school_id()
  );

-- RLS Policies for STUDENT_PHOTOS table
CREATE POLICY photo_isolation ON student_photos
  FOR ALL USING (
    current_user_role() = 'superadmin' OR 
    school_id = current_school_id()
  );

-- Create indices for better performance with RLS
CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_teachers_school_id ON teachers(school_id);
CREATE INDEX IF NOT EXISTS idx_parents_school_id ON parents(school_id);
CREATE INDEX IF NOT EXISTS idx_attendance_school_id ON attendance(school_id);
CREATE INDEX IF NOT EXISTS idx_schedules_school_id ON schedules(school_id);
CREATE INDEX IF NOT EXISTS idx_subjects_school_id ON subjects(school_id);
CREATE INDEX IF NOT EXISTS idx_academic_calendar_school_id ON academic_calendar(school_id);
CREATE INDEX IF NOT EXISTS idx_exams_school_id ON exams(school_id);
CREATE INDEX IF NOT EXISTS idx_homework_school_id ON homework(school_id);
CREATE INDEX IF NOT EXISTS idx_student_photos_school_id ON student_photos(school_id);