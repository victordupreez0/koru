import React, { useState } from "react";
import { Button, Input, Modal } from "../../../components/UI";

export function EditUserModal({ user, label = "User", onSave, onCancel }) {
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [email, setEmail] = useState(user.email || "");

  const canSave = firstName.trim() && lastName.trim() && email.trim();

  const handleSave = () => {
    if (!canSave) return;
    onSave({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() });
  };

  return (
    <Modal
      open
      onClose={onCancel}
      title={`Edit ${label}`}
      size="sm"
      footer={
        <>
          <Button variant="tonal" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            Save Changes
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
          placeholder="email@university.ac"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
        />
      </div>
    </Modal>
  );
}
