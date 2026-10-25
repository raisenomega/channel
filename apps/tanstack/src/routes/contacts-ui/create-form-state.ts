import { useState } from "react";

export function useCreateFormState() {
  const [showCreate, setShowCreate] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formSegment, setFormSegment] = useState("regular");
  const [formType, setFormType] = useState("persona");
  const [formChannel, setFormChannel] = useState("manual");

  function reset() {
    setFormName("");
    setFormPhone("");
    setFormEmail("");
    setFormAddress("");
    setFormSegment("regular");
    setFormType("persona");
    setFormChannel("manual");
  }

  return {
    showCreate, setShowCreate,
    formName, setFormName,
    formPhone, setFormPhone,
    formEmail, setFormEmail,
    formAddress, setFormAddress,
    formSegment, setFormSegment,
    formType, setFormType,
    formChannel, setFormChannel,
    reset,
  };
}