// src/app/(protected)/tariffs/page.tsx
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Plus,
    Calculator,
    Search,
    Edit,
    Trash2,
    DollarSign,
    Droplet,
    Building2,
    Home,
    Loader2
} from "lucide-react"
import { CreateTariffDialog } from "@/components/tariffs/create-tariff-dialog"
import { CreateCategoryDialog } from "@/components/tariffs/create-category-dialog"
import { EditTariffDialog } from "@/components/tariffs/edit-tariff-dialog"
import { toast } from "sonner"

interface TariffCategory {
    id: number
    name: string
    displayName: string
    description: string | null
    isActive: boolean
    _count: {
        tariffs: number
        Sensor: number
    }
}

interface Tariff {
    id: number
    name: string
    description: string | null
    minConsumption: number
    maxConsumption: number | null
    waterCharge: number
    sewerageCharge: number
    fixedCharge: number
    assignedVolume: number
    isActive: boolean
    validFrom: string
    validUntil: string | null
    tariffCategory: {
        id: number
        name: string
        displayName: string
    }
    _count: {
        waterConsumptions: number
        invoices: number
    }
}

export default function TariffsPage() {
    const [categories, setCategories] = useState<TariffCategory[]>([])
    const [tariffs, setTariffs] = useState<Tariff[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState<string>("all")
    const [searchTerm, setSearchTerm] = useState("")
    const [viewMode, setViewMode] = useState<"categories" | "tariffs">("categories")
    const [createTariffOpen, setCreateTariffOpen] = useState(false)
    const [createCategoryOpen, setCreateCategoryOpen] = useState(false)
    const [editTariff, setEditTariff] = useState<Tariff | null>(null)

    // Estados para los AlertDialog
    const [deleteTariffId, setDeleteTariffId] = useState<number | null>(null)
    const [deleteCategoryId, setDeleteCategoryId] = useState<number | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [categoriesRes, tariffsRes] = await Promise.all([
                fetch("/api/tariff-categories"),
                fetch("/api/tariffs")
            ])

            if (categoriesRes.ok && tariffsRes.ok) {
                const [categoriesData, tariffsData] = await Promise.all([
                    categoriesRes.json(),
                    tariffsRes.json()
                ])
                setCategories(categoriesData)
                setTariffs(tariffsData)
            }
        } catch (error) {
            console.error("Error fetching data:", error)
            toast.error("Error al cargar datos")
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteTariff = async () => {
        if (!deleteTariffId) return

        try {
            const response = await fetch(`/api/tariffs/${deleteTariffId}`, {
                method: "DELETE"
            })

            if (response.ok) {
                toast.success("Tarifa eliminada correctamente")
                fetchData()
            } else {
                const error = await response.json()
                toast.error(error.error || "Error al eliminar tarifa")
            }
        } catch (error) {
            console.error("Error deleting tariff:", error)
            toast.error("Error al eliminar tarifa")
        } finally {
            setDeleteTariffId(null)
        }
    }

    const handleDeleteCategory = async () => {
        if (!deleteCategoryId) return

        try {
            const response = await fetch(`/api/tariff-categories/${deleteCategoryId}`, {
                method: "DELETE"
            })

            if (response.ok) {
                toast.success("Categoría eliminada correctamente")
                fetchData()
            } else {
                const error = await response.json()
                toast.error(error.error || "Error al eliminar categoría")
            }
        } catch (error) {
            console.error("Error deleting category:", error)
            toast.error("Error al eliminar categoría")
        } finally {
            setDeleteCategoryId(null)
        }
    }

    const getCategoryIcon = (categoryName: string) => {
        const icons = {
            RESIDENCIAL: Home,           // Para uso doméstico y social
            NO_RESIDENCIAL: Building2    // Para comercial, industrial y estatal
        }
        const IconComponent = icons[categoryName as keyof typeof icons] || Calculator
        return <IconComponent className="h-5 w-5" />
    }

    const getCategoryColor = (categoryName: string) => {
        const colors = {
            RESIDENCIAL: "bg-blue-100 text-blue-800 border-blue-200",
            NO_RESIDENCIAL: "bg-green-100 text-green-800 border-green-200"
        }
        return colors[categoryName as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200"
    }

    const filteredTariffs = tariffs.filter(tariff => {
        const matchesCategory = selectedCategory === "all" || tariff.tariffCategory.name === selectedCategory
        const matchesSearch = searchTerm === "" ||
            tariff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tariff.description?.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesCategory && matchesSearch
    })

    const filteredCategories = categories.filter(category =>
        searchTerm === "" ||
        category.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const totalTariffs = tariffs.length
    const activeTariffs = tariffs.filter(t => t.isActive).length
    const totalCategories = categories.length
    const activeCategories = categories.filter(c => c.isActive).length

    if (loading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                        <p className="text-sm text-gray-500">Cargando tarifas...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-full">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Tarifas</h1>
                        <p className="text-sm sm:text-base text-gray-600 mt-1">
                            Administra categorías y tarifas del sistema
                        </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            onClick={() => setViewMode(viewMode === "categories" ? "tariffs" : "categories")}
                            className="flex-1 sm:flex-none text-sm"
                        >
                            {viewMode === "categories" ? "Ver Tarifas" : "Ver Categorías"}
                        </Button>
                        <Button
                            className="flex-1 sm:flex-none text-sm"
                            onClick={() => viewMode === "categories" ? setCreateCategoryOpen(true) : setCreateTariffOpen(true)}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">
                                {viewMode === "categories" ? "Nueva Categoría" : "Nueva Tarifa"}
                            </span>
                            <span className="sm:hidden">Nuevo</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <Card className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Calculator className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                        <div>
                            <div className="text-xs sm:text-sm text-gray-500">Categorías</div>
                            <div className="text-lg sm:text-2xl font-bold">{totalCategories}</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                        <div>
                            <div className="text-xs sm:text-sm text-gray-500">Tarifas</div>
                            <div className="text-lg sm:text-2xl font-bold">{totalTariffs}</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-3 sm:p-4 bg-green-50 border-green-200">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Calculator className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                        <div>
                            <div className="text-xs sm:text-sm text-green-700">Cat. Activas</div>
                            <div className="text-lg sm:text-2xl font-bold text-green-800">{activeCategories}</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-3 sm:p-4 bg-blue-50 border-blue-200">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                        <div>
                            <div className="text-xs sm:text-sm text-blue-700">Tar. Activas</div>
                            <div className="text-lg sm:text-2xl font-bold text-blue-800">{activeTariffs}</div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filtros */}
            <div className="space-y-4 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder={`Buscar ${viewMode === "categories" ? "categorías" : "tarifas"}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {viewMode === "tariffs" && (
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-full sm:w-[250px]">
                            <SelectValue placeholder="Filtrar por categoría" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las categorías</SelectItem>
                            {categories.map((category) => (
                                <SelectItem key={category.id} value={category.name}>
                                    {category.displayName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            {/* Contenido */}
            {viewMode === "categories" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCategories.map((category) => (
                        <Card key={category.id} className={`relative ${!category.isActive ? 'opacity-60' : ''}`}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className={`p-2 rounded-lg ${getCategoryColor(category.name)}`}>
                                            {getCategoryIcon(category.name)}
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="text-lg">{category.displayName}</CardTitle>
                                            <p className="text-sm text-gray-500">{category.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={category.isActive ? "default" : "secondary"}>
                                            {category.isActive ? "Activa" : "Inactiva"}
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-600 hover:text-red-700"
                                            onClick={() => setDeleteCategoryId(category.id)}
                                            disabled={category._count.tariffs > 0 || category._count.Sensor > 0}
                                            title={category._count.tariffs > 0 || category._count.Sensor > 0 ?
                                                "No se puede eliminar: tiene tarifas o sensores asociados" :
                                                "Eliminar categoría"}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">Tarifas:</span>
                                        <div className="font-medium">{category._count.tariffs}</div>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Sensores:</span>
                                        <div className="font-medium">{category._count.Sensor}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <>
                    {/* Vista de tabla para desktop */}
                    <div className="hidden md:block bg-white rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tarifa</TableHead>
                                    <TableHead>Categoría</TableHead>
                                    <TableHead>Rango (m³)</TableHead>
                                    <TableHead className="text-right">Agua (S/)</TableHead>
                                    <TableHead className="text-right">Alcantarillado (S/)</TableHead>
                                    <TableHead className="text-right">Cargo Fijo (S/)</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTariffs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                            No se encontraron tarifas
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredTariffs.map((tariff) => (
                                        <TableRow key={tariff.id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{tariff.name}</div>
                                                    <div className="text-sm text-gray-500">{tariff.description}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getCategoryColor(tariff.tariffCategory.name)}>
                                                    {tariff.tariffCategory.displayName}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {tariff.minConsumption} - {tariff.maxConsumption || "∞"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {tariff.waterCharge.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {tariff.sewerageCharge.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {tariff.fixedCharge.toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={tariff.isActive ? "default" : "secondary"}>
                                                    {tariff.isActive ? "Activa" : "Inactiva"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setEditTariff(tariff)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-600 hover:text-red-700"
                                                        onClick={() => setDeleteTariffId(tariff.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Vista de tarjetas para móviles */}
                    <div className="md:hidden space-y-4">
                        {filteredTariffs.length === 0 ? (
                            <div className="text-center py-12">
                                <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-gray-500">No se encontraron tarifas</p>
                            </div>
                        ) : (
                            filteredTariffs.map((tariff) => (
                                <Card key={tariff.id} className="p-4">
                                    <div className="space-y-3">
                                        {/* Header */}
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-medium text-base">{tariff.name}</h3>
                                                {tariff.description && (
                                                    <p className="text-sm text-gray-500 mt-1">{tariff.description}</p>
                                                )}
                                            </div>
                                            <Badge variant={tariff.isActive ? "default" : "secondary"} className="ml-2">
                                                {tariff.isActive ? "Activa" : "Inactiva"}
                                            </Badge>
                                        </div>

                                        {/* Categoría */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-500">Categoría:</span>
                                            <Badge className={getCategoryColor(tariff.tariffCategory.name)}>
                                                {tariff.tariffCategory.displayName}
                                            </Badge>
                                        </div>

                                        {/* Rango de consumo */}
                                        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                                            <div className="text-sm font-medium text-gray-700">Rango de consumo</div>
                                            <div className="text-lg font-semibold">
                                                {tariff.minConsumption} - {tariff.maxConsumption || "∞"} m³
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Volumen asignado: {tariff.assignedVolume} m³
                                            </div>
                                        </div>

                                        {/* Tarifas */}
                                        <div className="grid grid-cols-3 gap-3 text-center">
                                            <div className="bg-blue-50 rounded-lg p-2">
                                                <div className="text-xs text-blue-600 font-medium">Agua</div>
                                                <div className="text-sm font-semibold">S/ {tariff.waterCharge.toFixed(2)}</div>
                                            </div>
                                            <div className="bg-green-50 rounded-lg p-2">
                                                <div className="text-xs text-green-600 font-medium">Alcantarillado</div>
                                                <div className="text-sm font-semibold">S/ {tariff.sewerageCharge.toFixed(2)}</div>
                                            </div>
                                            <div className="bg-orange-50 rounded-lg p-2">
                                                <div className="text-xs text-orange-600 font-medium">Cargo Fijo</div>
                                                <div className="text-sm font-semibold">S/ {tariff.fixedCharge.toFixed(2)}</div>
                                            </div>
                                        </div>

                                        {/* Acciones */}
                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => setEditTariff(tariff)}
                                            >
                                                <Edit className="h-4 w-4 mr-2" />
                                                Editar
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700"
                                                onClick={() => setDeleteTariffId(tariff.id)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Eliminar
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </>
            )}

            {/* Dialogs */}
            <CreateCategoryDialog
                open={createCategoryOpen}
                onOpenChange={setCreateCategoryOpen}
                onCategoryCreated={fetchData}
            />

            <CreateTariffDialog
                open={createTariffOpen}
                onOpenChange={setCreateTariffOpen}
                onTariffCreated={fetchData}
                categories={categories}
            />

            {editTariff && (
                <EditTariffDialog
                    open={!!editTariff}
                    onOpenChange={(open) => !open && setEditTariff(null)}
                    onTariffUpdated={fetchData}
                    tariff={editTariff}
                    categories={categories}
                />
            )}

            {/* AlertDialog para eliminar tarifa */}
            <AlertDialog open={!!deleteTariffId} onOpenChange={(open) => !open && setDeleteTariffId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente la tarifa seleccionada.
                            {deleteTariffId && tariffs.find(t => t.id === deleteTariffId)?._count.invoices ? (
                                <span className="block mt-2 text-yellow-600">
                                    <strong>Advertencia:</strong> Esta tarifa tiene facturas asociadas.
                                </span>
                            ) : null}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteTariff} className="bg-red-600 hover:bg-red-700">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* AlertDialog para eliminar categoría */}
            <AlertDialog open={!!deleteCategoryId} onOpenChange={(open) => !open && setDeleteCategoryId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente la categoría seleccionada.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteCategory} className="bg-red-600 hover:bg-red-700">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}