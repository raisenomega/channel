import { useState } from "react";

export function useCreateFormState() {
  const [showCreate, setShowCreate] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formSegment, setFormSegment] = useState("regular");

  function reset() {
    setFormName("");
    setFormPhone("");
    setFormEmail("");
    setFormSegment("regular");
  }

  return {
    showCreate, setShowCreate,
    formName, setFormName,
    formPhone, setFormPhone,
    formEmail, setFormEmail,
    formSegment, setFormSegment,
    reset,
  };
}