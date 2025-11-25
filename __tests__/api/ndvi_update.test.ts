/**
 * @jest-environment node
 */
import { describe, expect, it, jest } from "@jest/globals"
import { processFieldsNdvi, NdviField } from "@/lib/ndvi/pipeline"

const createSupabaseMock = () => {
  const satelliteImages: any[] = []
  const ndviIndices: any[] = []
  const fieldUpdates: any[] = []

  const makeInsert = (collection: any[], returnsId = false) => ({
    insert(payload: any) {
      collection.push(payload)
      return {
        select: () => ({
          single: async () => ({
            data: returnsId ? { id: `img-${collection.length}` } : payload,
            error: null,
          }),
        }),
      }
    },
  })

  const mock = {
    collections: { satelliteImages, ndviIndices, fieldUpdates },
    from(table: string) {
      if (table === "satellite_images") {
        return makeInsert(satelliteImages, true)
      }
      if (table === "ndvi_indices") {
        return {
          insert(payload: any) {
            ndviIndices.push(payload)
            return { error: null }
          },
        }
      }
      if (table === "fields") {
        return {
          update(payload: any) {
            fieldUpdates.push(payload)
            return { eq: () => ({}) }
          },
        }
      }
      throw new Error(`Unknown table ${table}`)
    },
  }

  return mock
}

describe("NDVI ingestion pipeline", () => {
  it("creates satellite image and NDVI index records", async () => {
    const supabase = createSupabaseMock()
    const fields: NdviField[] = [
      { id: "field-1", owner_id: "user-1", latitude: 30.1, longitude: 31.2 },
    ]

    const sceneFetcher = jest.fn<any>().mockResolvedValue({
      provider: "Sentinel",
      capturedAt: new Date().toISOString(),
      ndviValue: 0.45,
      eviValue: 0.5,
      ndwiValue: 0.2,
      metadata: { mock: true },
      buffer: Buffer.from([1, 2, 3]),
    }) as unknown as jest.Mock<any>

    const summary = await processFieldsNdvi({ supabase, fields, sceneFetcher })

    expect(summary.inserted).toBe(1)
    expect(supabase.collections.satelliteImages).toHaveLength(1)
    expect(supabase.collections.ndviIndices).toHaveLength(1)
    expect(sceneFetcher).toHaveBeenCalled()
  })

  it("skips fields without coordinates", async () => {
    const supabase = createSupabaseMock()
    const fields: NdviField[] = [
      { id: "field-1", owner_id: "user-1", latitude: null, longitude: null },
    ]

    const summary = await processFieldsNdvi({
      supabase,
      fields,
      sceneFetcher: async () => null,
    })

    expect(summary.skipped).toBe(1)
    expect(supabase.collections.satelliteImages).toHaveLength(0)
  })

  it("handles persistence errors gracefully", async () => {
    const failingSupabase = {
      from(table: string) {
        if (table === "satellite_images") {
          return {
            insert() {
              return {
                select: () => ({
                  single: async () => ({ data: null, error: new Error("insert failed") }),
                }),
              }
            },
          }
        }
        if (table === "ndvi_indices" || table === "fields") {
          return {
            insert: () => ({ error: null }),
            update: () => ({ eq: () => ({}) }),
          }
        }
        throw new Error(`Unknown table ${table}`)
      },
    }

    const fields: NdviField[] = [{ id: "field-1", owner_id: "user-1", latitude: 30, longitude: 31 }]
    const sceneFetcher = jest.fn<any>().mockResolvedValue({
      provider: "Sentinel",
      capturedAt: new Date().toISOString(),
      ndviValue: 0.2,
      eviValue: 0.1,
      ndwiValue: -0.1,
      metadata: {},
      buffer: null,
    }) as unknown as jest.Mock<any>

    const summary = await processFieldsNdvi({ supabase: failingSupabase as any, fields, sceneFetcher })

    expect(summary.failed).toBe(1)
  })

  it("falls back to stub when scene fetcher returns null", async () => {
    const supabase = createSupabaseMock()
    const fields: NdviField[] = [{ id: "field-1", owner_id: "user-1", latitude: 30, longitude: 31 }]
    const summary = await processFieldsNdvi({
      supabase,
      fields,
      sceneFetcher: async () => null,
    })
    expect(summary.skipped).toBe(1)
  })
})
