// src/app/(protected)/roles/page.tsx
"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RolesTab } from "@/components/roles/roles-tab"
import { ModulesTab } from "@/components/roles/modules-tab"
import { PermissionsTab } from "@/components/roles/permissions-tab"

export default function RolesPage() {
    const [activeTab, setActiveTab] = useState("roles")

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Roles y Permisos</h1>
                <p className="text-gray-600">Gestiona los roles y permisos del sistema</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full max-w-lg grid-cols-3">
                    <TabsTrigger value="roles">Roles</TabsTrigger>
                    <TabsTrigger value="modules">Módulos</TabsTrigger>
                    <TabsTrigger value="permissions">Permisos</TabsTrigger>
                </TabsList>

                <TabsContent value="roles" className="mt-6">
                    <RolesTab />
                </TabsContent>

                <TabsContent value="modules" className="mt-6">
                    <ModulesTab />
                </TabsContent>

                <TabsContent value="permissions" className="mt-6">
                    <PermissionsTab />
                </TabsContent>
            </Tabs>
        </div>
    )
}