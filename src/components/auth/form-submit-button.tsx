"use client";
import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "~/components/ui/button";
export function FormSubmitButton(props: ButtonProps) { const { pending } = useFormStatus(); return <Button {...props} type="submit" loading={pending} />; }
