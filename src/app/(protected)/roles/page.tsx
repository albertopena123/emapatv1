// src/app/(protected)/roles/page.tsx
"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RolesTab } from "@/components/roles/roles-tab"
import { ModulesTab } from "@/components/roles/modules-tab"
import { PermissionsTab } from "@/components/roles/permissions-tab"
import { Shield, Settings, Key } from "lucide-react"

export default function RolesPage() {
    const [activeTab, setActiveTab] = useState("roles")

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-full">
            {/* Header responsivo */}
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold">Roles y Permisos</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
                    Gestiona los roles y permisos del sistema
                </p>
            </div>

            {/* Tabs responsivos */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-flex sm:max-w-lg">
                    <TabsTrigger value="roles" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                        <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden xs:inline">Roles</span>
                        <span className="xs:hidden">R</span>
                    </TabsTrigger>
                    <TabsTrigger value="modules" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                        <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden xs:inline">Módulos</span>
                        <span className="xs:hidden">M</span>
                    </TabsTrigger>
                    <TabsTrigger value="permissions" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                        <Key className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden xs:inline">Permisos</span>
                        <span className="xs:hidden">P</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="roles" className="mt-4 sm:mt-6">
                    <RolesTab />
                </TabsContent>

                <TabsContent value="modules" className="mt-4 sm:mt-6">
                    <ModulesTab />
                </TabsContent>

                <TabsContent value="permissions" className="mt-4 sm:mt-6">
                    <PermissionsTab />
                </TabsContent>
            </Tabs>
        </div>
    )
}