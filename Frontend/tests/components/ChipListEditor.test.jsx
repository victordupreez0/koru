import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import ChipListEditor from '../../src/components/ChipListEditor.jsx';

describe('ChipListEditor', () => {
  it('renders all items as inputs', () => {
    render(<ChipListEditor title="Skills" items={['Go', 'Rust']} onChange={() => {}} placeholder="Pick some" />);
    expect(screen.getByDisplayValue('Go')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Rust')).toBeInTheDocument();
    expect(screen.getByText('Pick some')).toBeInTheDocument();
  });

  it('adds a blank item when "Add item" is clicked', () => {
    const onChange = jest.fn();
    render(<ChipListEditor title="Skills" items={['Go']} onChange={onChange} placeholder="" />);
    fireEvent.click(screen.getByText(/Add item/));
    expect(onChange).toHaveBeenCalledWith(['Go', '']);
  });

  it('removes an item when its trash button is clicked', () => {
    const onChange = jest.fn();
    render(<ChipListEditor title="Skills" items={['Go', 'Rust']} onChange={onChange} placeholder="" />);
    const removeButtons = screen.getAllByLabelText(/Remove Skills item/);
    fireEvent.click(removeButtons[0]);
    expect(onChange).toHaveBeenCalledWith(['Rust']);
  });

  it('emits updated list when typing', () => {
    const onChange = jest.fn();
    render(<ChipListEditor title="Skills" items={['Go']} onChange={onChange} placeholder="" />);
    fireEvent.change(screen.getByDisplayValue('Go'), { target: { value: 'Golang' } });
    expect(onChange).toHaveBeenCalledWith(['Golang']);
  });
});
