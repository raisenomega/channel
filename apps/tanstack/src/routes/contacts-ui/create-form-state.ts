import { useState } from "react";

export function useCreateFormState() {
  const [showCreate, setShowCreate] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formSegment, setFormSegment] = useState("regular");
  const [formType, setFormType] = useState("persona");

  function reset() {
    setFormName("");
    setFormPhone("");
    setFormEmail("");
    setFormAddress("");
    setFormSegment("regular");
    setFormType("persona");
  }

  return {
    showCreate, setShowCreate,
    formName, setFormName,
    formPhone, setFormPhone,
    formEmail, setFormEmail,
    formAddress, setFormAddress,
    formSegment, setFormSegment,
    formType, setFormType,
    reset,
  };
}