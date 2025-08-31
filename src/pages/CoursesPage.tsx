import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import CourseBrowser from './student/CourseBrowser';
import InstructorCoursesPage from './instructor/InstructorCoursesPage';

const CoursesPage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Route based on user role
  switch (profile?.role) {
    case 'instructor':
      return <InstructorCoursesPage />;
    case 'student':
      return <CourseBrowser />;
    case 'admin':
      // Admins can see all courses - for now use CourseBrowser
      return <CourseBrowser />;
    default:
      // Default to student view if no specific role
      return <CourseBrowser />;
  }
};

export default CoursesPage;