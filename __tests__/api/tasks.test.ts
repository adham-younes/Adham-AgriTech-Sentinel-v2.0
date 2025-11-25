/**
 * @jest-environment node
 */
import { beforeEach, describe, expect, it, jest } from "@jest/globals"
import { GET as listTasks, POST as createTask } from "@/app/api/tasks/route"
import { DELETE as deleteTask, PUT as updateTask } from "@/app/api/tasks/[taskId]/route"
import { getUserSupabase } from "@/app/api/tasks/utils"

jest.mock("@/app/api/tasks/utils", () => {
  const actual = jest.requireActual("@/app/api/tasks/utils")
  return {
    ...(actual as object),
    getUserSupabase: jest.fn<any>(),
  }
})

const mockedGetUserSupabase = getUserSupabase as jest.MockedFunction<typeof getUserSupabase>

const baseUrl = "http://localhost/api/tasks"
const user = { id: "user-123" }

describe("Tasks API routes", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("creates a task with valid data", async () => {
    const createdTask = {
      id: "11111111-2222-3333-4444-555555555555",
      field_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      name: "Irrigation",
      status: "pending",
    }
    let insertedPayload: Record<string, unknown> | null = null

    const selectWrapper = {
      single: jest.fn<any>().mockResolvedValue({ data: createdTask, error: null }),
    }

    const supabase = {
      from: jest.fn<any>().mockReturnValue({
        insert: jest.fn<any>((payload: Record<string, unknown>) => {
          insertedPayload = payload
          return {
            select: jest.fn<any>().mockReturnValue(selectWrapper),
          }
        }),
      }),
    }

    mockedGetUserSupabase.mockResolvedValue({ supabase, user } as any)

    const response = await createTask(
      new Request(baseUrl, {
        method: "POST",
        body: JSON.stringify({ name: "Irrigation", field_id: createdTask.field_id }),
        headers: { "Content-Type": "application/json" },
      }),
    )

    expect(response.status).toBe(201)
    const body = (await response.json()) as Record<string, unknown>
    expect(body.code).toBe("SUCCESS")
    expect(insertedPayload).toMatchObject({
      user_id: user.id,
      field_id: createdTask.field_id,
      name: "Irrigation",
    })
  })

  it("lists tasks and filters by field id", async () => {
    const tasks = [
      { id: "task-1", field_id: "field-1", name: "Fertilize", status: "pending" },
    ]

    const listBuilder: any = {
      select: jest.fn<any>(() => listBuilder),
      order: jest.fn<any>(() => listBuilder),
      eq: jest.fn<any>(() => listBuilder),
      then: (resolve: any) => resolve({ data: tasks, error: null }),
    }

    const supabase = {
      from: jest.fn<any>().mockReturnValue(listBuilder),
    }

    mockedGetUserSupabase.mockResolvedValue({ supabase, user } as any)

    const response = await listTasks(new Request(`${baseUrl}?field_id=field-1`, { method: "GET" }))

    expect(response.status).toBe(200)
    const body = (await response.json()) as any
    expect(body.tasks).toHaveLength(1)
    expect(listBuilder.eq).toHaveBeenCalledWith("field_id", "field-1")
  })

  it("updates a task successfully", async () => {
    const taskId = "11111111-2222-3333-4444-555555555555"
    const buildersQueue: any[] = []

    const lookupBuilder = {
      select: jest.fn<any>(() => lookupBuilder),
      eq: jest.fn<any>(() => lookupBuilder),
      maybeSingle: jest.fn<any>().mockResolvedValue({
        data: { id: taskId, field_id: "field-1" },
        error: null,
      }),
    }

    const singleWrapper = {
      single: jest.fn<any>().mockResolvedValue({
        data: { id: taskId, field_id: "field-1", status: "completed" },
        error: null,
      }),
    }

    const updateBuilder = {
      update: jest.fn<any>(() => ({
        eq: jest.fn<any>(() => ({
          select: jest.fn<any>(() => singleWrapper),
        })),
      })),
    }

    buildersQueue.push(lookupBuilder, updateBuilder)

    const supabase = {
      from: jest.fn<any>(() => buildersQueue.shift()),
    }

    mockedGetUserSupabase.mockResolvedValue({ supabase, user } as any)

    const response = await updateTask(
      new Request(`${baseUrl}/${taskId}`, {
        method: "PUT",
        body: JSON.stringify({ status: "completed" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: { taskId } },
    )

    expect(response.status).toBe(200)
    const body = (await response.json()) as any
    expect(body.task.status).toBe("completed")
  })

  it("deletes a task", async () => {
    const taskId = "11111111-2222-3333-4444-555555555555"
    const buildersQueue: any[] = []

    const lookupBuilder = {
      select: jest.fn<any>(() => lookupBuilder),
      eq: jest.fn<any>(() => lookupBuilder),
      maybeSingle: jest.fn<any>().mockResolvedValue({
        data: { id: taskId, field_id: "field-1" },
        error: null,
      }),
    }

    const deleteBuilder = {
      delete: jest.fn<any>(() => ({
        eq: jest.fn<any>(() => Promise.resolve({ error: null })),
      })),
    }

    buildersQueue.push(lookupBuilder, deleteBuilder)

    const supabase = {
      from: jest.fn<any>(() => buildersQueue.shift()),
    }

    mockedGetUserSupabase.mockResolvedValue({ supabase, user } as any)

    const response = await deleteTask(new Request(`${baseUrl}/${taskId}`, { method: "DELETE" }), {
      params: { taskId },
    })

    expect(response.status).toBe(200)
    const body = (await response.json()) as Record<string, unknown>
    expect(body.code).toBe("SUCCESS")
  })

  it("blocks unauthorized updates", async () => {
    const taskId = "11111111-2222-3333-4444-555555555555"
    const lookupBuilder = {
      select: jest.fn<any>(() => lookupBuilder),
      eq: jest.fn<any>(() => lookupBuilder),
      maybeSingle: jest.fn<any>().mockResolvedValue({ data: null, error: null }),
    }

    const supabase = {
      from: jest.fn<any>(() => lookupBuilder),
    }

    mockedGetUserSupabase.mockResolvedValue({ supabase, user } as any)

    const response = await updateTask(
      new Request(`${baseUrl}/${taskId}`, {
        method: "PUT",
        body: JSON.stringify({ status: "completed" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: { taskId } },
    )

    expect(response.status).toBe(403)
    const body = (await response.json()) as Record<string, unknown>
    expect(body.code).toBe("FORBIDDEN")
  })
})
