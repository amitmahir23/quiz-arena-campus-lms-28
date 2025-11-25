import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CreateCourseForm } from "../CreateCourseForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Mock dependencies
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

describe("CreateCourseForm", () => {
  const mockUserId = "instructor-123";
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  let mockInsert: jest.Mock;
  let mockFrom: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockInsert = jest.fn().mockReturnValue({
      error: null,
    });

    mockFrom = jest.fn().mockReturnValue({
      insert: mockInsert,
    });

    (supabase.from as jest.Mock) = mockFrom;
  });

  it("renders the form with all input fields", () => {
    render(
      <CreateCourseForm
        userId={mockUserId}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/course title/i)).toBeInTheDocument();
    expect(screen.getByText(/^description$/i)).toBeInTheDocument();
    expect(
      screen.getByText(/preview description.*marketplace/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/price.*usd/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create course/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("allows user to input course details", () => {
    render(
      <CreateCourseForm
        userId={mockUserId}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    const inputs = screen.getAllByRole("textbox");
    const numberInput = screen.getByRole("spinbutton");
    const titleInput = inputs[0];
    const descriptionInput = inputs[1];
    const previewInput = inputs[2];
    const priceInput = numberInput;

    fireEvent.change(titleInput, { target: { value: "Test Course" } });
    fireEvent.change(descriptionInput, {
      target: { value: "Test Description" },
    });
    fireEvent.change(previewInput, {
      target: { value: "Preview Description" },
    });
    fireEvent.change(priceInput, { target: { value: "99.99" } });

    expect(titleInput).toHaveValue("Test Course");
    expect(descriptionInput).toHaveValue("Test Description");
    expect(previewInput).toHaveValue("Preview Description");
    expect(priceInput).toHaveValue(99.99);
  });

  it("creates a course successfully when form is submitted", async () => {
    render(
      <CreateCourseForm
        userId={mockUserId}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    // Fill in the form
    const inputs = screen.getAllByRole("textbox");
    const numberInput = screen.getByRole("spinbutton");

    fireEvent.change(inputs[0], {
      target: { value: "Test Course" },
    });
    fireEvent.change(inputs[1], {
      target: { value: "Test Description" },
    });
    fireEvent.change(inputs[2], {
      target: { value: "Preview Description" },
    });
    fireEvent.change(numberInput, {
      target: { value: "99.99" },
    });

    // Submit the form
    const submitButton = screen.getByRole("button", { name: /create course/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith("courses");
      expect(mockInsert).toHaveBeenCalledWith({
        instructor_id: mockUserId,
        title: "Test Course",
        description: "Test Description",
        preview_description: "Preview Description",
        price: 99.99,
        is_published: false,
        code: null,
      });
      expect(toast.success).toHaveBeenCalledWith("Course created successfully");
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it("handles course creation with zero price", async () => {
    render(
      <CreateCourseForm
        userId={mockUserId}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    const inputs = screen.getAllByRole("textbox");
    const numberInput = screen.getByRole("spinbutton");

    fireEvent.change(inputs[0], {
      target: { value: "Free Course" },
    });
    fireEvent.change(inputs[1], {
      target: { value: "Free Description" },
    });
    fireEvent.change(inputs[2], {
      target: { value: "Free Preview" },
    });
    fireEvent.change(numberInput, {
      target: { value: "0" },
    });

    const submitButton = screen.getByRole("button", { name: /create course/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          price: 0,
        })
      );
    });
  });

  it("handles course creation error", async () => {
    const mockError = { message: "Database error" };
    mockInsert.mockReturnValue({
      error: mockError,
    });

    render(
      <CreateCourseForm
        userId={mockUserId}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    const inputs = screen.getAllByRole("textbox");
    const numberInput = screen.getByRole("spinbutton");

    fireEvent.change(inputs[0], {
      target: { value: "Test Course" },
    });
    fireEvent.change(inputs[1], {
      target: { value: "Test Description" },
    });
    fireEvent.change(inputs[2], {
      target: { value: "Preview Description" },
    });
    fireEvent.change(numberInput, {
      target: { value: "99.99" },
    });

    const submitButton = screen.getByRole("button", { name: /create course/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Database error");
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  it("resets form after successful course creation", async () => {
    render(
      <CreateCourseForm
        userId={mockUserId}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    const inputs = screen.getAllByRole("textbox");
    const numberInput = screen.getByRole("spinbutton");

    fireEvent.change(inputs[0], { target: { value: "Test Course" } });
    fireEvent.change(inputs[1], { target: { value: "Test Description" } });
    fireEvent.change(inputs[2], { target: { value: "Preview Description" } });
    fireEvent.change(numberInput, { target: { value: "99.99" } });

    const submitButton = screen.getByRole("button", { name: /create course/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(inputs[0]).toHaveValue("");
      expect(inputs[1]).toHaveValue("");
      expect(inputs[2]).toHaveValue("");
      expect(numberInput).toHaveValue(null);
    });
  });

  it("calls onCancel when cancel button is clicked", () => {
    render(
      <CreateCourseForm
        userId={mockUserId}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("validates required fields", async () => {
    render(
      <CreateCourseForm
        userId={mockUserId}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByRole("button", { name: /create course/i });
    fireEvent.click(submitButton);

    // HTML5 validation should prevent submission
    // The form should not submit if required fields are empty
    await waitFor(() => {
      expect(mockInsert).not.toHaveBeenCalled();
    });
  });
});
