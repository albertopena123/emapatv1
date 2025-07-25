// src/components/auth/login-form.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, User, Lock, LogIn, AlertCircle, Eye, EyeOff } from "lucide-react"

const loginSchema = z.object({
    identifier: z.string().min(1, "DNI o email requerido"),
    password: z.string().min(1, "Contraseña requerida"),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    })

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || "Error al iniciar sesión")
            }


            router.push("/dashboard")

        } catch (error) {
            setError(error instanceof Error ? error.message : "Error al iniciar sesión")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-md shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="space-y-1 text-center pb-8">
                <div className="mx-auto bg-gradient-to-br from-blue-500 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg">
                    <LogIn className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold tracking-tight">Bienvenido</CardTitle>
                <CardDescription className="text-base">
                    Ingresa tus credenciales para continuar
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="identifier" className="text-sm font-medium">
                            DNI o Email
                        </Label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <Input
                                id="identifier"
                                placeholder="12345678 o usuario@ejemplo.com"
                                className="pl-10 h-11 transition-all focus:ring-2 focus:ring-blue-500"
                                {...register("identifier")}
                                disabled={isLoading}
                            />
                        </div>
                        {errors.identifier && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {errors.identifier.message}
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-sm font-medium">
                                Contraseña
                            </Label>
                            <a href="#" className="text-xs text-blue-600 hover:text-blue-700 hover:underline">
                                ¿Olvidaste tu contraseña?
                            </a>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                className="pl-10 pr-10 h-11 transition-all focus:ring-2 focus:ring-blue-500"
                                {...register("password")}
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {errors.password.message}
                            </p>
                        )}
                    </div>
                    {error && (
                        <Alert variant="destructive" className="animate-in fade-in-50 slide-in-from-top-1">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 pt-2">
                    <Button
                        type="submit"
                        className="w-full h-11 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Iniciando sesión...
                            </>
                        ) : (
                            <>
                                <LogIn className="mr-2 h-5 w-5" />
                                Iniciar Sesión
                            </>
                        )}
                    </Button>
                    <p className="text-sm text-center text-gray-600">
                        ¿No tienes una cuenta?{" "}
                        <a href="#" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                            Regístrate
                        </a>
                    </p>
                </CardFooter>
            </form>
        </Card>
    )
}