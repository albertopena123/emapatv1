// src/types/locations.ts
import { Location, Map, Sensor } from '@prisma/client'

export type LocationWithRelations = Location & {
  map: Map
  sensors?: Sensor[]
  _count?: {
    sensors: number
  }
}

export type CreateLocationInput = {
  latitude: number
  longitude: number
  altitude?: number
  address?: string
  description?: string
  mapId: number
}

export type UpdateLocationInput = Partial<CreateLocationInput>

export type LocationFilters = {
  search?: string
  mapId?: number
}