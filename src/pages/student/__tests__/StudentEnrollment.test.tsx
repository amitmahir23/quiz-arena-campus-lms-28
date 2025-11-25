import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import StudentDashboard from "../StudentDashboard";
import { useEnrollments } from "@/hooks/useEnrollments";

// Mock dependencies
jest.mock("@/lib/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("@/hooks/useEnrollments", () => ({
  useEnrollments: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

jest.mock("@/components/layout/Navbar", () => ({
  __esModule: true,
  default: () => <nav>Navbar</nav>,
}));

jest.mock("@/components/layout/Footer", () => ({
  __esModule: true,
  default: () => <footer>Footer</footer>,
}));

// Mock all dashboard components to simplify testing
jest.mock("@/components/dashboard/PomodoroTimer", () => ({
  __esModule: true,
  default: () => <div>PomodoroTimer</div>,
}));

jest.mock("@/components/dashboard/TodoList", () => ({
  __esModule: true,
  default: () => <div>TodoList</div>,
}));

jest.mock("@/hooks/useScheduledMeetings", () => ({
  useScheduledMeetings: () => ({ meetings: [], isLoading: false }),
}));

jest.mock("@/components/analytics/PerformanceRadarChart", () => ({
  __esModule: true,
  default: () => <div>PerformanceRadarChart</div>,
}));

jest.mock("@/components/analytics/CompletionProgressChart", () => ({
  __esModule: true,
  default: () => <div>CompletionProgressChart</div>,
}));

jest.mock("@/components/analytics/LearningDNAChart", () => ({
  __esModule: true,
  default: () => <div>LearningDNAChart</div>,
}));

jest.mock("@/components/analytics/PerformancePrediction", () => ({
  __esModule: true,
  default: () => <div>PerformancePrediction</div>,
}));

jest.mock("@/components/analytics/ActivityHeatmap", () => ({
  __esModule: true,
  default: () => <div>ActivityHeatmap</div>,
}));

describe("Student Enrollment", () => {
  const mockStudentId = "student-123";
  const mockUser = { id: mockStudentId };
  const mockProfile = { role: "student" };
  const mockRefetchEnrollments = jest.fn();

  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockIlike: jest.Mock;
  let mockEq: jest.Mock;
  let mockInsert: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      profile: mockProfile,
    });

    (useEnrollments as jest.Mock).mockReturnValue({
      data: [],
      refetch: mockRefetchEnrollments,
    });

    // Setup Supabase mock chain
    mockInsert = jest.fn().mockReturnValue({ error: null });
    mockEq = jest.fn().mockReturnValue({ insert: mockInsert });
    mockIlike = jest.fn().mockReturnValue({ eq: mockEq });
    mockSelect = jest.fn().mockReturnValue({ ilike: mockIlike });
    mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

    (supabase.from as jest.Mock) = mockFrom;
  });

  it("renders the enrollment form", () => {
    render(<StudentDashboard />);

    expect(
      screen.getByPlaceholderText(/enter course code/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /join course/i })
    ).toBeInTheDocument();
  });

  it("enrolls student successfully with valid course code", async () => {
    const mockCourse = {
      id: "course-123",
      title: "Test Course",
      code: "TEST123",
    };

    // Mock course lookup
    const mockCourseSelect = jest.fn().mockReturnValue({
      ilike: jest.fn().mockReturnValue({
        data: [mockCourse],
        error: null,
      }),
    });

    // Mock enrollment check (no existing enrollment)
    const mockEnrollmentCheck = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          data: [],
          error: null,
        }),
      }),
    });

    // Mock enrollment insert
    const mockEnrollmentInsert = jest.fn().mockReturnValue({
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "courses") {
        return { select: mockCourseSelect };
      }
      if (table === "enrollments") {
        return {
          select: mockEnrollmentCheck,
          insert: mockEnrollmentInsert,
        };
      }
      return { select: mockSelect };
    });

    render(<StudentDashboard />);

    const courseCodeInput = screen.getByPlaceholderText(/enter course code/i);
    const joinButton = screen.getByRole("button", { name: /join course/i });

    fireEvent.change(courseCodeInput, { target: { value: "TEST123" } });
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(mockEnrollmentInsert).toHaveBeenCalledWith({
        student_id: mockStudentId,
        course_id: mockCourse.id,
      });
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("Successfully enrolled")
      );
      expect(mockRefetchEnrollments).toHaveBeenCalled();
    });
  });

  it("shows error when course code is empty", async () => {
    render(<StudentDashboard />);

    const joinButton = screen.getByRole("button", { name: /join course/i });
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Please enter a course code");
    });
  });

  it("shows error when user is not a student", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      profile: { role: "instructor" },
    });

    render(<StudentDashboard />);

    const courseCodeInput = screen.getByPlaceholderText(/enter course code/i);
    const joinButton = screen.getByRole("button", { name: /join course/i });

    fireEvent.change(courseCodeInput, { target: { value: "TEST123" } });
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Only students can enroll in courses"
      );
    });
  });

  it("shows error when course is not found", async () => {
    // Mock course lookup returning empty array
    const mockCourseSelect = jest.fn().mockReturnValue({
      ilike: jest.fn().mockReturnValue({
        data: [],
        error: null,
      }),
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "courses") {
        return { select: mockCourseSelect };
      }
      return { select: mockSelect };
    });

    render(<StudentDashboard />);

    const courseCodeInput = screen.getByPlaceholderText(/enter course code/i);
    const joinButton = screen.getByRole("button", { name: /join course/i });

    fireEvent.change(courseCodeInput, { target: { value: "INVALID" } });
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Course not found. Please check the code and try again."
      );
    });
  });

  it("shows error when student is already enrolled", async () => {
    const mockCourse = {
      id: "course-123",
      title: "Test Course",
      code: "TEST123",
    };

    // Mock course lookup
    const mockCourseSelect = jest.fn().mockReturnValue({
      ilike: jest.fn().mockReturnValue({
        data: [mockCourse],
        error: null,
      }),
    });

    // Mock enrollment check (existing enrollment found)
    const mockEnrollmentCheck = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          data: [{ id: "enrollment-123" }],
          error: null,
        }),
      }),
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "courses") {
        return { select: mockCourseSelect };
      }
      if (table === "enrollments") {
        return { select: mockEnrollmentCheck };
      }
      return { select: mockSelect };
    });

    render(<StudentDashboard />);

    const courseCodeInput = screen.getByPlaceholderText(/enter course code/i);
    const joinButton = screen.getByRole("button", { name: /join course/i });

    fireEvent.change(courseCodeInput, { target: { value: "TEST123" } });
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "You are already enrolled in this course"
      );
    });
  });

  it("handles database error during enrollment", async () => {
    const mockCourse = {
      id: "course-123",
      title: "Test Course",
      code: "TEST123",
    };

    const mockError = { message: "Database connection error" };

    // Mock course lookup
    const mockCourseSelect = jest.fn().mockReturnValue({
      ilike: jest.fn().mockReturnValue({
        data: [mockCourse],
        error: null,
      }),
    });

    // Mock enrollment check
    const mockEnrollmentCheck = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          data: [],
          error: null,
        }),
      }),
    });

    // Mock enrollment insert with error
    const mockEnrollmentInsert = jest.fn().mockReturnValue({
      error: mockError,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "courses") {
        return { select: mockCourseSelect };
      }
      if (table === "enrollments") {
        return {
          select: mockEnrollmentCheck,
          insert: mockEnrollmentInsert,
        };
      }
      return { select: mockSelect };
    });

    render(<StudentDashboard />);

    const courseCodeInput = screen.getByPlaceholderText(/enter course code/i);
    const joinButton = screen.getByRole("button", { name: /join course/i });

    fireEvent.change(courseCodeInput, { target: { value: "TEST123" } });
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Database connection error");
    });
  });

  it("clears course code input after successful enrollment", async () => {
    const mockCourse = {
      id: "course-123",
      title: "Test Course",
      code: "TEST123",
    };

    const mockCourseSelect = jest.fn().mockReturnValue({
      ilike: jest.fn().mockReturnValue({
        data: [mockCourse],
        error: null,
      }),
    });

    const mockEnrollmentCheck = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          data: [],
          error: null,
        }),
      }),
    });

    const mockEnrollmentInsert = jest.fn().mockReturnValue({
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "courses") {
        return { select: mockCourseSelect };
      }
      if (table === "enrollments") {
        return {
          select: mockEnrollmentCheck,
          insert: mockEnrollmentInsert,
        };
      }
      return { select: mockSelect };
    });

    render(<StudentDashboard />);

    const courseCodeInput = screen.getByPlaceholderText(/enter course code/i);
    const joinButton = screen.getByRole("button", { name: /join course/i });

    fireEvent.change(courseCodeInput, { target: { value: "TEST123" } });
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(courseCodeInput).toHaveValue("");
    });
  });
});


