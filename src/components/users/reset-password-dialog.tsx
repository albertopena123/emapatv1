// src/components/users/reset-password-dialog.tsx
"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Eye, EyeOff, Key } from "lucide-react"

interface User {
    id: string
    name: string | null
    dni: string
}

interface ResetPasswordDialogProps {
    user: User
    open: boolean
    onOpenChange: (open: boolean) => void
    onPasswordReset: () => void
}

export function ResetPasswordDialog({
    user,
    open,
    onOpenChange,
    onPasswordReset
}: ResetPasswordDialogProps) {
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [errors, setErrors] = useState<{
        newPassword?: string
        confirmPassword?: string
    }>({})

    const validateForm = () => {
        const newErrors: typeof errors = {}

        if (!newPassword) {
            newErrors.newPassword = "La contraseña es requerida"
        } else if (newPassword.length < 6) {
            newErrors.newPassword = "La contraseña debe tener al menos 6 caracteres"
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = "Confirma la contraseña"
        } else if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = "Las contraseñas no coinciden"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) return

        setLoading(true)
        try {
            const response = await fetch(`/api/users/${user.id}/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ newPassword }),
            })

            if (response.ok) {
                toast.success('Contraseña restablecida exitosamente')
                onPasswordReset()
                onOpenChange(false)
            } else {
                const error = await response.json()
                toast.error(error.error || 'Error al restablecer la contraseña')
            }
        } catch (error) {
            toast.error('Error al restablecer la contraseña')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setNewPassword("")
        setConfirmPassword("")
        setErrors({})
        setShowPassword(false)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Restablecer Contraseña
                    </DialogTitle>
                    <DialogDescription>
                        Establecer una nueva contraseña para el usuario{" "}
                        <span className="font-semibold">{user.name || user.dni}</span>
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">Nueva contraseña</Label>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => {
                                        setNewPassword(e.target.value)
                                        if (errors.newPassword) {
                                            setErrors({ ...errors, newPassword: undefined })
                                        }
                                    }}
                                    placeholder="Mínimo 6 caracteres"
                                    className={errors.newPassword ? "border-red-500" : ""}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            {errors.newPassword && (
                                <p className="text-sm text-red-500">{errors.newPassword}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value)
                                    if (errors.confirmPassword) {
                                        setErrors({ ...errors, confirmPassword: undefined })
                                    }
                                }}
                                placeholder="Repite la contraseña"
                                className={errors.confirmPassword ? "border-red-500" : ""}
                            />
                            {errors.confirmPassword && (
                                <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Restableciendo..." : "Restablecer contraseña"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}