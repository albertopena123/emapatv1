// src/app/(auth)/forgot-password/page.tsx
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, Mail, CheckCircle } from "lucide-react"

const forgotPasswordSchema = z.object({
    email: z.string().email("Email inválido"),
})

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordData>({
        resolver: zodResolver(forgotPasswordSchema),
    })

    const onSubmit = async (data: ForgotPasswordData) => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || "Error al procesar la solicitud")
            }

            setIsSuccess(true)
        } catch (error) {
            setError(error instanceof Error ? error.message : "Error al enviar el email")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-md shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
                <CardHeader className="space-y-1 text-center pb-8">
                    <div className="mx-auto bg-gradient-to-br from-blue-500 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg">
                        <Mail className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight">
                        {isSuccess ? "Email Enviado" : "Recuperar Contraseña"}
                    </CardTitle>
                    <CardDescription className="text-base">
                        {isSuccess
                            ? "Revisa tu bandeja de entrada"
                            : "Ingresa tu email para recibir instrucciones"}
                    </CardDescription>
                </CardHeader>

                {isSuccess ? (
                    <CardContent className="space-y-4">
                        <Alert className="border-green-200 bg-green-50">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                Te hemos enviado un enlace para restablecer tu contraseña.
                                Por favor, revisa tu email y sigue las instrucciones.
                            </AlertDescription>
                        </Alert>
                        <p className="text-sm text-gray-600 text-center">
                            Si no recibes el email en unos minutos, revisa tu carpeta de spam.
                        </p>
                    </CardContent>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <CardContent className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="usuario@ejemplo.com"
                                        className="pl-10 h-11"
                                        {...register("email")}
                                        disabled={isLoading}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-sm text-red-500">{errors.email.message}</p>
                                )}
                            </div>

                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                        </CardContent>

                        <CardFooter className="flex flex-col space-y-4">
                            <Button
                                type="submit"
                                className="w-full h-11 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    "Enviar Instrucciones"
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                )}

                <CardFooter className="pt-0">
                    <Link
                        href="/login"
                        className="w-full text-center text-sm text-gray-600 hover:text-gray-800 flex items-center justify-center gap-1"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver al inicio de sesión
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}