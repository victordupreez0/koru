/* global describe, it, expect, jest */
import '@testing-library/jest-dom';
import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Select,
  Skeleton,
  SkeletonText,
} from '../../src/components/UI';

describe('design system primitives', () => {
  it('Button fires clicks, respects disabled, and exposes loading state', () => {
    const onClick = jest.fn();
    const { rerender } = render(<Button onClick={onClick}>Save</Button>);

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(<Button disabled>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

    rerender(<Button loading>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });

  it('Input associates its label, hint and error text', () => {
    const { rerender } = render(
      <Input label="Email" hint="Use your campus address." />,
    );

    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription(
      'Use your campus address.',
    );
    expect(
      screen.getByText('Use your campus address.').closest('p').querySelector('svg'),
    ).toBeInTheDocument();

    rerender(<Input label="Email" error="Email is required." />);

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Email is required.');
    expect(input).toHaveClass('bg-koru-error-container');
    expect(input.className).not.toContain('border');
    expect(screen.getByRole('alert')).toHaveTextContent('Email is required.');
    expect(screen.getByRole('alert').querySelector('svg')).toBeInTheDocument();
  });

  it('Alert announces error feedback', () => {
    render(<Alert variant="error">Something went wrong.</Alert>);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Something went wrong.',
    );
  });

  it('Select associates its label and error text', () => {
    render(
      <Select label="Institution" error="Choose an institution.">
        <option value="">Select</option>
      </Select>,
    );

    const select = screen.getByLabelText('Institution');
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Choose an institution.',
    );
  });

  it('Badge, Card and EmptyState render their content', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Course panel</CardTitle>
          <Badge variant="success">Active</Badge>
        </CardHeader>
        <CardBody>Course details</CardBody>
      </Card>,
    );

    expect(screen.getByText('Course panel')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Course details')).toBeInTheDocument();

    render(
      <EmptyState
        title="No courses"
        description="Create a course to get started."
        action={<Button size="sm">Create</Button>}
      />,
    );

    expect(screen.getByText('No courses')).toBeInTheDocument();
    expect(screen.getByText('Create a course to get started.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('PageHeader renders a heading and breadcrumb links', () => {
    render(
      <MemoryRouter>
        <PageHeader
          eyebrow="Courses"
          title="DV300"
          subtitle="Development"
          breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'DV300' }]}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'DV300' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'href',
      '/',
    );
    expect(screen.getByText('Development')).toBeInTheDocument();
  });

  it('Skeleton is decorative and SkeletonText renders the requested lines', () => {
    const { container } = render(
      <>
        <Skeleton data-testid="skeleton" variant="text" />
        <SkeletonText lines={3} data-testid="skeleton-text" />
      </>,
    );

    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
    expect(skeleton).toHaveClass('koru-skeleton');

    expect(
      screen.getByTestId('skeleton-text').querySelectorAll('.koru-skeleton'),
    ).toHaveLength(3);
    expect(container.querySelectorAll('.koru-skeleton')).toHaveLength(4);
  });

  it('Modal opens, labels the dialog, and closes on Escape', () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open modal</Button>
          <Modal
            open={open}
            onClose={() => setOpen(false)}
            title="Test modal"
            description="Modal description"
          >
            Modal body
          </Modal>
        </>
      );
    }

    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Open modal' }));

    expect(
      screen.getByRole('dialog', { name: 'Test modal' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Modal body')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
