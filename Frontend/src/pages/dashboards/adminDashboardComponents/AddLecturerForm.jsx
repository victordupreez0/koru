import React, { useState } from "react";
import { Button, Input, Modal } from "../../../components/UI";

export function AddLecturerForm({ onSave, onCancel }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("");

  const canSave = firstName.trim() && lastName.trim() && email.trim() && tempPassword.trim();

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      tempPassword: tempPassword.trim(),
    });
  };

  return (
    <Modal
      open
      onClose={onCancel}
      title="Add Lecturer"
      size="sm"
      footer={
        <>
          <Button variant="tonal" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            Add Lecturer
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First Name"
            type="text"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoFocus
          />
          <Input
            label="Last Name"
            type="text"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        <Input
          label="Email Address"
          type="email"
          placeholder="lecturer@university.ac"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          label="Temporary Password"
          type="text"
          placeholder="Temporary password"
          value={tempPassword}
          onChange={(e) => setTempPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          hint="The lecturer must change this password on first login."
        />
      </div>
    </Modal>
  );
}
