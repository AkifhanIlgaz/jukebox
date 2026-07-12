"use client";

import {
  Button,
  Description,
  FieldError,
  InputGroup,
  Label,
  TextField,
} from "@heroui/react";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface PasswordFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  description?: string;
  isRequired?: boolean;
  minLength?: number;
  validate?: (value: string) => string | null;
  onChange?: (value: string) => void;
}

export function PasswordField({
  name,
  label,
  placeholder = "••••••••",
  description,
  isRequired,
  minLength,
  validate,
  onChange,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <TextField
      isRequired={isRequired}
      minLength={minLength}
      name={name}
      validate={validate}
    >
      <Label>{label}</Label>
      <InputGroup fullWidth>
        <InputGroup.Input
          placeholder={placeholder}
          type={isVisible ? "text" : "password"}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        />
        <InputGroup.Suffix className="pr-0">
          <Button
            isIconOnly
            aria-label={isVisible ? "Şifreyi gizle" : "Şifreyi göster"}
            size="sm"
            variant="ghost"
            onPress={() => setIsVisible(!isVisible)}
          >
            {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
          </Button>
        </InputGroup.Suffix>
      </InputGroup>
      {description ? <Description>{description}</Description> : null}
      <FieldError />
    </TextField>
  );
}
